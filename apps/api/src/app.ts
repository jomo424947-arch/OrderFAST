import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import { env } from './config/env.js';
import { AppError } from './shared/errors/index.js';
import { generateId } from './shared/id/index.js';
import { testDbConnection } from './db/client.js';

// Route Modules
import { authRoutes } from './modules/auth/auth.routes.js';
import { kioskRoutes } from './modules/kiosks/kiosk.routes.js';
import { catalogRoutes } from './modules/catalog/catalog.routes.js';
import { orderRoutes } from './modules/orders/order.routes.js';
import { notificationRoutes } from './modules/notifications/notification.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
    genReqId: () => generateId(),
    disableRequestLogging: true,
    bodyLimit: 1048576, // 1MB maximum body payload
    connectionTimeout: 30000, // 30s connection timeout
  });

  // Custom clean, colorized single-line HTTP logger
  app.addHook('onResponse', async (request, reply) => {
    const status = reply.statusCode;
    let statusColor = '\x1b[32m'; // green 2xx
    if (status >= 500) {
      statusColor = '\x1b[31m'; // red 5xx
    } else if (status >= 400) {
      statusColor = '\x1b[33m'; // yellow 4xx
    } else if (status >= 300) {
      statusColor = '\x1b[36m'; // cyan 3xx
    }

    const reset = '\x1b[0m';
    const cyan = '\x1b[36m';
    const time = reply.elapsedTime ? reply.elapsedTime.toFixed(3) : '0.000';
    const len = reply.getHeader('content-length') || '-';

    console.log(
      `${cyan}[server]${reset} ${request.method} ${request.url} ${statusColor}${status}${reset} ${time} ms - ${len}`
    );
  });

  // 1. Register Core Security & Utility Plugins
  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  // Strict CORS whitelist (security hardening — prevents cross-origin data theft)
  const allowedOrigins = [
    'https://www.fast0rder.online',
    'https://fast0rder.online',
    'capacitor://localhost',
    'http://localhost',
  ];
  // Add configured CORS_ORIGIN if set and not already included
  if (env.CORS_ORIGIN && !allowedOrigins.includes(env.CORS_ORIGIN)) {
    allowedOrigins.push(env.CORS_ORIGIN);
  }

  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, server-to-server, curl)
      if (!origin) return cb(null, true);
      // Allow exact matches or localhost with any port
      const isAllowed = allowedOrigins.some((allowed) =>
        origin === allowed || origin.startsWith('http://localhost:')
      );
      cb(null, isAllowed);
    },
    credentials: true,
  });

  await app.register(sensible);

  await app.register(rateLimit, {
    max: 300,
    timeWindow: '1 minute',
    // Key by IP only — prevents bypass via random Authorization header rotation
    keyGenerator: (request) => request.ip,
  });

  // Handle empty or whitespace body with application/json header safely
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    try {
      const text = typeof body === 'string' ? body.trim() : '';
      const json = text.length > 0 ? JSON.parse(text) : {};
      done(null, json);
    } catch (err: any) {
      err.statusCode = 400;
      done(err, undefined);
    }
  });

  // 2. Global Error Handler
  app.setErrorHandler((error, request, reply) => {
    if ((error.statusCode && error.statusCode >= 500) || !error.statusCode) {
      console.error(`\x1b[31m[error]\x1b[0m ${request.method} ${request.url}:`, error.message);
    }

    // Handle AppError
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          requestId: request.id,
        },
      });
    }

    // Handle Zod Validation Error (support monorepo dual-instance ZodError)
    if (
      error instanceof ZodError ||
      error.name === 'ZodError' ||
      ('issues' in (error as any) && Array.isArray((error as any).issues))
    ) {
      const issues = (error as any).issues || (error as any).errors || [];
      return reply.status(422).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'بيانات الطلب غير صالحة',
          details: issues.map((e: any) => ({
            path: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
            message: e.message,
          })),
          requestId: request.id,
        },
      });
    }

    // Handle standard Fastify errors (e.g. 429 rate limit)
    if (error.statusCode) {
      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: 'HTTP_ERROR',
          message: error.message,
          requestId: request.id,
        },
      });
    }

    // Handle PostgreSQL Driver Client Errors (e.g. 22P02 invalid input syntax for type uuid)
    const errCode = (error as any).code || (error as any).originalError?.code;
    if (errCode === '22P02' || error.message?.includes('invalid input syntax for type uuid')) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'INVALID_ID_FORMAT',
          message: 'صيغة المعرف المرسل غير صالحة',
          requestId: request.id,
        },
      });
    }

    // Handle PostgreSQL Unique Constraint Violation (23505)
    if (errCode === '23505') {
      return reply.status(409).send({
        success: false,
        error: {
          code: 'RESOURCE_CONFLICT',
          message: 'تعارض في البيانات: السجل أو المفتاح مستخدم مسبقاً',
          requestId: request.id,
        },
      });
    }

    // Fallback Internal Server Error
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'حدث خطأ داخلي غير متوقع',
        requestId: request.id,
      },
    });
  });

  // 3. Health Check Routes (supports both /api/health and /health)
  // Cache DB probe result for 10 seconds to prevent connection exhaustion
  let healthCache: { result: any; expiresAt: number } | null = null;
  const healthCheckHandler = async (_req: any, reply: any) => {
    const now = Date.now();
    if (healthCache && now < healthCache.expiresAt) {
      return reply.status(healthCache.result.database === 'connected' ? 200 : 503).send(healthCache.result);
    }
    const isDbConnected = await testDbConnection();
    const { isFirebaseConfigured } = await import('./modules/notifications/firebase.config.js');
    const isFbConfigured = isFirebaseConfigured();
    const status = isDbConnected ? 'healthy' : 'degraded';
    const result = {
      status,
      timestamp: new Date().toISOString(),
      service: 'orderfast-api',
      database: isDbConnected ? 'connected' : 'disconnected',
      firebasePush: isFbConfigured ? 'active' : 'standby_missing_key',
    };
    healthCache = { result, expiresAt: now + 10_000 };
    return reply.status(isDbConnected ? 200 : 503).send(result);
  };

  app.get('/api/health', healthCheckHandler);
  app.get('/health', healthCheckHandler);

  // 4. Register Module Routes (supports both /api/* and root /* to prevent 404s if /api was omitted in frontend config)
  for (const prefix of ['/api', '']) {
    await app.register(authRoutes, { prefix: `${prefix}/auth` });
    await app.register(kioskRoutes, { prefix: `${prefix}/kiosks` });
    await app.register(catalogRoutes, { prefix: `${prefix}` });
    await app.register(orderRoutes, { prefix: `${prefix}/orders` });
    await app.register(notificationRoutes, { prefix: `${prefix}/notifications` });
  }

  return app;
}

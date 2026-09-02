import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
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

  // 1. Register Core Plugins
  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  await app.register(sensible);

  await app.register(rateLimit, {
    max: 300,
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Key by user's unique token signature to prevent university NAT/Wi-Fi collision
        return authHeader.substring(7, 45);
      }
      return request.ip;
    },
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

  // 3. Health Check Route
  app.get('/api/health', async (_req, reply) => {
    const isDbConnected = await testDbConnection();
    const status = isDbConnected ? 'healthy' : 'degraded';
    return reply.status(isDbConnected ? 200 : 503).send({
      status,
      timestamp: new Date().toISOString(),
      service: 'orderfast-api',
      version: '1.0.0',
      database: isDbConnected ? 'connected' : 'disconnected',
    });
  });

  // 4. Register Module Routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(kioskRoutes, { prefix: '/api/kiosks' });
  await app.register(catalogRoutes, { prefix: '/api' });
  await app.register(orderRoutes, { prefix: '/api/orders' });
  await app.register(notificationRoutes, { prefix: '/api/notifications' });

  return app;
}

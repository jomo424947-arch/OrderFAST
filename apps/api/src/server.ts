import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';
import { env } from './config/env.js';
import { expiryWorker } from './modules/workers/expiry.worker.js';
import { pool } from './db/client.js';

let app: FastifyInstance | null = null;
let isShuttingDown = false;

async function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`Received ${signal}, shutting down gracefully...`);

  try {
    expiryWorker.stop();
    if (app) {
      await app.close();
      console.log('Fastify server closed.');
    }
    await pool.end();
    console.log('PostgreSQL connection pool closed.');
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }

  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

async function start() {
  try {
    app = await buildApp();

    const address = await app.listen({
      port: env.PORT,
      host: env.HOST,
    });
    console.log(`🚀 OrderFAST Backend API running at ${address}`);
    console.log(`🩺 Health check available at ${address}/api/health`);

    // Start background workers
    expiryWorker.start(20000); // Scans every 20s
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// OrderFAST API Server
start();

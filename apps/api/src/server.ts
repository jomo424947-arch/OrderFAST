import { buildApp } from './app.js';
import { env } from './config/env.js';
import { expiryWorker } from './modules/workers/expiry.worker.js';

async function start() {
  const app = await buildApp();

  try {
    const address = await app.listen({
      port: env.PORT,
      host: env.HOST,
    });
    console.log(`🚀 OrderFAST Backend API running at ${address}`);
    console.log(`🩺 Health check available at ${address}/api/health`);

    // Start background workers
    expiryWorker.start(20000); // Scans every 20s
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  expiryWorker.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  expiryWorker.stop();
  process.exit(0);
});

// OrderFAST API Server - Combo support enabled
start();

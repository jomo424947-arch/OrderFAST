import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
import { env } from '../config/env.js';

import { logger } from '../shared/logger/index.js';

const { Pool } = pg;

const isLocal =
  env.DATABASE_URL.includes('localhost') ||
  env.DATABASE_URL.includes('127.0.0.1');

// Supabase pooler (both session :5432 and transaction :6543) works without SSL;
// SSL causes connection timeouts on the pooler endpoint.
const isPooler = env.DATABASE_URL.includes('pooler.supabase.com');

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Transaction mode pooler shares connections per-transaction (not per-session),
  // so higher max is safe — slots are released after each COMMIT/ROLLBACK.
  max: isPooler ? 25 : 30,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: isLocal || isPooler ? false : { rejectUnauthorized: false },
});

// P1-9: Background pool health monitor — logs alert if queue of waiting clients forms
const poolMonitorInterval = setInterval(() => {
  if (pool.waitingCount > 0) {
    logger.warn(
      {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      },
      '⚠️ PostgreSQL connection pool under contention: clients waiting for connection'
    );
  }
}, 10000);
poolMonitorInterval.unref();

export const db = drizzle(pool, { schema });

export async function testDbConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    client.release();
    return true;
  } catch (error) {
    logger.error({ err: error }, '❌ Failed to connect to PostgreSQL database');
    return false;
  }
}


import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
import { env } from '../config/env.js';

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
  max: isPooler ? 15 : 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 60000,
  ssl: isLocal || isPooler ? false : { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });

export async function testDbConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL database:', error);
    return false;
  }
}


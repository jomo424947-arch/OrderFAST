import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), 'apps/api/.env') });

import { pool, testDbConnection } from '../apps/api/src/db/client.js';

async function check() {
  console.log('Testing DB connection...');
  const connected = await testDbConnection();
  console.log('DB Connection Result:', connected);

  if (connected) {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Public tables in DB:', res.rows.map((r: any) => r.table_name));
  }
  await pool.end();
}

check().catch(console.error);

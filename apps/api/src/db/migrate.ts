import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  console.log('🚀 Running OrderFAST Database Schema Migrations...');
  const migrationPath = path.resolve(__dirname, 'migrations/0000_initial_schema.sql');
  const sqlContent = fs.readFileSync(migrationPath, 'utf-8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sqlContent);
    await client.query('COMMIT');
    console.log('✅ Migration 0000_initial_schema.sql executed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Auto-run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

import pg from 'pg';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/api/.env') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  connectionTimeoutMillis: 8000,
});

async function verifyTables() {
  const client = await pool.connect();
  try {
    // List all tables in public schema
    const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('📋 Tables in public schema:');
    tables.forEach((t, i) => console.log(`  ${i + 1}. ${t.table_name}`));

    // Count indexes
    const { rows: idxCount } = await client.query(`
      SELECT count(*) as cnt 
      FROM pg_indexes 
      WHERE schemaname = 'public' AND indexname LIKE 'idx_%';
    `);
    console.log(`\n📋 Custom Performance Indexes: ${idxCount[0].cnt}`);

    // Verify constraints on orders
    const { rows: constraints } = await client.query(`
      SELECT conname, contype
      FROM pg_constraint 
      WHERE conrelid = 'orders'::regclass
      ORDER BY conname;
    `);
    console.log('\n📋 Orders table constraints:');
    constraints.forEach(c => {
      const type: Record<string, string> = { c: 'CHECK', f: 'FOREIGN KEY', p: 'PRIMARY KEY', u: 'UNIQUE' };
      console.log(`  ${c.conname} (${type[c.contype] || c.contype})`);
    });

  } finally {
    client.release();
    await pool.end();
  }
}

verifyTables();

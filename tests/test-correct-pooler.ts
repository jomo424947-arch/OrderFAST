import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

// Correct details from Supabase Dashboard
const rawPassword = 'sA&98i._%@UV-r+';
const encoded = encodeURIComponent(rawPassword);
const connStr = `postgresql://postgres.xjypynrwmreulrxhaepg:${encoded}@aws-1-eu-west-1.pooler.supabase.com:5432/postgres`;

console.log('Testing CORRECT Supabase Pooler: aws-1-eu-west-1.pooler.supabase.com:5432...');

const p = new Pool({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 8000,
});

async function test() {
  try {
    const client = await p.connect();
    const res = await client.query('SELECT current_database(), version();');
    console.log('🎉🎉🎉 SUCCESS! Connected to Supabase PostgreSQL!');
    console.log('Database:', res.rows[0].current_database);
    console.log('Version:', res.rows[0].version);
    client.release();
    await p.end();

    // Update .env
    const envPath = path.resolve(process.cwd(), 'apps/api/.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');
    envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL="${connStr}"`);
    fs.writeFileSync(envPath, envContent, 'utf-8');
    console.log('✅ Updated apps/api/.env with working DATABASE_URL!');
  } catch (err: any) {
    console.log('Failed:', err.message);
    await p.end();
  }
}

test();

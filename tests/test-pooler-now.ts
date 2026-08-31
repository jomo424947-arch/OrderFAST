import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

const rawPassword = 'sA&98i._%@UV-r+';
const encoded = encodeURIComponent(rawPassword);
const projectRef = 'xjypynrwmreulrxhaepg';
const host = 'aws-0-eu-west-1.pooler.supabase.com';

async function testPooler() {
  console.log('Testing enabled Supabase Pooler...');
  for (const port of [5432, 6543]) {
    const connStr = `postgresql://postgres.${projectRef}:${encoded}@${host}:${port}/postgres`;
    console.log(`Connecting to ${host}:${port}...`);
    const p = new Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

    try {
      const client = await p.connect();
      const res = await client.query('SELECT current_database(), version();');
      console.log(`🎉🎉🎉 SUCCESS! Connected to Supabase PostgreSQL on port ${port}!`);
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
      return connStr;
    } catch (err: any) {
      console.log(`Port ${port} failed: ${err.message}`);
      await p.end();
    }
  }
  return null;
}

testPooler();

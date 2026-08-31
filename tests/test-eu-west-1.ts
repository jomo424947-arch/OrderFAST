import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

const rawPasswords = [
  'sA&98i._%@UV-r+',
  '[sA&98i._%@UV-r+]',
  'sA&98i._%@uv-r+',
  '[sA&98i._%@uv-r+]',
];

const projectRef = 'xjypynrwmreulrxhaepg';
const host = 'aws-0-eu-west-1.pooler.supabase.com';

async function testEuWest1() {
  console.log(`Testing pooler for region eu-west-1 (${host})...`);
  for (const pw of rawPasswords) {
    const encoded = encodeURIComponent(pw);
    for (const port of [6543, 5432]) {
      const connStr = `postgresql://postgres.${projectRef}:${encoded}@${host}:${port}/postgres`;
      console.log(`Trying port ${port}, pass length ${pw.length}...`);
      const p = new Pool({
        connectionString: connStr,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      });

      try {
        const client = await p.connect();
        const res = await client.query('SELECT current_database(), version();');
        console.log(`🎉🎉🎉 SUCCESS! Connected to Supabase PostgreSQL in eu-west-1 on port ${port}!`);
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
        console.log(`Failed (port ${port}): ${err.message}`);
        await p.end();
      }
    }
  }
  return null;
}

testEuWest1();

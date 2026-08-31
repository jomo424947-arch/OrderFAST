import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

const rawPasswords = [
  'sA&98i._%@UV-r+',
  '[sA&98i._%@UV-r+]',
];

const projectRef = 'xjypynrwmreulrxhaepg';
const regions = [
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'us-east-1',
  'us-east-2',
  'ap-southeast-1',
  'me-central-1',
];

async function checkPort5432(region: string) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  for (const pw of rawPasswords) {
    const encoded = encodeURIComponent(pw);
    const connStr = `postgresql://postgres.${projectRef}:${encoded}@${host}:5432/postgres`;
    const p = new Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 4000,
    });
    try {
      const c = await p.connect();
      const res = await c.query('SELECT 1 as ok, version();');
      console.log(`🎉 SUCCESS on ${region}:5432! Version:`, res.rows[0].version.substring(0, 40));
      c.release();
      await p.end();
      return connStr;
    } catch (err: any) {
      console.log(`[${region}:5432] => ${err.message}`);
      await p.end();
    }
  }
  return null;
}

async function run() {
  console.log('Testing poolers on standard port 5432...');
  for (const r of regions) {
    const ok = await checkPort5432(r);
    if (ok) {
      const envPath = path.resolve(process.cwd(), 'apps/api/.env');
      let envContent = fs.readFileSync(envPath, 'utf-8');
      envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL="${ok}"`);
      fs.writeFileSync(envPath, envContent, 'utf-8');
      console.log('✅ Updated apps/api/.env with working connection string!');
      return;
    }
  }
}

run();

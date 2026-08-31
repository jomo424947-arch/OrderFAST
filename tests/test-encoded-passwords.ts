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
const allRegions = [
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-north-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-south-1',
  'sa-east-1',
  'ca-central-1',
  'me-central-1',
];

async function checkHost(connStr: string) {
  const p = new Pool({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 4000,
  });

  try {
    const client = await p.connect();
    const res = await client.query('SELECT current_database(), version();');
    client.release();
    await p.end();
    return { ok: true, connStr, version: res.rows[0].version };
  } catch (e: any) {
    await p.end();
    return null;
  }
}

async function findWorking() {
  console.log('Testing direct and pooler connections with encoded password...');

  const tasks: Promise<any>[] = [];

  for (const pw of rawPasswords) {
    const encoded = encodeURIComponent(pw);

    // Direct host
    tasks.push(checkHost(`postgresql://postgres:${encoded}@db.${projectRef}.supabase.co:5432/postgres`));

    // Poolers
    for (const reg of allRegions) {
      for (const port of [6543, 5432]) {
        tasks.push(checkHost(`postgresql://postgres.${projectRef}:${encoded}@aws-0-${reg}.pooler.supabase.com:${port}/postgres`));
      }
    }
  }

  const results = await Promise.all(tasks);
  const matched = results.find(r => r !== null);

  if (matched) {
    console.log('🎉🎉 SUCCESS!! CONNECTED TO SUPABASE POSTGRESQL!');
    console.log('Version:', matched.version);

    // Update .env
    const envPath = path.resolve(process.cwd(), 'apps/api/.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');
    envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL="${matched.connStr}"`);
    fs.writeFileSync(envPath, envContent, 'utf-8');
    console.log('✅ apps/api/.env has been updated with the working encoded connection string!');
    return true;
  } else {
    console.log('❌ Could not connect with tested variants.');
    return false;
  }
}

findWorking();

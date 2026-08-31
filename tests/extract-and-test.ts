import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;
const content = fs.readFileSync(path.resolve(process.cwd(), 'apps/api/.env'), 'utf-8');
const dbLine = content.split('\n').find(l => l.startsWith('DATABASE_URL'))!;

// Extract password between "postgres:" and "@"
const firstColon = dbLine.indexOf('postgres:');
const afterUser = dbLine.substring(firstColon + 'postgres:'.length);
const atIndex = afterUser.indexOf('@');
const realPassword = afterUser.substring(0, atIndex);

console.log('Real password length:', realPassword.length);
console.log('Real password first char:', realPassword[0], 'last char:', realPassword[realPassword.length - 1]);

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
];

async function checkPoolerFast(region: string) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  for (const port of [6543, 5432]) {
    const connStr = `postgresql://postgres.${projectRef}:${encodeURIComponent(realPassword)}@${host}:${port}/postgres`;
    const p = new Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000,
    });
    try {
      const client = await p.connect();
      const res = await client.query('SELECT 1 as ok, version();');
      client.release();
      await p.end();
      return { region, host, port, connStr, version: res.rows[0].version };
    } catch (e: any) {
      await p.end();
    }
  }
  return null;
}

async function run() {
  console.log('Testing extracted real password across all regions in parallel...');
  const results = await Promise.all(allRegions.map(checkPoolerFast));
  const matched = results.find(r => r !== null);
  if (matched) {
    console.log(`🎉 SUCCESS! Connected to Supabase PostgreSQL in region: ${matched.region}!`);
    console.log(`Pooler: ${matched.host}:${matched.port}`);
    console.log(`Version: ${matched.version.substring(0, 40)}`);

    // Write clean DATABASE_URL
    const envPath = path.resolve(process.cwd(), 'apps/api/.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');
    envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL="${matched.connStr}"`);
    fs.writeFileSync(envPath, envContent, 'utf-8');
    console.log('✅ Updated apps/api/.env with pristine working DATABASE_URL!');
  } else {
    console.log('Could not match on scanned pooler regions.');
  }
}

run();

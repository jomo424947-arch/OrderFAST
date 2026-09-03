import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;
const content = fs.readFileSync(path.resolve(process.cwd(), 'apps/api/.env'), 'utf-8');
const dbLine = content.split('\n').find(l => l.startsWith('DATABASE_URL'))!;

const dbTarget = '@db.xjypynrwmreulrxhaepg.supabase.co:5432/postgres';
const beforeHost = dbLine.substring(0, dbLine.indexOf(dbTarget));
const firstColon = beforeHost.indexOf('postgres:');
const fullPassCandidate = beforeHost.substring(firstColon + 'postgres:'.length);

let strippedPass = fullPassCandidate;
if (strippedPass.startsWith('[') && strippedPass.endsWith(']')) {
  strippedPass = strippedPass.substring(1, strippedPass.length - 1);
}

const candidates = [
  strippedPass,
  fullPassCandidate,
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
];

async function checkCombo(pass: string, region: string, port: number) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const connStr = `postgresql://postgres.${projectRef}:${encodeURIComponent(pass)}@${host}:${port}/postgres`;
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
  } catch (e) {
    await p.end();
    return null;
  }
}

async function run() {
  console.log('Testing all combinations in parallel...');
  const tasks: Promise<any>[] = [];
  for (const c of candidates) {
    for (const reg of allRegions) {
      for (const port of [6543, 5432]) {
        tasks.push(checkCombo(c, reg, port));
      }
    }
  }

  const results = await Promise.all(tasks);
  const matched = results.find(r => r !== null);
  if (matched) {
    console.log(`🎉 SUCCESS! Connected to Supabase PostgreSQL! Region: ${matched.region}, Port: ${matched.port}`);
    console.log(`Version: ${matched.version.substring(0, 40)}`);

    const envPath = path.resolve(process.cwd(), 'apps/api/.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');
    envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL="${matched.connStr}"`);
    fs.writeFileSync(envPath, envContent, 'utf-8');
    console.log('✅ Updated apps/api/.env with verified DATABASE_URL!');
  } else {
    console.log('No combination connected.');
  }
}

run();

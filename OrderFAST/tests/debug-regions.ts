import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;
const content = fs.readFileSync(path.resolve(process.cwd(), 'apps/api/.env'), 'utf-8');
const dbLine = content.split('\n').find(l => l.startsWith('DATABASE_URL'))!;
let val = dbLine.substring('DATABASE_URL='.length).trim();
if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
if (val.startsWith("'") && val.endsWith("'")) val = val.substring(1, val.length - 1);

const lastAtIndex = val.lastIndexOf('@');
const authPart = val.substring(0, lastAtIndex);
const hostPart = val.substring(lastAtIndex + 1);

const protoEnd = authPart.indexOf('://');
const userPass = authPart.substring(protoEnd + 3);
const firstColon = userPass.indexOf(':');
const rawPass = userPass.substring(firstColon + 1);

const allRegions = [
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-north-1',
  'eu-south-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'me-central-1',
  'me-south-1',
  'af-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-southeast-3',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-south-1',
  'sa-east-1',
  'ca-central-1',
];

const projectRef = 'xjypynrwmreulrxhaepg';

async function checkRegionDetails(region: string) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const port = 6543;
  const userString = `postgres.${projectRef}`;
  const connStr = `postgresql://${userString}:${encodeURIComponent(rawPass)}@${host}:${port}/postgres`;
  const p = new Pool({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 3000,
  });

  try {
    const client = await p.connect();
    const res = await client.query('SELECT 1;');
    client.release();
    await p.end();
    console.log(`✅ MATCH: ${region}!`);
    return region;
  } catch (err: any) {
    await p.end();
    console.log(`[${region}] => ${err.message}`);
    return null;
  }
}

async function run() {
  for (const r of allRegions) {
    const res = await checkRegionDetails(r);
    if (res) break;
  }
}

run();

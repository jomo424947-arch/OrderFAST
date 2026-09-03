import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;
const content = fs.readFileSync(path.resolve(process.cwd(), 'apps/api/.env'), 'utf-8');
const dbLine = content.split('\n').find(l => l.startsWith('DATABASE_URL'))!;
let val = dbLine.substring('DATABASE_URL='.length).trim();
if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
if (val.startsWith("'") && val.endsWith("'")) val = val.substring(1, val.length - 1);

// Find the last @ which separates auth from hostname
const lastAtIndex = val.lastIndexOf('@');
const authPart = val.substring(0, lastAtIndex); // "postgresql://user:pass..."
const hostPart = val.substring(lastAtIndex + 1); // "db.xjypynrwmreulrxhaepg.supabase.co:5432/postgres..."

console.log('Host/port part detected:', hostPart);

// Extract protocol, username and raw password
const protoEnd = authPart.indexOf('://');
const proto = authPart.substring(0, protoEnd);
const userPass = authPart.substring(protoEnd + 3);
const firstColon = userPass.indexOf(':');
const user = userPass.substring(0, firstColon);
const rawPass = userPass.substring(firstColon + 1);

console.log(`User: ${user}, Raw Password Length: ${rawPass.length}`);

// Test Supabase poolers and direct hosts with encoded password
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

async function checkPooler(region: string) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  for (const port of [6543, 5432]) {
    const userString = user.includes('.') ? user : `postgres.${projectRef}`;
    const connStr = `postgresql://${userString}:${encodeURIComponent(rawPass)}@${host}:${port}/postgres`;
    const p = new Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000,
    });
    try {
      const client = await p.connect();
      const res = await client.query('SELECT current_database(), version();');
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
  console.log('Testing poolers with properly URL-encoded password...');
  const results = await Promise.all(allRegions.map(checkPooler));
  const matched = results.find(r => r !== null);
  if (matched) {
    console.log(`🎉 SUCCESS!! Connected to Supabase PostgreSQL!`);
    console.log(`Region: ${matched.region}`);
    console.log(`Host: ${matched.host}:${matched.port}`);
    console.log(`PostgreSQL Version: ${matched.version.substring(0, 40)}`);

    // Update .env with properly encoded string
    const envPath = path.resolve(process.cwd(), 'apps/api/.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');
    envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL="${matched.connStr}"`);
    fs.writeFileSync(envPath, envContent, 'utf-8');
    console.log('✅ Successfully encoded and saved working DATABASE_URL in apps/api/.env!');
  } else {
    console.log('Could not connect with encoded password on scanned regions.');
  }
}

run();

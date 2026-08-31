import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

const envConfig = dotenv.config({ path: path.resolve(process.cwd(), 'apps/api/.env') }).parsed!;
const { Pool } = pg;

// Extract password from DATABASE_URL
let password = '';
try {
  const parsed = new URL(envConfig.DATABASE_URL);
  password = decodeURIComponent(parsed.password);
} catch (e) {
  console.error('Could not parse DATABASE_URL as URL');
}

const projectRef = 'xjypynrwmreulrxhaepg';

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

async function checkPoolerRegion(region: string) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const ports = [6543, 5432];

  for (const port of ports) {
    const connStr = `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@${host}:${port}/postgres`;
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
    } catch (err: any) {
      await p.end();
      if (err.message.includes('password authentication failed')) {
        console.log(`❌ Auth failed for ${region}:${port} (Region is correct, but password mismatch)`);
      }
    }
  }
  return null;
}

async function main() {
  console.log('Testing Supabase poolers across AWS regions with configured password...');
  const promises = allRegions.map(r => checkPoolerRegion(r));
  const results = await Promise.all(promises);
  const matched = results.find(r => r !== null);

  if (matched) {
    console.log(`🎉 MATCH FOUND! Region: ${matched.region}, Port: ${matched.port}`);
    console.log(`Database connected successfully! Version: ${matched.version.substring(0, 40)}`);
    console.log(`Pooler Host: ${matched.host}`);
    return matched;
  } else {
    console.log('No pooler matched with current settings.');
    return null;
  }
}

main().then(res => {
  if (res) {
    // We can safely update .env with the exact working pooler connection string
    const fs = require('fs');
    const envPath = path.resolve(process.cwd(), 'apps/api/.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');
    envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL="${res.connStr}"`);
    fs.writeFileSync(envPath, envContent, 'utf-8');
    console.log('✅ Updated apps/api/.env with working Supabase Connection Pooler string!');
  }
});

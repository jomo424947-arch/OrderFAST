import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

const envConfig = dotenv.config({ path: path.resolve(process.cwd(), 'apps/api/.env') }).parsed!;
const { Pool } = pg;
const projectRef = 'xjypynrwmreulrxhaepg';

const allRegions = [
  'eu-west-3',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'me-central-1',
  'me-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-south-1',
  'sa-east-1',
  'ca-central-1',
];

async function checkRegion(region: string) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const connStr = `postgresql://postgres.${projectRef}:testpassword@${host}:6543/postgres`;
  const p = new Pool({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 4000,
  });

  try {
    await p.connect();
  } catch (err: any) {
    if (err.message.includes('password authentication failed')) {
      console.log(`🎯 FOUND REGION! The project is located in: ${region} (${host})`);
      return { region, host, status: 'PASSWORD_REQUIRED' };
    } else if (err.message.includes('tenant/user') && err.message.includes('not found')) {
      // not this region
    } else {
      console.log(`Region ${region}: ${err.message}`);
    }
  } finally {
    await p.end();
  }
  return null;
}

async function main() {
  console.log('Testing regions in parallel...');
  const results = await Promise.all(allRegions.map(checkRegion));
  const found = results.find(r => r !== null);
  if (found) {
    console.log('Found region match:', found);
  } else {
    console.log('No region matched with postgres.<ref> on tested regions.');
  }
}

main();

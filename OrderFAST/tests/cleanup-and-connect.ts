import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;
const content = fs.readFileSync(path.resolve(process.cwd(), 'apps/api/.env'), 'utf-8');
const dbLine = content.split('\n').find(l => l.startsWith('DATABASE_URL'))!;
let val = dbLine.substring('DATABASE_URL='.length).trim();
if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
if (val.startsWith("'") && val.endsWith("'")) val = val.substring(1, val.length - 1);

const occurrences = val.split('postgresql://');
// The valid segment is the last one
const validSegment = occurrences[occurrences.length - 1];
const cleanConnStr = `postgresql://${validSegment}`;

console.log('Testing cleaned connection string...');

const lastAt = validSegment.lastIndexOf('@');
const auth = validSegment.substring(0, lastAt);
const hostPart = validSegment.substring(lastAt + 1);
const firstCol = auth.indexOf(':');
const user = auth.substring(0, firstCol);
const rawPass = auth.substring(firstCol + 1);

console.log(`Cleaned host: ${hostPart}, user: ${user}`);

const allRegions = [
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ap-southeast-1',
  'ap-south-1',
  'sa-east-1',
];

async function tryConnect() {
  // First try direct host with encoded pass
  const directConn = `postgresql://${user}:${encodeURIComponent(rawPass)}@${hostPart}`;
  const p1 = new Pool({
    connectionString: directConn,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 4000,
  });

  try {
    const c = await p1.connect();
    const res = await c.query('SELECT 1 as ok, version();');
    console.log('🎉 DIRECT CONNECTION SUCCESSFUL!', res.rows[0].version.substring(0, 40));
    c.release();
    await p1.end();
    return directConn;
  } catch (e: any) {
    console.log(`Direct connection note: ${e.message}`);
    await p1.end();
  }

  // Try poolers
  for (const reg of allRegions) {
    const poolerHost = `aws-0-${reg}.pooler.supabase.com`;
    for (const port of [6543, 5432]) {
      const userFull = user.includes('.') ? user : `postgres.xjypynrwmreulrxhaepg`;
      const poolerConn = `postgresql://${userFull}:${encodeURIComponent(rawPass)}@${poolerHost}:${port}/postgres`;
      const p2 = new Pool({
        connectionString: poolerConn,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 3000,
      });
      try {
        const c = await p2.connect();
        const res = await c.query('SELECT 1 as ok, version();');
        console.log(`🎉 POOLER CONNECTION SUCCESSFUL (${reg}:${port})!`, res.rows[0].version.substring(0, 40));
        c.release();
        await p2.end();
        return poolerConn;
      } catch (err: any) {
        await p2.end();
      }
    }
  }
  return null;
}

tryConnect().then(workingConn => {
  if (workingConn) {
    const envPath = path.resolve(process.cwd(), 'apps/api/.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');
    envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL="${workingConn}"`);
    fs.writeFileSync(envPath, envContent, 'utf-8');
    console.log('✅ Successfully updated apps/api/.env with working DATABASE_URL!');
  } else {
    console.log('Failed to connect with parsed password on all targets.');
  }
});

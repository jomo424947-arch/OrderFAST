import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;
const content = fs.readFileSync(path.resolve(process.cwd(), 'apps/api/.env'), 'utf-8');
const dbLine = content.split('\n').find(l => l.startsWith('DATABASE_URL'))!;

// Let's parse out the full substring before @db.xjypynrwmreulrxhaepg
const dbTarget = '@db.xjypynrwmreulrxhaepg.supabase.co:5432/postgres';
const beforeHost = dbLine.substring(0, dbLine.indexOf(dbTarget));
const firstColon = beforeHost.indexOf('postgres:');
const fullPassCandidate = beforeHost.substring(firstColon + 'postgres:'.length);

console.log('Full candidate length:', fullPassCandidate.length);
console.log('Candidate starts with:', fullPassCandidate.substring(0, 3));
console.log('Candidate ends with:', fullPassCandidate.substring(fullPassCandidate.length - 3));

// Remove outer brackets if present
let strippedPass = fullPassCandidate;
if (strippedPass.startsWith('[') && strippedPass.endsWith(']')) {
  strippedPass = strippedPass.substring(1, strippedPass.length - 1);
}

const candidates = [
  strippedPass,
  fullPassCandidate,
  strippedPass.trim(),
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

async function checkPass(pass: string) {
  for (const reg of allRegions) {
    const host = `aws-0-${reg}.pooler.supabase.com`;
    for (const port of [6543, 5432]) {
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
        console.log(`🎉 SUCCESS! Connected to Supabase PostgreSQL! Region: ${reg}, Port: ${port}`);
        console.log(`Version: ${res.rows[0].version.substring(0, 40)}`);
        return connStr;
      } catch (e: any) {
        await p.end();
      }
    }
  }
  return null;
}

async function run() {
  for (const c of candidates) {
    const res = await checkPass(c);
    if (res) {
      const envPath = path.resolve(process.cwd(), 'apps/api/.env');
      let envContent = fs.readFileSync(envPath, 'utf-8');
      envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL="${res}"`);
      fs.writeFileSync(envPath, envContent, 'utf-8');
      console.log('✅ Updated apps/api/.env with verified DATABASE_URL!');
      return;
    }
  }
  console.log('Could not connect with candidate passwords.');
}

run();

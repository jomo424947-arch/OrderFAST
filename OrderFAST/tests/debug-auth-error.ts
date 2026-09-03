import pg from 'pg';
const { Pool } = pg;

const rawPasswords = [
  'sA&98i._%@UV-r+',
  '[sA&98i._%@UV-r+]',
];

const projectRef = 'xjypynrwmreulrxhaepg';
const allRegions = [
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'us-east-1',
  'us-east-2',
];

async function testOne(region: string) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  for (const pw of rawPasswords) {
    const encoded = encodeURIComponent(pw);
    const connStr = `postgresql://postgres.${projectRef}:${encoded}@${host}:6543/postgres`;
    const p = new Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000,
    });
    try {
      await p.connect();
      console.log(`✅ SUCCESS on ${region}!`);
      await p.end();
      return;
    } catch (e: any) {
      console.log(`[${region}] (pass length ${pw.length}) => ${e.message}`);
      await p.end();
    }
  }
}

async function run() {
  for (const r of allRegions) {
    await testOne(r);
  }
}

run();

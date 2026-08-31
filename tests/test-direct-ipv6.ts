import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

const rawPasswords = [
  'sA&98i._%@UV-r+',
  '[sA&98i._%@UV-r+]',
];

const ipv6Host = '2a05:d018:65a:e200:821a:ff43:23c2:c24';

async function testDirectV6() {
  console.log(`Testing direct IPv6 connection to [${ipv6Host}]:5432...`);
  for (const pw of rawPasswords) {
    const encoded = encodeURIComponent(pw);
    const connStr = `postgresql://postgres:${encoded}@[${ipv6Host}]:5432/postgres`;
    const p = new Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 4000,
    });

    try {
      const client = await p.connect();
      const res = await client.query('SELECT current_database(), version();');
      console.log(`🎉🎉🎉 SUCCESS! Connected directly to Supabase PostgreSQL via IPv6!`);
      console.log('Version:', res.rows[0].version);
      client.release();
      await p.end();

      // Update .env with working string
      const envPath = path.resolve(process.cwd(), 'apps/api/.env');
      let envContent = fs.readFileSync(envPath, 'utf-8');
      envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL="${connStr}"`);
      fs.writeFileSync(envPath, envContent, 'utf-8');
      console.log('✅ Updated apps/api/.env with working direct IPv6 DATABASE_URL!');
      return connStr;
    } catch (err: any) {
      console.log(`Direct IPv6 attempt (pass length ${pw.length}) failed: ${err.message}`);
      await p.end();
    }
  }
  return null;
}

testDirectV6();

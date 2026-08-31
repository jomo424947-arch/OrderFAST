import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

const rawPassword = 'sA&98i._%@UV-r+';
const encoded = encodeURIComponent(rawPassword);
const host = 'aws-1-eu-west-1.pooler.supabase.com';
const user = 'postgres.xjypynrwmreulrxhaepg';

const configs = [
  { port: 6543, ssl: true, label: 'port 6543 + SSL' },
  { port: 6543, ssl: false, label: 'port 6543 no SSL' },
  { port: 5432, ssl: false, label: 'port 5432 no SSL' },
  { port: 5432, ssl: true, label: 'port 5432 + SSL' },
];

async function testAll() {
  for (const cfg of configs) {
    const connStr = `postgresql://${user}:${encoded}@${host}:${cfg.port}/postgres`;
    console.log(`\nTrying ${cfg.label}...`);
    
    const poolConfig: any = {
      connectionString: connStr,
      connectionTimeoutMillis: 6000,
    };
    if (cfg.ssl) {
      poolConfig.ssl = { rejectUnauthorized: false };
    }
    
    const p = new Pool(poolConfig);
    try {
      const client = await p.connect();
      const res = await client.query('SELECT current_database(), version();');
      console.log(`🎉🎉🎉 SUCCESS with ${cfg.label}!`);
      console.log('Database:', res.rows[0].current_database);
      console.log('Version:', res.rows[0].version);
      client.release();
      await p.end();

      // Update .env
      const envPath = path.resolve(process.cwd(), 'apps/api/.env');
      let envContent = fs.readFileSync(envPath, 'utf-8');
      envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL="${connStr}"`);
      fs.writeFileSync(envPath, envContent, 'utf-8');
      console.log(`✅ Updated .env with ${cfg.label} connection string!`);
      console.log(`SSL needed: ${cfg.ssl}`);
      return;
    } catch (err: any) {
      console.log(`Failed (${cfg.label}): ${err.message}`);
      await p.end();
    }
  }
  console.log('\n❌ All attempts failed.');
}

testAll();

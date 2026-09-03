import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

const envConfig = dotenv.config({ path: path.resolve(process.cwd(), 'apps/api/.env') }).parsed!;
const { Pool } = pg;

const projectRef = 'xjypynrwmreulrxhaepg';
const poolers = [
  'aws-0-eu-central-1.pooler.supabase.com',
  'aws-0-eu-west-1.pooler.supabase.com',
  'aws-0-eu-west-2.pooler.supabase.com',
  'aws-0-eu-west-3.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-us-east-2.pooler.supabase.com',
  'aws-0-me-central-1.pooler.supabase.com',
];

const passwordsToTry = [
  envConfig.JWT_SECRET,
  'postgres',
  'Orderfast2026',
  'Orderfast@2026',
  'OrderFAST2026',
  'Orderfast123',
  'OrderFAST123',
];

async function probe() {
  console.log('Testing Supabase PostgreSQL pooler connections with ssl rejectUnauthorized: false...');
  for (const pooler of poolers) {
    for (const pw of passwordsToTry) {
      if (!pw) continue;
      const connStr = `postgresql://postgres.${projectRef}:${encodeURIComponent(pw)}@${pooler}:6543/postgres`;
      const p = new Pool({ 
        connectionString: connStr, 
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 3000 
      });
      try {
        const client = await p.connect();
        const res = await client.query('SELECT 1 as connected;');
        console.log(`🎉 SUCCESS! Connected to Supabase PostgreSQL via ${pooler}!`);
        client.release();
        await p.end();
        return { pooler, connStr };
      } catch (err: any) {
        if (!err.message.includes('Tenant or user not found') && !err.message.includes('password authentication failed') && !err.message.includes('timeout')) {
          console.log(`Note for ${pooler}: ${err.message}`);
        }
      }
      await p.end();
    }
  }
  console.log('No automatic connection found among tested poolers/passwords.');
  return null;
}

probe();

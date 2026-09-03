import pg from 'pg';
const { Pool } = pg;

const connectionStrings = [
  'postgresql://postgres:postgres@localhost:5432/postgres',
  'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
  'postgresql://postgres:root@localhost:5432/postgres',
  'postgresql://postgres:admin@localhost:5432/postgres',
  'postgresql://postgres:123456@localhost:5432/postgres',
];

async function tryConnections() {
  for (const connStr of connectionStrings) {
    const url = new URL(connStr);
    console.log(`Trying ${url.username} on ${url.host}${url.pathname}...`);
    const p = new Pool({ connectionString: connStr, connectionTimeoutMillis: 2000 });
    try {
      const client = await p.connect();
      const res = await client.query('SELECT version();');
      console.log('✅ Connected successfully to local Postgres!');
      console.log('Version:', res.rows[0].version.substring(0, 50));
      client.release();
      await p.end();
      return connStr;
    } catch (err: any) {
      console.log(`❌ Failed: ${err.message}`);
    }
    await p.end();
  }
  return null;
}

tryConnections();

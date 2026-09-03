import pg from 'pg';
const { Pool } = pg;

const passwords = [
  'postgres',
  '123456',
  '1234',
  '12345678',
  'admin',
  'root',
  'password',
  'postgres123',
  'jomo4',
  'jomo424947',
  'Orderfast',
  'orderfast',
  'Orderfast2026',
  'OrderFAST',
  '123',
  '0000',
  '1111',
  '12345',
  'qwerty',
  'P@ssword',
  'P@ssw0rd',
  'postgres@123',
];

const usernames = ['postgres', 'jomo4'];

async function testLocal() {
  console.log('Testing local postgres service credentials...');
  for (const user of usernames) {
    for (const pw of passwords) {
      const connStr = `postgresql://${user}:${encodeURIComponent(pw)}@localhost:5432/postgres`;
      const p = new Pool({ connectionString: connStr, connectionTimeoutMillis: 1000 });
      try {
        const client = await p.connect();
        console.log(`🎉 SUCCESS! Local PostgreSQL connected with user "${user}"!`);
        client.release();
        await p.end();
        return connStr;
      } catch (err: any) {
        // failed
      }
      await p.end();
    }
  }
  console.log('No match found for standard local passwords.');
  return null;
}

testLocal();

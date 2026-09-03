import dotenv from 'dotenv';
import path from 'path';

const envConfig = dotenv.config({ path: path.resolve(process.cwd(), 'apps/api/.env') }).parsed;

if (!envConfig) {
  console.log('No .env found or failed to parse');
} else {
  for (const [key, value] of Object.entries(envConfig)) {
    if (key.includes('SECRET') || key.includes('KEY') || key.includes('PASS') || key.includes('DATABASE_URL')) {
      if (key === 'DATABASE_URL') {
        const url = new URL(value);
        console.log(`${key}: protocol=${url.protocol}, host=${url.host}, pathname=${url.pathname} (Credentials masked)`);
      } else {
        console.log(`${key}: [MASKED, length=${value.length}]`);
      }
    } else {
      console.log(`${key}: ${value}`);
    }
  }
}

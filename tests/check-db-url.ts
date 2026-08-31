import dotenv from 'dotenv';
import path from 'path';

const envConfig = dotenv.config({ path: path.resolve(process.cwd(), 'apps/api/.env') }).parsed;

if (envConfig) {
  console.log('Available keys in apps/api/.env:', Object.keys(envConfig));
  console.log('DATABASE_URL starts with:', envConfig.DATABASE_URL?.substring(0, 20));
  console.log('DATABASE_URL hostname:', new URL(envConfig.DATABASE_URL || 'http://localhost').hostname);
}

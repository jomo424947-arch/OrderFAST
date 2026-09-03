import fs from 'fs';
import path from 'path';

const content = fs.readFileSync(path.resolve(process.cwd(), 'apps/api/.env'), 'utf-8');
const dbLine = content.split('\n').find(l => l.startsWith('DATABASE_URL'));

if (!dbLine) {
  console.log('DATABASE_URL line not found');
} else {
  const val = dbLine.substring('DATABASE_URL='.length).trim();
  console.log('Length of value:', val.length);
  console.log('Starts with:', val.substring(0, 15));
  console.log('Contains @:', val.includes('@'));
  console.log('Contains ://:', val.includes('://'));
  if (val.includes('@')) {
    const parts = val.split('@');
    const hostPart = parts[1];
    console.log('Host/port part:', hostPart);
  }
}

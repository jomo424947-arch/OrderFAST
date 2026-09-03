import fs from 'fs';
import path from 'path';

const content = fs.readFileSync(path.resolve(process.cwd(), 'apps/api/.env'), 'utf-8');
const dbLine = content.split('\n').find(l => l.startsWith('DATABASE_URL'))!;
const val = dbLine.substring('DATABASE_URL='.length).trim();

console.log('Value length:', val.length);
console.log('Starts with first 25 chars:', val.substring(0, 25));

const lastAtIndex = val.lastIndexOf('@');
if (lastAtIndex !== -1) {
  const hostPart = val.substring(lastAtIndex + 1);
  console.log('Host/port part:', hostPart);
}

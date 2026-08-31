import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;
const content = fs.readFileSync(path.resolve(process.cwd(), 'apps/api/.env'), 'utf-8');
const dbLine = content.split('\n').find(l => l.startsWith('DATABASE_URL'))!;
let val = dbLine.substring('DATABASE_URL='.length).trim();
if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
if (val.startsWith("'") && val.endsWith("'")) val = val.substring(1, val.length - 1);

console.log('Original value length:', val.length);

// Check if there are multiple occurrences of postgresql://
const occurrences = val.split('postgresql://');
console.log('Occurrences of postgresql://:', occurrences.length - 1);

for (let i = 1; i < occurrences.length; i++) {
  const segment = occurrences[i];
  console.log(`Segment ${i} length: ${segment.length}`);
  const lastAt = segment.lastIndexOf('@');
  if (lastAt !== -1) {
    const auth = segment.substring(0, lastAt);
    const host = segment.substring(lastAt + 1);
    console.log(`Segment ${i} host: ${host}`);
    const firstCol = auth.indexOf(':');
    if (firstCol !== -1) {
      const user = auth.substring(0, firstCol);
      const rawPass = auth.substring(firstCol + 1);
      console.log(`Segment ${i} user: ${user}, pass length: ${rawPass.length}`);
    }
  }
}

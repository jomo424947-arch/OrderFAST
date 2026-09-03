import fs from 'fs';
import path from 'path';

const content = fs.readFileSync(path.resolve(process.cwd(), 'apps/api/.env'), 'utf-8');
const lines = content.split('\n');
console.log('Total lines:', lines.length);
lines.forEach((l, i) => {
  if (l.startsWith('DATABASE_URL')) {
    console.log(`Line ${i+1}: Length = ${l.length}`);
    console.log(`Line ${i+1} prefix = ${l.substring(0, 30)}`);
  }
});

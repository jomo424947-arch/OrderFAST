import fs from 'fs';
import path from 'path';

const content = fs.readFileSync(path.resolve(process.cwd(), 'apps/api/.env'), 'utf-8');
const lines = content.split('\n');
console.log('Total lines in apps/api/.env:', lines.length);
lines.forEach((l, idx) => {
  const trimmed = l.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    console.log(`Line ${idx + 1}: [Comment/Empty] ${trimmed}`);
  } else {
    const [key] = trimmed.split('=');
    console.log(`Line ${idx + 1}: Key = ${key}`);
  }
});

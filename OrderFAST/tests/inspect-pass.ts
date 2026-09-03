import fs from 'fs';
import path from 'path';

const content = fs.readFileSync(path.resolve(process.cwd(), 'apps/api/.env'), 'utf-8');
const dbLine = content.split('\n').find(l => l.startsWith('DATABASE_URL'))!;
const occurrences = dbLine.split('postgresql://');
const validSegment = occurrences[occurrences.length - 1];
const lastAt = validSegment.lastIndexOf('@');
const auth = validSegment.substring(0, lastAt);
const firstCol = auth.indexOf(':');
const rawPass = auth.substring(firstCol + 1);

console.log('Password length:', rawPass.length);
console.log('Password starts with:', rawPass.substring(0, 10));
console.log('Password ends with:', rawPass.substring(rawPass.length - 10));
console.log('Contains letters/numbers/special:', {
  hasUpper: /[A-Z]/.test(rawPass),
  hasLower: /[a-z]/.test(rawPass),
  hasDigit: /[0-9]/.test(rawPass),
  hasSpecial: /[^A-Za-z0-9]/.test(rawPass),
});

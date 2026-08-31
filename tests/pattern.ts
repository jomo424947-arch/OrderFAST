import fs from 'fs';
import path from 'path';

const content = fs.readFileSync(path.resolve(process.cwd(), 'apps/api/.env'), 'utf-8');
const dbLine = content.split('\n').find(l => l.startsWith('DATABASE_URL'))!;
console.log('Full line without secret:');
// Replace alphanumeric and special characters with their type
const masked = dbLine.replace(/[A-Za-z0-9]/g, 'x').replace(/[^x:\/=@\.]/g, '?');
console.log('Masked pattern:', masked);

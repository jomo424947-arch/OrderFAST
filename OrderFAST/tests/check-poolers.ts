import dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);

const regions = [
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'me-central-1',
  'me-south-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-south-1',
  'sa-east-1',
];

async function checkPoolers() {
  console.log('Scanning Supabase pooler regions for project xjypynrwmreulrxhaepg...');
  for (const r of regions) {
    const host = `aws-0-${r}.pooler.supabase.com`;
    try {
      const res = await lookup(host);
      console.log(`Pooler host reachable: ${host} -> IP: ${res.address}`);
    } catch (e: any) {
      // not found
    }
  }
}

checkPoolers();

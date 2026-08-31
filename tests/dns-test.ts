import dns from 'dns';

dns.lookup('db.xjypynrwmreulrxhaepg.supabase.co', (err, address, family) => {
  if (err) {
    console.log('DNS Lookup error for db.xjypynrwmreulrxhaepg.supabase.co:', err.message);
  } else {
    console.log('DNS Lookup successful:', address, 'family:', family);
  }
});

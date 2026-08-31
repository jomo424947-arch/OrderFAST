import dns from 'dns';

dns.resolve6('db.xjypynrwmreulrxhaepg.supabase.co', (err, addresses) => {
  if (err) {
    console.log('resolve6 error:', err.message);
  } else {
    console.log('resolve6 addresses:', addresses);
  }
});

dns.resolve4('db.xjypynrwmreulrxhaepg.supabase.co', (err, addresses) => {
  if (err) {
    console.log('resolve4 error:', err.message);
  } else {
    console.log('resolve4 addresses:', addresses);
  }
});

import dns from 'dns';

const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1']);

resolver.resolve4('db.xjypynrwmreulrxhaepg.supabase.co', (err, addresses) => {
  if (err) {
    console.log('Google DNS IPv4 error:', err.message);
  } else {
    console.log('Google DNS IPv4 addresses:', addresses);
  }
});

resolver.resolve6('db.xjypynrwmreulrxhaepg.supabase.co', (err, addresses) => {
  if (err) {
    console.log('Google DNS IPv6 error:', err.message);
  } else {
    console.log('Google DNS IPv6 addresses:', addresses);
  }
});

/** @type {import('next').NextConfig} */

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://*.logrocket.io https://*.logrocket.com https://*.lr-ingest.io https://*.lr-in.com https://*.lr-in-prod.com https://*.lr-ingest.com https://*.ingest-lr.com https://*.lr-intake.com https://*.intake-lr.com https://*.logr-ingest.com https://*.lrkt-in.com https://*.lgrckt-in.com https://*.logr-in.com",
      "worker-src 'self' blob:",
      "child-src 'self' blob:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://fast0rder.online https://*.fast0rder.online https://images.unsplash.com https://placeholder.com https://xjypynrwmreulrxhaepg.supabase.co",
      "connect-src 'self' https://fast0rder.online https://*.fast0rder.online wss://fast0rder.online wss://*.fast0rder.online https://xjypynrwmreulrxhaepg.supabase.co wss://xjypynrwmreulrxhaepg.supabase.co https://*.railway.app http://localhost:4000 http://localhost:3000 ws://localhost:4000 ws://localhost:3000 https://vitals.vercel-insights.com https://va.vercel-scripts.com https://*.logrocket.io https://*.lr-ingest.io https://*.logrocket.com https://*.lr-in.com https://*.lr-in-prod.com https://*.lr-ingest.com https://*.ingest-lr.com https://*.lr-intake.com https://*.intake-lr.com https://*.logr-ingest.com https://*.lrkt-in.com https://*.lgrckt-in.com https://*.logr-in.com wss://*.logrocket.io",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; '),
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  images: {
    domains: ['images.unsplash.com', 'placeholder.com', 'xjypynrwmreulrxhaepg.supabase.co'],
    unoptimized: true
  }
};

export default nextConfig;

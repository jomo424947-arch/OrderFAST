import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'OrderFAST — ORDER • WAIT • ENJOY',
  description: 'منصة طلب وتتبع أوردرات أكشاك الحرم الجامعي — اطلب من مكانك واعرف دورك قبل ما تنزل.',
  keywords: ['OrderFAST', 'جامعة', 'كشك', 'أوردر', 'طابور', 'حرم جامعي'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=El+Messiri:wght@500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-canvas text-ink antialiased flex flex-col font-body selection:bg-primary-soft selection:text-primary-ink">
        {children}
      </body>
    </html>
  );
}

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Store, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 text-center">
      <div className="w-20 h-20 rounded-3xl bg-primary-soft text-primary-ink flex items-center justify-center mb-6">
        <Store className="w-10 h-10" />
      </div>
      <h1 className="font-mono text-5xl font-black text-ink mb-2">404</h1>
      <h2 className="font-display font-bold text-2xl text-ink mb-2">
        الصفحة غير موجودة
      </h2>
      <p className="font-body text-xs sm:text-sm text-ink-soft max-w-sm mb-6 leading-relaxed">
        يبدو أن الصفحة التي تبحث عنها غير متوفرة أو تم تغيير مسارها.
      </p>
      <Link href="/student">
        <Button variant="primary" size="md">
          <Home className="w-4 h-4 ml-1" />
          العودة للرئيسية
        </Button>
      </Link>
    </div>
  );
}

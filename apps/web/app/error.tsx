'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-danger-soft text-danger flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h2 className="font-display font-bold text-2xl text-ink mb-2">
        حصل خطأ غير متوقع
      </h2>
      <p className="font-body text-xs sm:text-sm text-ink-soft max-w-sm mb-6 leading-relaxed">
        حدث خطأ أثناء معالجة طلبك، يرجى المحاولة مرة أخرى أو الرجوع للصفحة الرئيسية.
      </p>
      <div className="flex items-center gap-3">
        <Button variant="primary" size="md" onClick={() => reset()}>
          <RotateCcw className="w-4 h-4 ml-1" />
          إعادة المحاولة
        </Button>
        <Link href="/student">
          <Button variant="ghost" size="md">
            الصفحة الرئيسية
          </Button>
        </Link>
      </div>
    </div>
  );
}

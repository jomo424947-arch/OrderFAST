'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/branding/Logo';
import { SupportFeedbackView } from '@/components/student/SupportFeedbackView';
import { useAuthStore } from '@/stores/useAuthStore';
import { ChevronRight, LogIn, User } from 'lucide-react';

export default function StandaloneSupportPage() {
  const router = useRouter();
  const { isAuthenticated, student } = useAuthStore();

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Top Header */}
      <header className="bg-surface border-b border-line sticky top-0 z-30 px-4 py-3 select-none">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-8 h-8 rounded-full bg-canvas border border-line flex items-center justify-center text-ink hover:bg-surface transition-colors"
              aria-label="الرجوع"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <Logo variant="compact" href="/" />
          </div>

          <div>
            {isAuthenticated ? (
              <Link
                href="/student"
                className="flex items-center gap-2 bg-canvas hover:bg-surface border border-line px-3.5 py-1.5 rounded-xl text-xs font-body font-bold text-ink transition-colors"
              >
                <User className="w-3.5 h-3.5 text-accent" />
                <span>{student?.name || 'حسابي'}</span>
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-1.5 bg-primary text-primary-ink px-3.5 py-1.5 rounded-xl text-xs font-body font-bold hover:bg-primary-hover shadow-sm transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>تسجيل الدخول</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 max-w-4xl w-full mx-auto">
        <SupportFeedbackView isEmbedded={false} />
      </main>
    </div>
  );
}

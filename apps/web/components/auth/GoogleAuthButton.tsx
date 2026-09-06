'use client';

import React, { useState } from 'react';
import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { supabase } from '@/lib/supabase/client';

interface GoogleAuthButtonProps {
  isTermsAgreed: boolean;
  onTermsValidationFailed: () => void;
  text?: string;
  className?: string;
}

export function GoogleAuthButton({
  isTermsAgreed,
  onTermsValidationFailed,
  text = 'المتابعة باستخدام Google',
  className = '',
}: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setAuthError(null);

    // 1. Mandatory Terms Check
    if (!isTermsAgreed) {
      onTermsValidationFailed();
      return;
    }

    try {
      setIsLoading(true);

      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        setIsLoading(false);
        setAuthError(error.message || 'فشل الاتصال بخدمة Google');
      }
    } catch (err: any) {
      setIsLoading(false);
      setAuthError(err?.message || 'حدث خطأ غير متوقع أثناء تسجيل الدخول بجوجل');
    }
  };

  return (
    <div className="w-full space-y-2">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className={`w-full flex items-center justify-center gap-3 py-3 px-4 bg-surface hover:bg-canvas border-[1.5px] border-line hover:border-ink/20 rounded-2xl font-body text-xs sm:text-sm font-bold text-ink shadow-sm hover:shadow-warm transition-all duration-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <GoogleIcon className="w-5 h-5 shrink-0" />
        )}
        <span>{isLoading ? 'جاري التحويل إلى Google...' : text}</span>
      </button>

      {authError && (
        <div className="text-center font-body text-[11px] text-danger bg-danger-soft border border-danger/20 rounded-xl p-2 animate-in fade-in">
          {authError}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { supabase } from '@/lib/supabase/client';

import { useRouter } from 'next/navigation';
import { tokenStorage } from '@/lib/api/client';
import { useAuthStore } from '@/stores/useAuthStore';

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
  const router = useRouter();
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

      const isNative =
        typeof window !== 'undefined' &&
        (Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
          navigator.userAgent.includes('FastOrder-Android'));

      if (isNative) {
        // Option A: Try native GoogleAuth plugin if available
        const googleAuthPlugin = (window as any).Capacitor?.Plugins?.GoogleAuth;
        if (googleAuthPlugin?.signIn) {
          try {
            const googleUser = await googleAuthPlugin.signIn();
            const idToken = googleUser?.authentication?.idToken || googleUser?.idToken;
            if (idToken) {
              const { data: tokenSessionData, error: tokenError } =
                await supabase.auth.signInWithIdToken({
                  provider: 'google',
                  token: idToken,
                });

              if (tokenError) throw tokenError;

              if (tokenSessionData?.session) {
                tokenStorage.setTokens(
                  tokenSessionData.session.access_token,
                  tokenSessionData.session.refresh_token
                );
                const syncResult = await useAuthStore.getState().syncOAuthUser();
                if (syncResult.isNewUser) {
                  router.replace('/auth/callback');
                } else {
                  router.replace('/student');
                }
                return;
              }
            }
          } catch (nativeErr: any) {
            console.warn('[GoogleAuth] Native One-Tap failed or not configured, using In-App Custom Tab fallback:', nativeErr);
          }
        }

        // Option B: In-App Browser (Chrome Custom Tab) with fastorder:// deep link
        // This keeps the user inside the app and brings them right back!
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: 'fastorder://auth/callback',
            skipBrowserRedirect: true,
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account',
            },
          },
        });

        if (error) {
          setIsLoading(false);
          setAuthError(error.message || 'فشل الاتصال بخدمة Google');
          return;
        }

        if (data?.url) {
          const capacitorBrowser = (window as any).Capacitor?.Plugins?.Browser;
          if (capacitorBrowser?.open) {
            await capacitorBrowser.open({
              url: data.url,
              windowName: '_blank',
              presentationStyle: 'popover',
              toolbarColor: '#161920',
            });
          } else {
            window.location.href = data.url;
          }
        }
      } else {
        // Standard Web Browser (Desktop / Mobile Browser)
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

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/branding/Logo';
import { Button } from '@/components/ui/Button';
import { CollegeSelectionModal } from '@/components/auth/CollegeSelectionModal';
import { supabase } from '@/lib/supabase/client';
import { tokenStorage } from '@/lib/api/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { syncOAuthUser, updateStudentCollege } = useAuthStore();

  const [status, setStatus] = useState<'loading' | 'needs_college' | 'success' | 'error'>('loading');
  const [statusMessage, setStatusMessage] = useState('جاري معالجة تسجيل الدخول...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>('');
  const [appDeepLink, setAppDeepLink] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let isHandled = false;

    // 1. Subscribe to auth state change event (catches automatic Supabase session exchanges)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && !isHandled && isMounted) {
        isHandled = true;
        await handleActiveSession(session);
      }
    });

    async function processAuthCallback() {
      if (typeof window === 'undefined') return;

      try {
        const hash = window.location.hash || '';
        const searchParams = new URLSearchParams(window.location.search);

        // A. Check for error in query or hash
        const errorDesc =
          searchParams.get('error_description') ||
          searchParams.get('error') ||
          (hash.includes('error=') ? new URLSearchParams(hash.substring(1)).get('error_description') : null);

        if (errorDesc) {
          if (!isMounted) return;
          setStatus('error');
          setErrorMessage(
            errorDesc.includes('access_denied')
              ? 'تم إلغاء عملية تسجيل الدخول من قبلك.'
              : `حدث خطأ أثناء المصادقة: ${errorDesc}`
          );
          return;
        }

        // B. Handle manual hash tokens (access_token & refresh_token from OAuth implicit flow)
        if (hash.includes('access_token=')) {
          const cleanHash = hash.startsWith('#') ? hash.substring(1) : hash;
          const hashParams = new URLSearchParams(cleanHash);
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token') || '';

          if (accessToken) {
            // Save immediately in token storage so API calls can be authenticated
            tokenStorage.setTokens(accessToken, refreshToken);
            setStatusMessage('جاري المصادقة وحفظ بيانات الجلسة...');

            // Try setSession with retry to withstand device clock skew (future iat by 1-2s)
            let sessionEstablished = false;
            for (let i = 0; i < 3; i++) {
              try {
                const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                });

                if (!setSessionError && setSessionData?.session) {
                  sessionEstablished = true;
                  if (!isHandled && isMounted) {
                    isHandled = true;
                    await handleActiveSession(setSessionData.session);
                    return;
                  }
                  break;
                }
              } catch (e) {
                console.warn(`[AuthCallback] setSession attempt ${i + 1} warning:`, e);
              }

              // Brief wait (800ms) to allow clock skew to expire
              if (i < 2) {
                await new Promise((resolve) => setTimeout(resolve, 800));
              }
            }

            // If Supabase SDK client is still skew-delayed, proceed with the verified token directly
            if (!sessionEstablished && !isHandled && isMounted) {
              isHandled = true;
              await handleActiveSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              return;
            }
          }
        }

        // C. Handle PKCE code exchange if present
        const code = searchParams.get('code');
        if (code) {
          setStatusMessage('جاري التحقق من رمز المصادقة...');
          try {
            const { data: exchangeData, error: exchangeError } =
              await supabase.auth.exchangeCodeForSession(code);

            if (exchangeData?.session && !isHandled && isMounted) {
              isHandled = true;
              await handleActiveSession(exchangeData.session);
              return;
            }
          } catch (e) {
            console.warn('[AuthCallback] Exchange code error:', e);
          }
        }

        // D. Check for existing session in storage
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (session && !isHandled && isMounted) {
          isHandled = true;
          await handleActiveSession(session);
          return;
        }

        // E. Check for pure signup email verification (ONLY when there is no active session/token)
        if (
          !hash.includes('access_token=') &&
          !searchParams.has('code') &&
          (hash.includes('type=signup') || searchParams.get('type') === 'signup')
        ) {
          if (!isMounted) return;
          setStatus('success');
          setStatusMessage('تم تأكيد وتفعيل بريدك الإلكتروني بنجاح! 🎉');
          setTimeout(() => {
            router.replace('/auth/login?verified=true');
          }, 1500);
          return;
        }

        // F. Wait up to 3 seconds for onAuthStateChange to fire before displaying error
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          if (isHandled || !isMounted) {
            clearInterval(interval);
            return;
          }

          const { data: { session: pollSession } } = await supabase.auth.getSession();
          if (pollSession && !isHandled && isMounted) {
            isHandled = true;
            clearInterval(interval);
            await handleActiveSession(pollSession);
            return;
          }

          if (attempts >= 6) {
            clearInterval(interval);
            if (!isHandled && isMounted) {
              setStatus('error');
              setErrorMessage('تعذر استرداد جلسة الدخول. يرجى المحاولة مرة أخرى أو التأكد من مزامنة توقيت جهازك.');
            }
          }
        }, 500);

      } catch (err: any) {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage(err?.message || 'حدث خطأ غير متوقع أثناء المعالجة.');
      }
    }

    async function handleActiveSession(session: any) {
      if (!isMounted) return;
      setStatusMessage('جاري تهيئة حسابك وملفك الجامعي...');

      // Save tokens in API storage
      tokenStorage.setTokens(session.access_token, session.refresh_token);

      // Check if opened from an external mobile browser to provide a bridge back to the APK
      const isMobileBrowser =
        typeof window !== 'undefined' &&
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) &&
        !navigator.userAgent.includes('FastOrder-Android') &&
        !(window as any).Capacitor?.isNativePlatform?.();

      if (isMobileBrowser) {
        const deepLink = `fastorder://auth/callback#access_token=${session.access_token}&refresh_token=${session.refresh_token}`;
        setAppDeepLink(deepLink);
        try {
          window.location.href = deepLink;
        } catch (e) {
          console.warn('[FastOrder Callback] Auto deep link navigation error:', e);
        }
      }

      // Synchronize with backend PostgreSQL
      const syncResult = await syncOAuthUser();
      if (!syncResult.success) {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage(syncResult.error || 'فشل مزامنة بيانات حسابك مع الخادم');
        return;
      }

      const isNewUser = syncResult.isNewUser;
      const user = syncResult.user;

      if (isNewUser) {
        // Option B: Show College Selection Modal
        if (!isMounted) return;
        setStudentName(user?.name || '');
        setStatus('needs_college');
      } else {
        // Returning user: redirect directly
        if (!isMounted) return;
        setStatus('success');
        setStatusMessage(
          isMobileBrowser
            ? 'تم تسجيل الدخول بنجاح! جاري إعادتك لتطبيق FastOrder...'
            : 'تم تسجيل الدخول بنجاح! جاري تحويلك...'
        );
        setTimeout(() => {
          router.replace('/student');
        }, isMobileBrowser ? 1200 : 500);
      }
    }

    processAuthCallback();

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [router, syncOAuthUser]);

  const handleCollegeSelection = async (college: string) => {
    await updateStudentCollege(college);
    setStatus('success');
    setStatusMessage('تم حفظ بيانات كليتك بنجاح! أهلاً بك في FastOrder');
    setTimeout(() => {
      router.replace('/student');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface border border-line rounded-3xl p-6 sm:p-8 shadow-floating text-center space-y-6">
        <div className="flex justify-center">
          <Logo variant="full" />
        </div>

        {status === 'loading' && (
          <div className="py-6 space-y-4 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mx-auto shadow-sm">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-ink">
                لحظات من فضلك
              </h3>
              <p className="font-body text-xs text-ink-soft mt-1">
                {statusMessage}
              </p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6 space-y-4 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-ink">
                تمت العملية بنجاح!
              </h3>
              <p className="font-body text-xs text-ink-soft mt-1">
                {statusMessage}
              </p>
            </div>
            {appDeepLink && (
              <div className="pt-2">
                <a
                  href={appDeepLink}
                  className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary hover:bg-primary-ink text-ink font-bold text-xs rounded-2xl shadow-warm transition-all"
                >
                  العودة لتطبيق FastOrder 📱
                </a>
              </div>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="py-4 space-y-4 animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-danger-soft text-danger flex items-center justify-center mx-auto shadow-sm">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-ink">
                تعذر تسجيل الدخول
              </h3>
              <p className="font-body text-xs text-ink-soft mt-1 leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <div className="pt-2">
              <Link href="/auth/login" className="block">
                <Button variant="primary" size="md" className="w-full">
                  العودة لتسجيل الدخول
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Option B: College Selection Modal */}
        <CollegeSelectionModal
          isOpen={status === 'needs_college'}
          studentName={studentName}
          onSelectCollege={handleCollegeSelection}
        />
      </div>
    </div>
  );
}

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

    async function processAuthCallback() {
      if (typeof window === 'undefined') return;

      try {
        const hash = window.location.hash;
        const searchParams = new URLSearchParams(window.location.search);

        // 1. Check for error in query or hash
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

        // 2. Handle PKCE code exchange if present
        const code = searchParams.get('code');
        if (code) {
          setStatusMessage('جاري التحقق من رمز المصادقة...');
          const { data: exchangeData, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            if (!isMounted) return;
            setStatus('error');
            setErrorMessage(exchangeError.message || 'فشل التحقق من رمز المصادقة');
            return;
          }

          if (exchangeData.session) {
            await handleActiveSession(exchangeData.session);
            return;
          }
        }

        // 3. Check for signup email verification
        if (hash.includes('type=signup') || searchParams.get('type') === 'signup') {
          if (!isMounted) return;
          setStatus('success');
          setStatusMessage('تم تأكيد وتفعيل بريدك الإلكتروني بنجاح! 🎉');
          setTimeout(() => {
            router.replace('/auth/login?verified=true');
          }, 1500);
          return;
        }

        // 4. Check existing session or hash tokens
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          if (!isMounted) return;
          setStatus('error');
          setErrorMessage(sessionError.message);
          return;
        }

        if (session) {
          await handleActiveSession(session);
        } else {
          // Wait a short moment in case client is parsing hash
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession) {
              await handleActiveSession(retrySession);
            } else {
              if (!isMounted) return;
              setStatus('error');
              setErrorMessage('تعذر استرداد جلسة الدخول. يرجى المحاولة مرة أخرى.');
            }
          }, 800);
        }
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

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/branding/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckCircle2, AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingLink, setIsVerifyingLink] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    // Check if there's an error in URL hash or query params
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);

      if (hash.includes('error=')) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const errorDesc = hashParams.get('error_description') || hashParams.get('error');
        setLinkError(
          errorDesc?.includes('expired')
            ? 'انتهت صلاحية هذا الرابط، يرجى طلب رابط استعادة جديد.'
            : 'رابط إعادة تعيين كلمة المرور غير صالح أو تالف.'
        );
        setIsVerifyingLink(false);
        return;
      }

      const code = params.get('code');
      if (code) {
        // PKCE flow
        supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
          if (exchangeError) {
            setLinkError('تعذر التحقق من رمز الاستعادة، يرجى طلب رابط جديد.');
          }
          setIsVerifyingLink(false);
        });
        return;
      }

      // Check current session or auth state
      supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
        if (sessionError) {
          setLinkError('تعذر التحقق من الجلسة، يرجى إعادة طلب الرابط.');
        } else if (!session && !hash.includes('access_token')) {
          // If no active session and no token in hash
          // Wait a short moment for supabase client to parse hash if present
          setTimeout(() => {
            supabase.auth.getSession().then(({ data: { session: retrySession } }) => {
              if (!retrySession && !window.location.hash.includes('access_token')) {
                setLinkError('رابط غير صالح أو انتهت صلاحيته. يرجى طلب رابط استعادة جديد.');
              }
              setIsVerifyingLink(false);
            });
          }, 500);
          return;
        }
        setIsVerifyingLink(false);
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('كلمة المرور يجب أن لا تقل عن 6 أحرف');
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message || 'فشل تحديث كلمة المرور، يرجى المحاولة مرة أخرى');
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      setIsLoading(false);

      // Sign out from recovery session so user explicitly logs in
      await supabase.auth.signOut();

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/login?reset=true');
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface border border-line rounded-3xl p-6 sm:p-8 shadow-floating text-center">
        <div className="flex justify-center mb-6">
          <Logo variant="full" />
        </div>

        {isVerifyingLink ? (
          <div className="py-8 space-y-3 animate-in fade-in duration-200">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-body text-xs text-ink-soft">جاري التحقق من الرابط...</p>
          </div>
        ) : linkError ? (
          <div className="space-y-4 py-2 animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-danger-soft text-danger flex items-center justify-center mx-auto shadow-sm">
              <AlertCircle className="w-7 h-7" />
            </div>

            <h3 className="font-display font-bold text-lg text-ink">
              الرابط غير صالح
            </h3>

            <p className="font-body text-xs text-ink-soft leading-relaxed">
              {linkError}
            </p>

            <div className="pt-2 space-y-2">
              <Link href="/auth/forgot-password" className="block">
                <Button variant="primary" size="md" className="w-full">
                  طلب رابط جديد
                </Button>
              </Link>
              <Link
                href="/auth/login"
                className="text-xs font-body font-semibold text-ink-soft hover:text-ink block pt-1"
              >
                العودة لتسجيل الدخول
              </Link>
            </div>
          </div>
        ) : isSuccess ? (
          <div className="space-y-4 py-2 animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-accent-soft text-accent flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="font-display font-bold text-lg text-ink">
              تم تغيير كلمة المرور بنجاح!
            </h3>

            <p className="font-body text-xs text-ink-soft leading-relaxed">
              يمكنك الآن تسجيل الدخول لحسابك باستخدام كلمة المرور الجديدة. سيتم تحويلك تلقائياً...
            </p>

            <div className="pt-2">
              <Link href="/auth/login?reset=true" className="block">
                <Button variant="primary" size="md" className="w-full">
                  الانتقال لتسجيل الدخول الآن
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="font-display font-bold text-2xl text-ink mb-1">
              تعيين كلمة المرور
            </h2>
            <p className="font-body text-xs text-ink-soft mb-6">
              أدخل كلمة المرور الجديدة لحسابك
            </p>

            {error && (
              <div className="bg-danger-soft border border-danger/30 text-danger rounded-xl p-3 text-xs font-body font-bold mb-4 animate-in fade-in duration-200 text-right">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-right">
              <Input
                label="كلمة المرور الجديدة"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                icon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-ink-soft hover:text-ink pointer-events-auto"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
                iconPosition="left"
              />

              <Input
                label="تأكيد كلمة المرور الجديدة"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                icon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="p-1 text-ink-soft hover:text-ink pointer-events-auto"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
                iconPosition="left"
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full shadow-warm mt-2"
              >
                تأكيد كلمة المرور الجديدة
              </Button>

              <div className="text-center pt-2">
                <Link
                  href="/auth/login"
                  className="text-xs font-body font-semibold text-ink-soft hover:text-ink inline-flex items-center gap-1 transition-colors"
                >
                  <span>إلغاء والعودة لتسجيل الدخول</span>
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

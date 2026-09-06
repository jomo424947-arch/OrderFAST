'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/branding/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { Eye, EyeOff, CheckCircle2, Mail, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserRole } from '@/types';

const ROLE_REDIRECT: Record<UserRole, string> = {
  student: '/student',
  cashier: '/kiosk',
  admin: '/admin',
};

export default function LoginPage() {
  const router = useRouter();
  const { login, resendConfirmation } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTermsGoogle, setAgreeTermsGoogle] = useState(false);
  const [termsErrorHighlight, setTermsErrorHighlight] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Resend confirmation email cooldown states
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      if (urlParams.get('reset') === 'true') {
        setSuccessMessage('تم تعيين كلمة المرور بنجاح! 🎉 يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.');
        window.history.replaceState(null, '', '/auth/login');
      } else if (
        urlParams.get('verified') === 'true' ||
        hash.includes('type=signup') ||
        hash.includes('access_token')
      ) {
        setSuccessMessage('تم تأكيد وتفعيل بريدك الإلكتروني بنجاح! 🎉 يمكنك الآن تسجيل الدخول.');
        window.history.replaceState(null, '', '/auth/login');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await login(email.trim(), password, 'student');
    setIsLoading(false);

    if (result.success) {
      const activeRole = useAuthStore.getState().role || 'student';
      router.replace(ROLE_REDIRECT[activeRole]);
    } else {
      setError(result.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
  };

  const handleResendConfirmation = async () => {
    if (!email.trim() || resendCooldown > 0) return;

    setIsResending(true);
    setResendSuccess(false);

    const res = await resendConfirmation(email.trim());
    setIsResending(false);

    if (res.success) {
      setResendSuccess(true);
      setResendCooldown(60);
    } else {
      setError(res.error || 'فشل في إعادة إرسال رابط التفعيل');
    }
  };

  const isUnconfirmedError =
    error &&
    (error.includes('غير مفعّل') ||
      error.toLowerCase().includes('not confirmed') ||
      error.includes('التفعيل أولاً'));

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface border border-line rounded-3xl p-6 sm:p-8 shadow-floating">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Logo variant="full" />
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="font-display font-bold text-2xl text-ink mb-1">
            تسجيل الدخول
          </h2>
          <p className="font-body text-xs text-ink-soft">
            دخول لحسابك في منصة FastOrder
          </p>
        </div>

        {/* Success message on email confirmation */}
        {successMessage && (
          <div className="bg-accent-soft border border-accent/30 text-accent rounded-2xl p-3.5 text-xs font-body font-bold mb-4 flex items-center gap-2.5 animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-accent" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Resend success notice */}
        {resendSuccess && (
          <div className="bg-accent-soft border border-accent/30 text-accent rounded-2xl p-3.5 text-xs font-body font-bold mb-4 flex items-center gap-2.5 animate-in fade-in duration-200">
            <Mail className="w-5 h-5 shrink-0 text-accent" />
            <span className="leading-relaxed">
              تم إرسال رابط تفعيل جديد إلى بريدك الإلكتروني! تفقد صندوق الوارد أو الـ Spam.
            </span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-danger-soft border border-danger/30 text-danger rounded-xl p-3 text-xs font-body font-bold mb-4 animate-in fade-in duration-200 text-right space-y-2">
            <p className="leading-relaxed">{error}</p>
            {isUnconfirmedError && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={isResending || resendCooldown > 0}
                  className="w-full py-2 px-3 bg-white/80 hover:bg-white text-danger border border-danger/40 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>
                    {isResending
                      ? 'جاري الإرسال...'
                      : resendCooldown > 0
                        ? `إعادة المحاولة بعد (${resendCooldown}ث)`
                        : 'إعادة إرسال رابط التفعيل الآن'}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          <Input
            label="البريد الإلكتروني"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            autoComplete="email"
          />

          <div>
            <Input
              label="كلمة المرور"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
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
            <div className="mt-1.5 text-left">
              <Link
                href="/auth/forgot-password"
                className="text-xs font-body font-semibold text-accent hover:underline"
              >
                نسيت كلمة المرور؟
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2 shadow-warm"
          >
            دخول
          </Button>
        </form>

        {/* Divider */}
        <div className="relative flex py-3 my-1 items-center">
          <div className="flex-grow border-t border-line"></div>
          <span className="flex-shrink mx-3 text-ink-soft text-xs font-body font-semibold">أو</span>
          <div className="flex-grow border-t border-line"></div>
        </div>

        {/* Google Authentication Section */}
        <div className="space-y-2.5 text-right">
          {/* Terms & Conditions Agreement Checkbox for Google */}
          <label
            className={`flex items-start gap-2.5 cursor-pointer select-none text-right transition-all p-2 rounded-xl border ${termsErrorHighlight
                ? 'bg-danger-soft/50 border-danger'
                : 'border-transparent hover:bg-canvas'
              }`}
          >
            <input
              type="checkbox"
              checked={agreeTermsGoogle}
              onChange={(e) => {
                setAgreeTermsGoogle(e.target.checked);
                if (e.target.checked) {
                  setTermsErrorHighlight(false);
                  if (error?.includes('الشروط والأحكام')) {
                    setError(null);
                  }
                }
              }}
              className="mt-0.5 w-4 h-4 rounded border-line text-primary focus:ring-primary/30 accent-primary cursor-pointer shrink-0"
            />
            <span className="font-body text-[11px] text-ink-soft leading-snug">
              أوافق على{' '}
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-primary hover:text-primary-ink underline inline-flex items-center"
                onClick={(e) => e.stopPropagation()}
              >
                الشروط والأحكام
              </Link>{' '}
              و
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-primary hover:text-primary-ink underline inline-flex items-center mx-1"
                onClick={(e) => e.stopPropagation()}
              >
                سياسة الخصوصية
              </Link>{' '}
              (بما فيها الحظر الفوري للحساب في حال عدم استلام الأوردر)
            </span>
          </label>

          <GoogleAuthButton
            isTermsAgreed={agreeTermsGoogle}
            onTermsValidationFailed={() => {
              setError('يجب الموافقة على الشروط والأحكام وسياسة الاستخدام أولاً للمتابعة بحساب Google');
              setTermsErrorHighlight(true);
            }}
            text="تسجيل الدخول بحساب Google"
          />
        </div>

        {/* Bottom Link */}
        <p className="text-center font-body text-xs text-ink-soft mt-6">
          لسه معملتش حساب؟{' '}
          <Link
            href="/auth/register"
            className="font-bold text-accent hover:underline"
          >
            إنشاء حساب جديد
          </Link>
        </p>
      </div>
    </div>
  );
}

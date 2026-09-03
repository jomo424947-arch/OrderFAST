'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/branding/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckCircle2, Mail, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Handle resend countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const sendResetEmail = async (targetEmail: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/reset-password`
        : undefined;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        targetEmail.trim(),
        { redirectTo }
      );

      if (resetError) {
        const msg = resetError.message || '';
        if (msg.includes('60 seconds')) {
          setError('لأسباب أمنية، يمكنك طلب رابط الاستعادة مرة واحدة كل 60 ثانية. يرجى الانتظار قليلاً.');
        } else if (msg.toLowerCase().includes('rate limit')) {
          setError('تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة بعد قليل.');
        } else if (msg.toLowerCase().includes('invalid')) {
          setError('صيغة البريد الإلكتروني غير صحيحة، يرجى التأكد من كتابة البريد بشكل سليم.');
        } else {
          setError(msg || 'حدث خطأ أثناء محاولة إرسال الرابط، يرجى المحاولة مرة أخرى.');
        }
        setIsLoading(false);
        return false;
      }

      setIsSubmitted(true);
      setCooldown(60); // 60s cooldown before allowing resend
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setError(err?.message || 'تعذر الاتصال بخدمة التحقق، يرجى المحاولة لاحقاً.');
      setIsLoading(false);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني أولاً');
      return;
    }
    await sendResetEmail(email);
  };

  const handleResend = async () => {
    if (cooldown > 0 || isLoading) return;
    await sendResetEmail(email);
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface border border-line rounded-3xl p-6 sm:p-8 shadow-floating text-center">
        <div className="flex justify-center mb-6">
          <Logo variant="full" />
        </div>

        <h2 className="font-display font-bold text-2xl text-ink mb-1">
          استعادة كلمة المرور
        </h2>
        <p className="font-body text-xs text-ink-soft mb-6">
          اكتب بريدك الإلكتروني وهنبعتلك رابط إعادة تعيين كلمة المرور
        </p>

        {error && (
          <div className="bg-danger-soft border border-danger/30 text-danger rounded-xl p-3 text-xs font-body font-bold mb-4 animate-in fade-in duration-200 text-right">
            {error}
          </div>
        )}

        {isSubmitted ? (
          <div className="space-y-4 py-2 animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-accent-soft text-accent flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h4 className="font-display font-bold text-lg text-ink">
              تم إرسال الرابط بنجاح!
            </h4>

            <p className="font-body text-xs text-ink-soft leading-relaxed">
              تم إرسال رابط إعادة تعيين كلمة المرور إلى:{' '}
              <strong className="text-ink font-semibold block mt-1 font-mono text-xs">
                {email}
              </strong>
            </p>

            <div className="bg-canvas border border-line rounded-2xl p-3.5 text-right font-body text-[11px] text-ink-soft space-y-1.5 leading-relaxed">
              <p className="font-bold text-ink">💡 خطوات المتابعة:</p>
              <p>1. افتح بريدك الإلكتروني الآن.</p>
              <p>2. راجع صندوق الوارد أو مجلد الرسائل غير المرغوب فيها (Spam).</p>
              <p>3. اضغط على رابط الاستعادة لتعيين كلمة مرور جديدة.</p>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || isLoading}
                className="w-full text-xs font-body font-semibold text-ink-soft hover:text-ink disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 py-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>
                  {cooldown > 0
                    ? `إعادة الإرسال بعد ${cooldown} ثانية`
                    : 'لم يصلك البريد؟ إعادة الإرسال'}
                </span>
              </button>

              <Link href="/auth/login" className="block">
                <Button variant="primary" size="md" className="w-full">
                  العودة لتسجيل الدخول
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-right">
            <Input
              label="البريد الإلكتروني"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder="name@example.com"
              required
              autoComplete="email"
              icon={<Mail className="w-4 h-4 text-ink-soft" />}
              iconPosition="left"
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full shadow-warm"
            >
              إرسال رابط الاستعادة
            </Button>
            <div className="text-center pt-2">
              <Link
                href="/auth/login"
                className="text-xs font-body font-semibold text-ink-soft hover:text-ink inline-flex items-center gap-1 transition-colors"
              >
                <span>الرجوع لتسجيل الدخول</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

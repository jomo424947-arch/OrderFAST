'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/branding/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 400);
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
          اكتب بريدك الجامعي وهنبعتلك رابط إعادة تعيين كلمة المرور
        </p>

        {isSubmitted ? (
          <div className="space-y-4 py-4 animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-accent-soft text-accent flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="font-display font-bold text-lg text-ink">
              تم إرسال الرابط!
            </h4>
            <p className="font-body text-xs text-ink-soft leading-relaxed">
              راجع بريدك الجامعي <strong className="text-ink">{email}</strong> لتأكيد كلمة المرور الجديدة.
            </p>
            <Link href="/auth/login" className="inline-block pt-2">
              <Button variant="primary" size="md">
                العودة لتسجيل الدخول
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-right">
            <Input
              label="البريد الجامعي"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@sphinx.edu.eg"
              required
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              إرسال رابط الاستعادة
            </Button>
            <div className="text-center pt-2">
              <Link
                href="/auth/login"
                className="text-xs font-body font-semibold text-ink-soft hover:text-ink inline-flex items-center gap-1"
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

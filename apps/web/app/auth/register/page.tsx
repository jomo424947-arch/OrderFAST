'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/branding/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { COLLEGES } from '@/lib/constants';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [college, setCollege] = useState(COLLEGES[1]);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      login('student');
      setIsLoading(false);
      router.push('/student');
    }, 400);
  };

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
            إنشاء حساب
          </h2>
          <p className="font-body text-xs text-ink-soft">
            تحتاج بريدك الجامعي بس
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-right">
          <Input
            label="الاسم بالكامل"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسمك"
            required
          />

          <Input
            label="البريد الجامعي"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@sphinx.edu.eg"
            required
          />

          <div className="w-full text-right">
            <label className="block font-body text-xs font-medium text-ink-soft mb-1.5">
              الكلية
            </label>
            <select
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              className="w-full bg-surface border-[1.5px] border-line rounded-xl px-4 py-3 font-body text-xs sm:text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
            >
              {COLLEGES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="كلمة المرور"
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

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-4"
          >
            إنشاء الحساب
          </Button>
        </form>

        {/* Bottom Link */}
        <p className="text-center font-body text-xs text-ink-soft mt-6">
          عندك حساب؟{' '}
          <Link
            href="/auth/login"
            className="font-bold text-accent hover:underline"
          >
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}

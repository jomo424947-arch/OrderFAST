'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/branding/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Eye, EyeOff, User, Store } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

export default function LoginPage() {
  const router = useRouter();
  const { login, setRole } = useAuthStore();

  const [email, setEmail] = useState('ahmed.karim@sphinx.edu.eg');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'student' | 'cashier'>('student');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      login(selectedRole);
      setIsLoading(false);
      if (selectedRole === 'cashier') {
        router.push('/kiosk');
      } else {
        router.push('/student');
      }
    }, 400);
  };

  const handleQuickStudent = () => {
    setSelectedRole('student');
    setEmail('ahmed.karim@sphinx.edu.eg');
  };

  const handleQuickCashier = () => {
    setSelectedRole('cashier');
    setEmail('cashier.alhorria@kiosks.sphinx.edu.eg');
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
            تسجيل الدخول
          </h2>
          <p className="font-body text-xs text-ink-soft">
            دخول لحسابك في الجامعة
          </p>
        </div>

        {/* Quick Demo Switcher */}
        <div className="grid grid-cols-2 gap-2 bg-canvas p-1 rounded-xl mb-5 border border-line">
          <button
            type="button"
            onClick={handleQuickStudent}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-body font-semibold transition-all ${
              selectedRole === 'student'
                ? 'bg-surface text-ink font-bold shadow-sm'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>حساب طالب</span>
          </button>
          <button
            type="button"
            onClick={handleQuickCashier}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-body font-semibold transition-all ${
              selectedRole === 'cashier'
                ? 'bg-surface text-ink font-bold shadow-sm'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-accent" />
            <span>حساب كاشير</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          <Input
            label="البريد الجامعي"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@sphinx.edu.eg"
            required
          />

          <div>
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
            className="w-full mt-2"
          >
            دخول
          </Button>
        </form>

        {/* Bottom Link */}
        <p className="text-center font-body text-xs text-ink-soft mt-6">
          لسه معملتش حساب؟{' '}
          <Link
            href="/auth/register"
            className="font-bold text-accent hover:underline"
          >
            إنشاء حساب
          </Link>
        </p>
      </div>
    </div>
  );
}

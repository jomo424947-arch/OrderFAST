'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/branding/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Eye, EyeOff, User, Store, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserRole } from '@/types';

const ROLE_TABS: { key: UserRole; label: string; icon: React.ElementType; demoEmail: string }[] = [
  { key: 'student', label: 'حساب طالب', icon: User, demoEmail: 'ahmed.karim@sphinx.edu.eg' },
  { key: 'cashier', label: 'حساب كاشير', icon: Store, demoEmail: 'cashier.alhorria@kiosks.sphinx.edu.eg' },
  { key: 'admin', label: 'أدمن', icon: ShieldCheck, demoEmail: 'admin@sphinx.edu.eg' },
];

const ROLE_REDIRECT: Record<UserRole, string> = {
  student: '/student',
  cashier: '/kiosk',
  admin: '/admin',
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [email, setEmail] = useState('ahmed.karim@sphinx.edu.eg');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTabSwitch = (role: UserRole) => {
    setSelectedRole(role);
    const tab = ROLE_TABS.find((t) => t.key === role);
    if (tab) setEmail(tab.demoEmail);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await login(email, password, selectedRole);
    setIsLoading(false);

    if (result.success) {
      router.push(ROLE_REDIRECT[selectedRole]);
    } else {
      setError(result.error || 'حدث خطأ أثناء تسجيل الدخول');
    }
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

        {/* Quick Demo Switcher — 3 Tabs */}
        <div className="grid grid-cols-3 gap-1.5 bg-canvas p-1 rounded-xl mb-5 border border-line">
          {ROLE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedRole === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabSwitch(tab.key)}
                className={`flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-body font-semibold transition-all ${
                  isActive
                    ? 'bg-surface text-ink font-bold shadow-sm'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-danger-soft border border-danger/30 text-danger rounded-xl p-3 text-xs font-body font-bold mb-4 animate-in fade-in duration-200">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          <Input
            label="البريد الإلكتروني"
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

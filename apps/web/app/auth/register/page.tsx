'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/branding/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { COLLEGES } from '@/lib/constants';
import { Eye, EyeOff, User, Store, Phone as PhoneIcon } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserRole } from '@/types';

const ROLE_TABS: { key: UserRole; label: string; icon: React.ElementType }[] = [
  { key: 'student', label: 'طالب', icon: User },
  { key: 'cashier', label: 'كاشير', icon: Store },
];

const ROLE_REDIRECT: Record<UserRole, string> = {
  student: '/student',
  cashier: '/kiosk',
  admin: '/admin',
};

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();

  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState(COLLEGES[1]);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTabSwitch = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await register(
      {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        college: selectedRole === 'student' ? college : undefined,
      },
      selectedRole
    );

    if (result.success) {
      setIsLoading(false);
      router.push(ROLE_REDIRECT[selectedRole]);
    } else {
      setIsLoading(false);
      setError(result.error || 'حدث خطأ أثناء إنشاء الحساب');
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
            إنشاء حساب
          </h2>
          <p className="font-body text-xs text-ink-soft">
            اختار نوع حسابك وابدأ
          </p>
        </div>

        {/* 2-Tab Role Selector */}
        <div className="grid grid-cols-2 gap-1.5 bg-canvas p-1 rounded-xl mb-5 border border-line">
          {ROLE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedRole === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabSwitch(tab.key)}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-body font-semibold transition-all ${
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
        <form onSubmit={handleSubmit} className="space-y-3.5 text-right">
          <Input
            label="الاسم بالكامل"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={selectedRole === 'cashier' ? 'مثال: عمر الكاشير' : 'اسمك بالكامل'}
            required
          />

          <Input
            label="البريد الإلكتروني"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
          />

          <Input
            label="رقم الهاتف المحمول"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01012345678"
            required
            icon={<PhoneIcon className="w-4 h-4 text-ink-soft" />}
            iconPosition="left"
          />

          {/* Student-specific: College */}
          {selectedRole === 'student' && (
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
          )}

          {/* Cashier Helper Note */}
          {selectedRole === 'cashier' && (
            <div className="bg-canvas border border-line/80 rounded-2xl p-3 text-[11px] font-body text-ink-soft leading-relaxed">
              💡 <span className="font-bold text-ink">ملاحظة:</span> بعد إنشاء حسابك، سيقوم مدير النظام بتعيينك للكشك أو الكافيه المطلوب لتتمكن من استقبال الطلبات.
            </div>
          )}

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

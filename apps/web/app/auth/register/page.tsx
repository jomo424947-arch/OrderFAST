'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/branding/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { COLLEGES } from '@/lib/constants';
import { Eye, EyeOff, User, Store, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useKioskStore } from '@/stores/useKioskStore';
import { UserRole } from '@/types';
import { Cashier } from '@/types';

const ROLE_TABS: { key: UserRole; label: string; icon: React.ElementType }[] = [
  { key: 'student', label: 'طالب', icon: User },
  { key: 'cashier', label: 'كاشير', icon: Store },
  { key: 'admin', label: 'أدمن', icon: ShieldCheck },
];

const ROLE_REDIRECT: Record<UserRole, string> = {
  student: '/student',
  cashier: '/kiosk',
  admin: '/admin',
};

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();
  const { addKiosk } = useKioskStore();

  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [college, setCollege] = useState(COLLEGES[1]);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cashier-specific
  const [kioskName, setKioskName] = useState('');
  const [kioskLocation, setKioskLocation] = useState(COLLEGES[0]);

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
        name,
        email,
        password,
        college: selectedRole === 'student' ? college : undefined,
        kioskName: selectedRole === 'cashier' ? kioskName : undefined,
        collegeLocation: selectedRole === 'cashier' ? kioskLocation : undefined,
      },
      selectedRole
    );

    if (result.success) {
      // If cashier, also create the associated kiosk
      if (selectedRole === 'cashier') {
        const authState = useAuthStore.getState();
        const cashierData = authState.cashier as Cashier;
        if (cashierData) {
          addKiosk({
            name: kioskName || 'كشك جديد',
            collegeLocation: kioskLocation,
            campusZone: '',
            category: 'عامة',
            isOpen: false,
            openingHours: 'غير محدد',
            estimatedWaitMins: 15,
            ordersAheadCount: 0,
            rating: 0,
            acceptsOnlineOrders: true,
            isRushMode: false,
          });
        }
      }

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

        {/* 3-Tab Role Selector */}
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
            label="البريد الإلكتروني"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@sphinx.edu.eg"
            required
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

          {/* Cashier-specific: Kiosk Name + Location */}
          {selectedRole === 'cashier' && (
            <>
              <Input
                label="اسم الكشك الجديد"
                type="text"
                value={kioskName}
                onChange={(e) => setKioskName(e.target.value)}
                placeholder="مثال: كشك المشروبات"
                required
              />
              <div className="w-full text-right">
                <label className="block font-body text-xs font-medium text-ink-soft mb-1.5">
                  الموقع / الكلية
                </label>
                <select
                  value={kioskLocation}
                  onChange={(e) => setKioskLocation(e.target.value)}
                  className="w-full bg-surface border-[1.5px] border-line rounded-xl px-4 py-3 font-body text-xs sm:text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  {COLLEGES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </>
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

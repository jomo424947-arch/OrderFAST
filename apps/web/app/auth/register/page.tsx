'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/branding/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { COLLEGES } from '@/lib/constants';
import { Eye, EyeOff, User, Store, Phone as PhoneIcon, MailCheck, RefreshCw } from 'lucide-react';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
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
  const { register, resendConfirmation } = useAuthStore();

  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState(COLLEGES[1]);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [termsErrorHighlight, setTermsErrorHighlight] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resend confirmation email cooldown states
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResendInSuccess = async () => {
    if (!submittedEmail || resendCooldown > 0) return;
    setIsResending(true);
    setResendMessage(null);

    const res = await resendConfirmation(submittedEmail);
    setIsResending(false);

    if (res.success) {
      setResendMessage('تم إرسال رابط تفعيل جديد بنجاح! تفقد بريدك.');
      setResendCooldown(60);
    } else {
      setResendMessage(res.error || 'فشل في إعادة إرسال الرابط.');
    }
  };

  const handleTabSwitch = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreeTerms) {
      setError('يجب الموافقة على الشروط والأحكام وسياسة الاستخدام للمتابعة');
      return;
    }

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

    setIsLoading(false);

    if (result.success) {
      if ((result as any).requiresConfirmation) {
        setSubmittedEmail(email.trim());
        setIsSubmittedSuccess(true);
      } else {
        router.replace(ROLE_REDIRECT[selectedRole]);
      }
    } else {
      setError(result.error || 'حدث خطأ أثناء إنشاء الحساب');
    }
  };

  if (isSubmittedSuccess) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-surface border border-line rounded-3xl p-6 sm:p-8 shadow-floating text-center space-y-5 animate-in fade-in duration-300">
          <div className="flex justify-center">
            <Logo variant="full" />
          </div>

          <div className="w-16 h-16 rounded-3xl bg-accent-soft text-accent flex items-center justify-center mx-auto shadow-sm">
            <MailCheck className="w-8 h-8" />
          </div>

          <div>
            <h2 className="font-display font-bold text-xl text-ink">
              تحقق من بريدك الإلكتروني
            </h2>
            <p className="font-body text-xs text-ink-soft mt-1.5 leading-relaxed">
              تم إرسال رابط تفعيل لحسابك بنجاح إلى:
            </p>
            <div className="mt-2 py-1.5 px-3 bg-canvas border border-line rounded-xl font-mono text-xs font-bold text-ink inline-block max-w-full truncate">
              {submittedEmail}
            </div>
          </div>

          <div className="bg-canvas border border-line rounded-2xl p-3.5 text-right font-body text-xs text-ink-soft space-y-2 leading-relaxed">
            <p className="font-bold text-ink flex items-center gap-1.5">

              <span>خطوات تفعيل الحساب:</span>
            </p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] pr-1">
              <li>افتح بريدك الإلكتروني الآن.</li>
              <li>تفقد صندوق الوارد (أو مجلد الرسائل غير المرغوب فيها Spam/Junk).</li>
              <li>اضغط على رابط &quot;تأكيد الحساب&quot; لتفعيله فوراً.</li>
            </ol>
          </div>

          <div className="space-y-2 pt-1">
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push('/auth/login')}
              className="w-full"
            >
              الانتقال لتسجيل الدخول
            </Button>

            {/* Resend confirmation button in success screen */}
            {resendMessage && (
              <div className="bg-accent-soft border border-accent/30 text-accent rounded-xl p-2.5 text-xs font-bold animate-in fade-in">
                {resendMessage}
              </div>
            )}

            <button
              type="button"
              onClick={handleResendInSuccess}
              disabled={isResending || resendCooldown > 0}
              className="w-full py-2.5 px-3 bg-canvas hover:bg-surface border border-line text-ink rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
              <span>
                {isResending
                  ? 'جاري إرسال الرابط...'
                  : resendCooldown > 0
                    ? `إعادة الإرسال بعد (${resendCooldown}ث)`
                    : 'لم يصلك البريد؟ إعادة إرسال الرابط'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsSubmittedSuccess(false)}
              className="font-body text-xs text-ink-soft hover:text-ink underline py-1 block w-full text-center"
            >
              الرجوع أو التسجيل ببريد آخر
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-body font-semibold transition-all ${isActive
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

          {/* Email Verification Warning Box */}
          <div className="bg-primary-soft/60 border border-primary/25 rounded-2xl p-2.5 sm:p-3 flex items-start gap-2.5 -mt-1 text-right shadow-xs">
            <span className="text-sm shrink-0 select-none mt-0.5">⚠️</span>
            <div className="space-y-0.5">
              <p className="font-body font-bold text-xs text-primary-ink">
                تنبيه هام حول البريد الإلكتروني:
              </p>
              <p className="font-body text-[11px] text-ink-soft leading-relaxed">
                اكتب بريدك بدقة؛ حيث سنرسل لك رابط تفعيل لحسابك، ولن تتمكن من تسجيل الدخول أو إتمام الطلبات إلا بعد تأكيد بريدك.
              </p>
            </div>
          </div>

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

          {/* Terms & Conditions Agreement Checkbox */}
          <div className="pt-1">
            <label
              className={`flex items-start gap-2.5 cursor-pointer select-none text-right transition-all p-2 rounded-xl border ${termsErrorHighlight
                  ? 'bg-danger-soft/50 border-danger'
                  : 'border-transparent hover:bg-canvas'
                }`}
            >
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => {
                  setAgreeTerms(e.target.checked);
                  if (e.target.checked) {
                    setTermsErrorHighlight(false);
                    if (error?.includes('الشروط والأحكام')) {
                      setError(null);
                    }
                  }
                }}
                className="mt-0.5 w-4 h-4 rounded border-line text-primary focus:ring-primary/30 accent-primary cursor-pointer shrink-0"
              />
              <span className="font-body text-xs text-ink-soft leading-snug">
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
                (بما فيها الحظر الفوري والمباشر للحساب في حال عدم استلام الأوردر)
              </span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-3"
          >
            إنشاء الحساب
          </Button>
        </form>

        {/* Divider */}
        <div className="relative flex py-3 my-1 items-center">
          <div className="flex-grow border-t border-line"></div>
          <span className="flex-shrink mx-3 text-ink-soft text-xs font-body font-semibold">أو</span>
          <div className="flex-grow border-t border-line"></div>
        </div>

        {/* Google Registration */}
        <div className="space-y-2">
          <GoogleAuthButton
            isTermsAgreed={agreeTerms}
            onTermsValidationFailed={() => {
              setError('يجب الموافقة على الشروط والأحكام وسياسة الاستخدام أولاً للمتابعة عبر Google');
              setTermsErrorHighlight(true);
            }}
            text="التسجيل السريع بواسطة Google"
          />
        </div>

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

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import {
  ShieldCheck,
  Phone,
  X,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface OtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (phone: string) => void;
}

const OTP_LENGTH = 6;
const COOLDOWN_SECONDS = 60;

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerified,
}) => {
  // Steps: 'phone' → 'otp' → 'success'
  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [phone, setPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('phone');
      setPhone('');
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      setError(null);
      setIsSending(false);
      setIsVerifying(false);
      setCooldown(0);
    }
  }, [isOpen]);

  // Focus first OTP input when step changes to 'otp'
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    }
  }, [step]);

  const validatePhone = (p: string): boolean => {
    const cleaned = p.replace(/[\s\-\(\)]/g, '');
    return /^01[0-9]{9}$/.test(cleaned);
  };

  const handleSendOtp = useCallback(async () => {
    setError(null);

    if (!validatePhone(phone)) {
      setError('يرجى إدخال رقم هاتف مصري صحيح (11 رقم يبدأ بـ 01)');
      return;
    }

    setIsSending(true);
    try {
      await apiClient.post('/auth/otp/send', { phone });
      setStep('otp');
      setCooldown(COOLDOWN_SECONDS);
      setOtpDigits(Array(OTP_LENGTH).fill(''));
    } catch (err: any) {
      setError(err.message || 'فشل في إرسال كود التحقق');
    } finally {
      setIsSending(false);
    }
  }, [phone]);

  const handleResendOtp = useCallback(async () => {
    if (cooldown > 0) return;
    setError(null);
    setIsSending(true);
    try {
      await apiClient.post('/auth/otp/send', { phone });
      setCooldown(COOLDOWN_SECONDS);
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } catch (err: any) {
      setError(err.message || 'فشل في إعادة إرسال الكود');
    } finally {
      setIsSending(false);
    }
  }, [phone, cooldown]);

  const handleVerifyOtp = useCallback(async (code: string) => {
    if (code.length !== OTP_LENGTH) return;

    setError(null);
    setIsVerifying(true);
    try {
      const res = await apiClient.post<any>('/auth/otp/verify', { phone, otp: code });
      setStep('success');

      // Wait a moment to show success, then callback
      setTimeout(() => {
        onVerified(res.data?.phone || phone);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'كود التحقق غير صحيح');
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } finally {
      setIsVerifying(false);
    }
  }, [phone, onVerified]);

  // OTP input handler
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];

    // Handle paste
    if (value.length > 1) {
      const digits = value.slice(0, OTP_LENGTH).split('');
      digits.forEach((d, i) => {
        if (index + i < OTP_LENGTH) newDigits[index + i] = d;
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
      otpInputRefs.current[nextIndex]?.focus();

      const fullCode = newDigits.join('');
      if (fullCode.length === OTP_LENGTH) {
        handleVerifyOtp(fullCode);
      }
      return;
    }

    newDigits[index] = value;
    setOtpDigits(newDigits);

    // Auto-focus next
    if (value && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits filled
    const fullCode = newDigits.join('');
    if (fullCode.length === OTP_LENGTH) {
      handleVerifyOtp(fullCode);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <div
          className="bg-surface rounded-t-3xl sm:rounded-3xl w-full max-w-md border border-line shadow-floating overflow-hidden animate-in slide-in-from-bottom-5 sm:slide-in-from-bottom-2 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative flex items-center justify-between p-5 pb-3 border-b border-line/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-soft text-primary-ink flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-ink">
                  {step === 'success' ? 'تم التأكيد!' : 'تأكيد رقم الهاتف'}
                </h3>
                <p className="font-body text-[11px] text-ink-soft">
                  {step === 'phone' && 'مطلوب لطلبات الكاش عند الاستلام'}
                  {step === 'otp' && `أدخل الكود المرسل إلى ${phone}`}
                  {step === 'success' && 'تم تأكيد رقمك بنجاح'}
                </p>
              </div>
            </div>

            {step !== 'success' && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-canvas border border-line/70 flex items-center justify-center text-ink-soft hover:text-ink transition-colors"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {/* One-time notice */}
            {step !== 'success' && (
              <div className="flex items-start gap-2 bg-primary-soft/40 border border-primary/20 rounded-2xl p-3 text-xs font-body text-primary-ink">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  هذا التأكيد <strong>لمرة واحدة فقط</strong>. بعد التأكيد لن يُطلب منك مرة أخرى وسيظهر رقمك المؤكد في إعدادات حسابك.
                </span>
              </div>
            )}

            {/* Step 1: Phone Input */}
            {step === 'phone' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <label className="block font-body text-xs font-bold text-ink mb-1.5">
                    رقم الهاتف المصري
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setPhone(val);
                        setError(null);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                      placeholder="01012345678"
                      dir="ltr"
                      className="w-full text-sm font-mono font-bold py-3.5 pl-11 pr-4 rounded-2xl border border-line bg-canvas text-ink placeholder:text-ink-soft/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-left font-mono-nums tracking-wider"
                      maxLength={11}
                      autoFocus
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center text-ink-soft">
                      <Phone className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="font-body text-[11px] text-ink-soft mt-1.5">
                    هنرسلك كود تأكيد عبر واتساب أو SMS على هذا الرقم
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full shadow-warm"
                  isLoading={isSending}
                  disabled={!phone.trim()}
                  onClick={handleSendOtp}
                >
                  <span>إرسال كود التأكيد</span>
                  <ArrowLeft className="w-4 h-4 mr-1" />
                </Button>
              </div>
            )}

            {/* Step 2: OTP Input */}
            {step === 'otp' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <label className="block font-body text-xs font-bold text-ink mb-3 text-center">
                    أدخل كود التأكيد ({OTP_LENGTH} أرقام)
                  </label>

                  {/* OTP Input Grid */}
                  <div className="flex items-center justify-center gap-2 dir-ltr" dir="ltr">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => { otpInputRefs.current[idx] = el; }}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
                          handleOtpChange(idx, pasted);
                        }}
                        disabled={isVerifying}
                        className={`w-11 h-13 sm:w-12 sm:h-14 rounded-xl border-2 text-center font-mono text-xl font-black focus:outline-none transition-all duration-150 font-mono-nums ${
                          digit
                            ? 'border-primary bg-primary-soft/30 text-primary-ink shadow-xs'
                            : 'border-line bg-canvas text-ink focus:border-primary focus:ring-2 focus:ring-primary/30'
                        } ${isVerifying ? 'opacity-60' : ''}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Verify Loading */}
                {isVerifying && (
                  <div className="flex items-center justify-center gap-2 text-primary-ink text-xs font-body font-bold animate-in fade-in">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري التحقق من الكود...</span>
                  </div>
                )}

                {/* Resend */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  {cooldown > 0 ? (
                    <span className="text-xs font-body text-ink-soft">
                      إعادة الإرسال بعد <span className="font-mono font-bold text-ink font-mono-nums">{cooldown}</span> ثانية
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isSending}
                      className="flex items-center gap-1.5 text-xs font-body font-bold text-primary-ink hover:text-primary transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
                      <span>إعادة إرسال الكود</span>
                    </button>
                  )}
                </div>

                {/* Back to phone step */}
                <button
                  type="button"
                  onClick={() => { setStep('phone'); setError(null); }}
                  className="w-full text-center text-xs font-body text-ink-soft hover:text-ink transition-colors py-1"
                >
                  تغيير رقم الهاتف
                </button>
              </div>
            )}

            {/* Step 3: Success */}
            {step === 'success' && (
              <div className="flex flex-col items-center text-center space-y-3 py-4 animate-in zoom-in-95 fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-accent-soft flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-accent stroke-[2]" />
                </div>
                <div>
                  <p className="font-display font-bold text-base text-ink">
                    تم تأكيد رقم هاتفك بنجاح! ✅
                  </p>
                  <p className="font-body text-xs text-ink-soft mt-1">
                    يمكنك الآن إتمام طلبات الكاش عند الاستلام
                  </p>
                </div>
                <p className="font-mono text-sm font-bold text-primary-ink bg-primary-soft/30 px-4 py-2 rounded-xl border border-primary/20 font-mono-nums tracking-wider dir-ltr" dir="ltr">
                  {phone}
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-danger-soft border border-danger/30 text-danger rounded-xl p-3 text-xs font-body font-bold animate-in fade-in duration-200 text-center">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

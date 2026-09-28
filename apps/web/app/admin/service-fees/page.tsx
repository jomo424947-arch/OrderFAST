'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useServiceFeeStore, PresetKey, ServiceFeeConfig, computeServiceFee } from '@/stores/useServiceFeeStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatEGP } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import {
  Receipt,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Coins,
  CreditCard,
  Banknote,
  Calendar,
  Gift,
  Percent,
  Sliders,
  RotateCcw,
  Save,
  Calculator,
  ArrowRight,
  TrendingDown,
  Clock,
  ShieldCheck,
  Zap,
  Info,
  Loader2,
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { day: 0, label: 'الأحد', short: 'أحد' },
  { day: 1, label: 'الإثنين', short: 'إثنين' },
  { day: 2, label: 'الثلاثاء', short: 'ثلاثاء' },
  { day: 3, label: 'الأربعاء', short: 'أربعاء' },
  { day: 4, label: 'الخميس', short: 'خميس' },
  { day: 5, label: 'الجمعة', short: 'جمعة' },
  { day: 6, label: 'السبت', short: 'سبت' },
];

export default function AdminServiceFeesPage() {
  const {
    config,
    isLoading,
    isSaving,
    fetchConfig,
    updateConfig,
    resetToDefaults,
    applyPreset,
  } = useServiceFeeStore();

  const { adminStats, fetchAdminStats } = useOrderStore();

  // Local form state for batch edits
  const [form, setForm] = useState<ServiceFeeConfig>(config);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Live Simulator States
  const [simSubtotal, setSimSubtotal] = useState<number>(140);
  const [simPaymentMethod, setSimPaymentMethod] = useState<'cash' | 'digital_wallet'>('digital_wallet');
  const [simIsFirstOrder, setSimIsFirstOrder] = useState<boolean>(false);
  const [simDayOfWeek, setSimDayOfWeek] = useState<number>(new Date().getDay());

  useEffect(() => {
    fetchConfig();
    fetchAdminStats();
  }, [fetchConfig, fetchAdminStats]);

  // Sync form when config is fetched
  useEffect(() => {
    setForm(config);
  }, [config]);

  // Handle Input Changes
  const handleNumberChange = (field: keyof ServiceFeeConfig, value: string) => {
    const num = Number(value);
    setForm((prev) => ({
      ...prev,
      [field]: isNaN(num) ? 0 : Math.max(0, num),
    }));
  };

  const handleToggle = (field: keyof ServiceFeeConfig) => {
    setForm((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleToggleDay = (dayIndex: number) => {
    setForm((prev) => {
      const currentDays = Array.isArray(prev.freeDaysOfWeek) ? prev.freeDaysOfWeek : [];
      const exists = currentDays.includes(dayIndex);
      const nextDays = exists
        ? currentDays.filter((d) => d !== dayIndex)
        : [...currentDays, dayIndex].sort();
      return {
        ...prev,
        freeDaysOfWeek: nextDays,
      };
    });
  };

  // Save changes with validation
  const handleSave = async () => {
    setFeedback(null);

    // 1. Validation checks
    if (form.tier1MaxEgp <= 0) {
      setFeedback({ type: 'error', message: 'الحد الأقصى للشريحة الأولى يجب أن يكون أكبر من 0 ج.م' });
      return;
    }
    if (form.tier2MaxEgp <= form.tier1MaxEgp) {
      setFeedback({ type: 'error', message: 'الحد الأقصى للشريحة الثانية يجب أن يكون أكبر من الشريحة الأولى' });
      return;
    }
    if (form.tier1FeeCash < 0 || form.tier1FeeOnline < 0) {
      setFeedback({ type: 'error', message: 'رسوم الشريحة الأولى لا يمكن أن تكون سالبة' });
      return;
    }
    if (form.tier2FeeCash < 0 || form.tier2FeeOnline < 0) {
      setFeedback({ type: 'error', message: 'رسوم الشريحة الثانية لا يمكن أن تكون سالبة' });
      return;
    }
    if (form.tier3FeeCash < 0 || form.tier3FeeOnline < 0) {
      setFeedback({ type: 'error', message: 'رسوم الشريحة الثالثة لا يمكن أن تكون سالبة' });
      return;
    }
    if (form.minFeeCap < 0) {
      setFeedback({ type: 'error', message: 'الحد الأدنى للرسوم لا يمكن أن يكون سالباً' });
      return;
    }
    if (form.maxFeeCap > 0 && form.maxFeeCap < form.minFeeCap) {
      setFeedback({ type: 'error', message: 'الحد الأقصى للرسوم يجب أن يكون أكبر من أو يساوي الحد الأدنى' });
      return;
    }
    if (form.promoDiscountPercent < 0 || form.promoDiscountPercent > 100) {
      setFeedback({ type: 'error', message: 'نسبة الخصم الترويجي يجب أن تكون بين 0% و 100%' });
      return;
    }

    const success = await updateConfig(form);
    if (success) {
      setFeedback({ type: 'success', message: 'تم حفظ وتفعيل إعدادات رسوم الخدمة بنجاح!' });
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ type: 'error', message: 'تعذر حفظ الإعدادات على الخادم، يرجى المحاولة مرة أخرى.' });
    }
  };

  // Reset to defaults
  const handleReset = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في استعادة الإعدادات الافتراضية لرسوم الخدمة؟')) return;
    setFeedback(null);
    const success = await resetToDefaults();
    if (success) {
      setFeedback({ type: 'success', message: 'تمت استعادة الإعدادات الافتراضية بنجاح.' });
    } else {
      setFeedback({ type: 'error', message: 'تعذر استعادة الإعدادات الافتراضية من الخادم.' });
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  // Apply Preset
  const handlePreset = async (preset: PresetKey) => {
    const success = await applyPreset(preset);
    if (success) {
      setFeedback({ type: 'success', message: 'تم تطبيق القالب المحدد بنجاح.' });
    } else {
      setFeedback({ type: 'error', message: 'فشل تطبيق القالب على الخادم.' });
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  // Calculate live simulator result directly from the current form values being edited
  const simulatedResult = useMemo(() => {
    // Construct dummy date matching simDayOfWeek
    const d = new Date();
    const currentDay = d.getDay();
    const diff = simDayOfWeek - currentDay;
    d.setDate(d.getDate() + diff);

    // Compute live with current form state
    return computeServiceFee(form, {
      subtotalEGP: simSubtotal,
      paymentMethod: simPaymentMethod,
      isFirstOrder: simIsFirstOrder,
      date: d,
    });
  }, [form, simSubtotal, simPaymentMethod, simIsFirstOrder, simDayOfWeek]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line/60">
        <div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/admin"
              className="p-1.5 rounded-xl bg-canvas border border-line hover:border-ink-soft text-ink transition-colors"
              title="العودة للوحة الإدارة"
            >
              <ArrowRight className="w-4 h-4" />
            </Link>
            <h1 className="font-display font-black text-xl sm:text-2xl text-ink flex items-center gap-2">
              <Receipt className="w-6 h-6 text-primary" />
              <span>إدارة رسوم الخدمة وقواعد التسعير</span>
              {isLoading && (
                <span className="text-[11px] font-body font-normal text-ink-soft bg-canvas px-2.5 py-0.5 rounded-full border border-line flex items-center gap-1.5 mr-2">
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                  <span>جاري المزامنة...</span>
                </span>
              )}
            </h1>
          </div>
          <p className="font-body text-xs sm:text-sm text-ink-soft mt-1 mr-9">
            تحكم كامل في رسوم كل طلب في الحرم الجامعي، شرائح الأسعار، التفرقة بين الكاش والأونلاين، وأيام الطلب المجاني
          </p>
        </div>

        <div className="flex items-center gap-2.5 mr-9 sm:mr-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isSaving}
            className="text-xs font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5 ml-1.5" />
            <span>استعادة الافتراضي</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="text-xs font-bold shadow-warm min-w-[110px]"
          >
            {isSaving ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>جاري الحفظ...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Save className="w-4 h-4 ml-1" />
                <span>حفظ التعديلات</span>
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={cn(
            'p-3.5 sm:p-4 rounded-2xl border text-xs sm:text-sm font-body font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200',
            feedback.type === 'success'
              ? 'bg-accent-soft text-accent border-accent/30'
              : 'bg-danger-soft text-danger border-danger/30'
          )}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Financial Health Banner */}
      <div className="bg-gradient-to-l from-amber-500/10 via-primary/5 to-surface border border-primary/30 rounded-3xl p-4 sm:p-5 shadow-warm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary text-primary-ink flex items-center justify-center flex-shrink-0 shadow-sm">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <p className="font-display font-bold text-sm sm:text-base text-ink">
                إجمالي أرباح المنصة من رسوم الخدمة حتى الآن
              </p>
              <p className="font-body text-xs text-ink-soft mt-0.5">
                تُحسب تلقائياً وبدقة 100% مع كل طلب يتم إتمامه وتسليمه للطلاب
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 self-end sm:self-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-line/40">
            <div>
              <span className="text-[11px] font-body text-ink-soft block">أرباح اليوم</span>
              <span className="font-mono text-base sm:text-lg font-black text-accent font-mono-nums">
                {formatEGP((adminStats?.todayFeeRevenuePiasters ?? 0) / 100)}
              </span>
            </div>
            <div className="h-7 w-px bg-line" />
            <div>
              <span className="text-[11px] font-body text-ink-soft block">إجمالي أرباح الرسوم</span>
              <span className="font-mono text-base sm:text-xl font-black text-primary font-mono-nums">
                {formatEGP((adminStats?.totalFeeRevenuePiasters ?? 0) / 100)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Master Toggle & Quick Presets */}
      <div className="bg-surface border border-line rounded-3xl p-5 sm:p-6 shadow-warm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line/60">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-2xl flex items-center justify-center transition-colors shadow-xs',
                form.isEnabled ? 'bg-accent-soft text-accent' : 'bg-line text-ink-soft'
              )}
            >
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base sm:text-lg text-ink">
                  تفعيل نظام رسوم الخدمة
                </h3>
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                    form.isEnabled
                      ? 'bg-accent-soft text-accent border-accent/30'
                      : 'bg-canvas text-ink-soft border-line'
                  )}
                >
                  {form.isEnabled ? 'الرسوم مفعلة ومحصلة' : 'الخدمة مجانية بالكامل'}
                </span>
              </div>
              <p className="font-body text-xs text-ink-soft mt-0.5">
                عند التعطيل، تصبح رسوم الخدمة 0 ج.م على جميع الطلاب لجميع الطلبات في الحرم الجامعي
              </p>
            </div>
          </div>

          {/* Interactive Switch */}
          <button
            type="button"
            dir="ltr"
            onClick={() => handleToggle('isEnabled')}
            className={cn(
              'relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner',
              form.isEnabled ? 'bg-accent' : 'bg-line'
            )}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                form.isEnabled ? 'translate-x-7' : 'translate-x-0'
              )}
            />
          </button>
        </div>

        {/* Presets Row */}
        <div>
          <span className="font-body text-xs font-bold text-ink-soft block mb-2.5">
            قوالب تسعير سريعة بنقرة واحدة:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            <button
              type="button"
              onClick={() => handlePreset('standard')}
              className="p-3 bg-canvas hover:bg-surface border border-line hover:border-primary/60 rounded-2xl text-right transition-all group"
            >
              <span className="font-display font-bold text-xs text-ink block group-hover:text-primary">
                الوضع القياسي
              </span>
              <span className="text-[10px] font-body text-ink-soft block mt-0.5">
                3 / 5 / 10 ج.م (كاش)
              </span>
            </button>

            <button
              type="button"
              onClick={() => handlePreset('online_boost')}
              className="p-3 bg-canvas hover:bg-accent-soft/20 border border-line hover:border-accent/60 rounded-2xl text-right transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-xs text-ink block group-hover:text-accent">
                  تشجيع الأونلاين
                </span>
              </div>
              <span className="text-[10px] font-body text-ink-soft block mt-0.5">
                خصم 50% للدفع بالمحفظة
              </span>
            </button>

            <button
              type="button"
              onClick={() => handlePreset('promo_fest')}
              className="p-3 bg-canvas hover:bg-primary-soft/20 border border-line hover:border-primary/60 rounded-2xl text-right transition-all group"
            >
              <span className="font-display font-bold text-xs text-ink block group-hover:text-primary">
                موسم الخصومات
              </span>
              <span className="text-[10px] font-body text-ink-soft block mt-0.5">
                خصم 50% على جميع الرسوم
              </span>
            </button>

            <button
              type="button"
              onClick={() => handlePreset('flat_economy')}
              className="p-3 bg-canvas hover:bg-surface border border-line hover:border-ink-soft rounded-2xl text-right transition-all group"
            >
              <span className="font-display font-bold text-xs text-ink block">
                رسوم موحدة مخفضة
              </span>
              <span className="text-[10px] font-body text-ink-soft block mt-0.5">
                3 ج.م كاش / 2 ج.م أونلاين
              </span>
            </button>

            <button
              type="button"
              onClick={() => handlePreset('free_weekends')}
              className="p-3 bg-canvas hover:bg-accent-soft/20 border border-line hover:border-accent/60 rounded-2xl text-right transition-all group col-span-2 sm:col-span-1"
            >
              <span className="font-display font-bold text-xs text-ink block group-hover:text-accent">
                عطلة نهاية أسبوع مجانية
              </span>
              <span className="text-[10px] font-body text-ink-soft block mt-0.5">
                الجمعة والسبت مجاناً
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Three Tiers & Cash vs Online Distinction */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-base sm:text-lg text-ink flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" />
              <span>شرائح قيمة الأوردر والتفرقة بين الكاش والأونلاين</span>
            </h3>
            <p className="font-body text-xs text-ink-soft mt-0.5">
              يمكنك تخصيص رسم أقل للدفع الإلكتروني لتشجيع الطلاب على التحول الرقمي وتخفيف عبء الفكة عن الكاشير
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tier 1 Card */}
          <div className="bg-surface border border-line/90 rounded-3xl p-4 sm:p-5 shadow-warm flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-accent/60" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-display px-2.5 py-0.5 rounded-full bg-accent-soft text-accent border border-accent/20">
                  الشريحة الأولى (خفيفة)
                </span>
                <span className="text-[11px] font-mono font-bold text-ink-soft">
                  أقل من {form.tier1MaxEgp} ج.م
                </span>
              </div>
              <p className="text-xs font-body text-ink-soft">
                للطلبات الصغيرة مثل ساندوتش واحد، كانز، قهوة أو سناك سريع.
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t border-line/60">
              {/* Threshold */}
              <div>
                <label className="text-[11px] font-body font-bold text-ink-soft block mb-1">
                  الحد الأقصى للشريحة (ج.م)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={form.tier1MaxEgp}
                  onChange={(e) => handleNumberChange('tier1MaxEgp', e.target.value)}
                  className="w-full bg-canvas border border-line rounded-xl px-3 py-1.5 text-sm font-mono font-bold text-ink focus:border-primary focus:outline-none"
                />
              </div>

              {/* Cash Fee */}
              <div className="bg-canvas/60 p-2.5 rounded-2xl border border-line/60">
                <div className="flex items-center justify-between text-xs font-body font-bold text-ink mb-1">
                  <span className="flex items-center gap-1.5 text-ink-soft">
                    <Banknote className="w-3.5 h-3.5 text-amber-700" />
                    <span>رسم الدفع كاش:</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.tier1FeeCash}
                      onChange={(e) => handleNumberChange('tier1FeeCash', e.target.value)}
                      className="w-14 bg-surface border border-line rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-center text-ink"
                    />
                    <span className="text-[10px] text-ink-soft">ج.م</span>
                  </div>
                </div>
              </div>

              {/* Online Fee */}
              <div className="bg-accent-soft/30 p-2.5 rounded-2xl border border-accent/20">
                <div className="flex items-center justify-between text-xs font-body font-bold text-ink mb-1">
                  <span className="flex items-center gap-1.5 text-accent">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>رسم الدفع أونلاين:</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.tier1FeeOnline}
                      onChange={(e) => handleNumberChange('tier1FeeOnline', e.target.value)}
                      className="w-14 bg-surface border border-accent/40 rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-center text-accent"
                    />
                    <span className="text-[10px] text-accent">ج.م</span>
                  </div>
                </div>
                {form.tier1FeeCash > form.tier1FeeOnline && (
                  <p className="text-[10px] font-body text-accent font-semibold mt-1">
                    الطالب يوفر {form.tier1FeeCash - form.tier1FeeOnline} ج.م عند الدفع أونلاين
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tier 2 Card */}
          <div className="bg-surface border border-line/90 rounded-3xl p-4 sm:p-5 shadow-warm flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-primary/70" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-display px-2.5 py-0.5 rounded-full bg-primary-soft text-primary-ink border border-primary/20">
                  الشريحة الثانية (متوسطة)
                </span>
                <span className="text-[11px] font-mono font-bold text-ink-soft">
                  {form.tier1MaxEgp} إلى {form.tier2MaxEgp} ج.م
                </span>
              </div>
              <p className="text-xs font-body text-ink-soft">
                لطلبات وجبات الغداء المتكاملة أو فطار مشترك لشخصين.
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t border-line/60">
              {/* Threshold */}
              <div>
                <label className="text-[11px] font-body font-bold text-ink-soft block mb-1">
                  الحد الأقصى للشريحة (ج.م)
                </label>
                <input
                  type="number"
                  min={form.tier1MaxEgp + 1}
                  max="2000"
                  value={form.tier2MaxEgp}
                  onChange={(e) => handleNumberChange('tier2MaxEgp', e.target.value)}
                  className="w-full bg-canvas border border-line rounded-xl px-3 py-1.5 text-sm font-mono font-bold text-ink focus:border-primary focus:outline-none"
                />
              </div>

              {/* Cash Fee */}
              <div className="bg-canvas/60 p-2.5 rounded-2xl border border-line/60">
                <div className="flex items-center justify-between text-xs font-body font-bold text-ink mb-1">
                  <span className="flex items-center gap-1.5 text-ink-soft">
                    <Banknote className="w-3.5 h-3.5 text-amber-700" />
                    <span>رسم الدفع كاش:</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.tier2FeeCash}
                      onChange={(e) => handleNumberChange('tier2FeeCash', e.target.value)}
                      className="w-14 bg-surface border border-line rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-center text-ink"
                    />
                    <span className="text-[10px] text-ink-soft">ج.م</span>
                  </div>
                </div>
              </div>

              {/* Online Fee */}
              <div className="bg-accent-soft/30 p-2.5 rounded-2xl border border-accent/20">
                <div className="flex items-center justify-between text-xs font-body font-bold text-ink mb-1">
                  <span className="flex items-center gap-1.5 text-accent">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>رسم الدفع أونلاين:</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.tier2FeeOnline}
                      onChange={(e) => handleNumberChange('tier2FeeOnline', e.target.value)}
                      className="w-14 bg-surface border border-accent/40 rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-center text-accent"
                    />
                    <span className="text-[10px] text-accent">ج.م</span>
                  </div>
                </div>
                {form.tier2FeeCash > form.tier2FeeOnline && (
                  <p className="text-[10px] font-body text-accent font-semibold mt-1">
                    الطالب يوفر {form.tier2FeeCash - form.tier2FeeOnline} ج.م عند الدفع أونلاين
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tier 3 Card */}
          <div className="bg-surface border border-line/90 rounded-3xl p-4 sm:p-5 shadow-warm flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-amber-600" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-display px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  الشريحة الثالثة (عائلية / عزومات)
                </span>
                <span className="text-[11px] font-mono font-bold text-ink-soft">
                  أكثر من {form.tier2MaxEgp} ج.م
                </span>
              </div>
              <p className="text-xs font-body text-ink-soft">
                لطلبات المجموعات، عزومات الأصدقاء، وطلبات الدفعات الكبيرة.
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t border-line/60">
              {/* Threshold Info */}
              <div className="bg-canvas/40 p-2.5 rounded-xl border border-line/40 text-[11px] font-body text-ink-soft">
                <span>تُطبق تلقائياً على أي طلب يتجاوز {form.tier2MaxEgp} ج.م</span>
              </div>

              {/* Cash Fee */}
              <div className="bg-canvas/60 p-2.5 rounded-2xl border border-line/60">
                <div className="flex items-center justify-between text-xs font-body font-bold text-ink mb-1">
                  <span className="flex items-center gap-1.5 text-ink-soft">
                    <Banknote className="w-3.5 h-3.5 text-amber-700" />
                    <span>رسم الدفع كاش:</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="200"
                      value={form.tier3FeeCash}
                      onChange={(e) => handleNumberChange('tier3FeeCash', e.target.value)}
                      className="w-14 bg-surface border border-line rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-center text-ink"
                    />
                    <span className="text-[10px] text-ink-soft">ج.م</span>
                  </div>
                </div>
              </div>

              {/* Online Fee */}
              <div className="bg-accent-soft/30 p-2.5 rounded-2xl border border-accent/20">
                <div className="flex items-center justify-between text-xs font-body font-bold text-ink mb-1">
                  <span className="flex items-center gap-1.5 text-accent">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>رسم الدفع أونلاين:</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="200"
                      value={form.tier3FeeOnline}
                      onChange={(e) => handleNumberChange('tier3FeeOnline', e.target.value)}
                      className="w-14 bg-surface border border-accent/40 rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-center text-accent"
                    />
                    <span className="text-[10px] text-accent">ج.م</span>
                  </div>
                </div>
                {form.tier3FeeCash > form.tier3FeeOnline && (
                  <p className="text-[10px] font-body text-accent font-semibold mt-1">
                    الطالب يوفر {form.tier3FeeCash - form.tier3FeeOnline} ج.م عند الدفع أونلاين
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Free Order Days & Special Events */}
      <div className="bg-surface border border-line rounded-3xl p-5 sm:p-6 shadow-warm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-line/60">
          <div>
            <h3 className="font-display font-bold text-base sm:text-lg text-ink flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              <span>أيام الطلب المجاني (Free Delivery / Service Days)</span>
            </h3>
            <p className="font-body text-xs text-ink-soft mt-0.5">
              حدد أيام أسبوعية دورية أو يوماً استثنائياً بتاريخ محدد تكون فيه رسوم الخدمة 0 ج.م على جميع الطلاب
            </p>
          </div>
        </div>

        {/* Weekly Day Selector */}
        <div>
          <label className="text-xs font-body font-bold text-ink block mb-2">
            اختر الأيام الأسبوعية المجانية:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map((item) => {
              const isSelected = Array.isArray(form.freeDaysOfWeek) && form.freeDaysOfWeek.includes(item.day);
              return (
                <button
                  key={item.day}
                  type="button"
                  onClick={() => handleToggleDay(item.day)}
                  className={cn(
                    'py-2 px-3 rounded-2xl border text-xs font-body font-bold transition-all text-center flex flex-col items-center justify-center gap-1',
                    isSelected
                      ? 'bg-accent text-white border-accent shadow-xs'
                      : 'bg-canvas text-ink-soft border-line hover:border-ink-soft'
                  )}
                >
                  <span>{item.label}</span>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.2 rounded-md',
                      isSelected ? 'bg-white/20 text-white' : 'text-ink-soft'
                    )}
                  >
                    {isSelected ? 'مجاني' : 'عادي'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Specific Date & Banner Text */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-line/60">
          <div>
            <label className="text-xs font-body font-bold text-ink block mb-1">
              يوم مجاني استثنائي بتاريخ محدد (اختياري):
            </label>
            <input
              type="date"
              value={form.specialFreeDate || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, specialFreeDate: e.target.value || null }))}
              className="w-full bg-canvas border border-line rounded-xl px-3 py-2 text-xs font-mono font-bold text-ink focus:border-primary focus:outline-none"
            />
            <p className="text-[10px] font-body text-ink-soft mt-1">
              مثال: يوم بدء الترم، اليوم الوطني، أو مناسبة احتفالية بالجامعة.
            </p>
          </div>

          <div>
            <label className="text-xs font-body font-bold text-ink block mb-1">
              النص الترويجي الذي يظهر للطلاب في اليوم المجاني:
            </label>
            <input
              type="text"
              value={form.freeDayBannerText}
              onChange={(e) => setForm((prev) => ({ ...prev, freeDayBannerText: e.target.value }))}
              placeholder="اليوم طلبك بدون أي رسوم خدمة في الحرم الجامعي!"
              className="w-full bg-canvas border border-line rounded-xl px-3 py-2 text-xs font-body font-semibold text-ink focus:border-primary focus:outline-none"
            />
            <p className="text-[10px] font-body text-ink-soft mt-1">
              يظهر في سلة المشتريات وشريط الفاتورة للطلاب لإشعارهم باليوم المجاني.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Advanced Controls: First Order Free, Promo Discount, Caps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* First Order Waiver */}
        <div className="bg-surface border border-line rounded-3xl p-5 shadow-warm flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-soft text-accent flex items-center justify-center flex-shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-ink">
                  إعفاء أول أوردر مجاناً
                </h4>
                <p className="font-body text-[11px] text-ink-soft mt-0.5">
                  أول تجربة للطلب في الحرم بدون أي رسوم خدمة
                </p>
              </div>
            </div>
            <button
              type="button"
              dir="ltr"
              onClick={() => handleToggle('firstOrderFree')}
              className={cn(
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                form.firstOrderFree ? 'bg-accent' : 'bg-line'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  form.firstOrderFree ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>
          <p className="text-xs font-body text-ink-soft leading-relaxed bg-canvas/60 p-2.5 rounded-xl border border-line/50">
            ميزة تسويقية ممتازة تشجع الطلاب الجدد على تسجيل حساب وتجربة أول أوردر فوراً.
          </p>
        </div>

        {/* Promo Percentage Discount */}
        <div className="bg-surface border border-line rounded-3xl p-5 shadow-warm space-y-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-soft text-primary-ink flex items-center justify-center flex-shrink-0">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-ink">
                  خصم ترويجي مؤقت على الرسوم
                </h4>
                <p className="font-body text-[11px] text-ink-soft mt-0.5">
                  تخفيض نسبة مئوية لفترة محددة
                </p>
              </div>
            </div>
            <button
              type="button"
              dir="ltr"
              onClick={() => handleToggle('promoDiscountActive')}
              className={cn(
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                form.promoDiscountActive ? 'bg-primary' : 'bg-line'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  form.promoDiscountActive ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-[11px] font-body font-bold text-ink-soft block mb-1">
                نسبة الخصم (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.promoDiscountPercent}
                onChange={(e) => handleNumberChange('promoDiscountPercent', e.target.value)}
                disabled={!form.promoDiscountActive}
                className="w-full bg-canvas border border-line rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-ink disabled:opacity-50"
              />
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-body font-bold text-ink-soft block mb-1">
                ينتهي في تاريخ (اختياري)
              </label>
              <input
                type="date"
                value={form.promoDiscountEndsAt ? form.promoDiscountEndsAt.slice(0, 10) : ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    promoDiscountEndsAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                  }))
                }
                disabled={!form.promoDiscountActive}
                className="w-full bg-canvas border border-line rounded-xl px-2 py-1.5 text-xs font-mono font-bold text-ink disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-body font-bold text-ink-soft block mb-1">
              نص بنر العرض الترويجي للطلاب
            </label>
            <input
              type="text"
              value={form.promoBannerText || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, promoBannerText: e.target.value }))}
              placeholder="خصم خاص على رسوم الخدمة لفترة محدودة!"
              disabled={!form.promoDiscountActive}
              className="w-full bg-canvas border border-line rounded-xl px-3 py-1.5 text-xs font-body text-ink placeholder:text-ink-soft/50 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Safety Limits (Min / Max Cap) */}
        <div className="bg-surface border border-line rounded-3xl p-5 shadow-warm space-y-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-ink">
                سقف الأمان للرسم (Caps)
              </h4>
              <p className="font-body text-[11px] text-ink-soft mt-0.5">
                حد أدنى وأقصى لحماية التسعير
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-[11px] font-body font-bold text-ink-soft block mb-1">
                الحد الأدنى للرسم (ج.م)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={form.minFeeCap}
                onChange={(e) => handleNumberChange('minFeeCap', e.target.value)}
                className="w-full bg-canvas border border-line rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-ink"
              />
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-body font-bold text-ink-soft block mb-1">
                الحد الأقصى للرسم (ج.م)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={form.maxFeeCap}
                onChange={(e) => handleNumberChange('maxFeeCap', e.target.value)}
                className="w-full bg-canvas border border-line rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-ink"
              />
            </div>
          </div>
          <p className="text-[10px] font-body text-ink-soft">
            يضمن عدم تجاوز رسم الخدمة الحد الأقصى حتى في الطلبات الكبيرة جداً.
          </p>
        </div>
      </div>

      {/* 6. Live Simulator & Test Drive */}
      <div className="bg-gradient-to-br from-surface via-canvas/40 to-surface border-2 border-primary/30 rounded-3xl p-5 sm:p-7 shadow-warm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary text-primary-ink flex items-center justify-center flex-shrink-0 shadow-sm">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-ink">
                محاكي التسعير الفوري (Live Simulator)
              </h3>
              <p className="font-body text-xs text-ink-soft mt-0.5">
                جرب إدخال أي قيمة أوردر وطريقة دفع لمعاينة الرسم الدقيق كما سيظهر للطالب تماماً
              </p>
            </div>
          </div>
          <span className="text-[11px] font-body font-bold bg-primary-soft text-primary-ink px-2.5 py-1 rounded-full w-fit">
            محاكاة فورية حية
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Controls Column */}
          <div className="lg:col-span-7 space-y-4">
            {/* Subtotal Slider & Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-body font-bold text-ink">
                  قيمة الأوردر التجريبي:
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={simSubtotal}
                    onChange={(e) => setSimSubtotal(Math.max(1, Number(e.target.value)))}
                    className="w-20 bg-surface border border-line rounded-lg px-2.5 py-1 text-sm font-mono font-black text-ink text-center"
                  />
                  <span className="text-xs font-bold font-body text-ink-soft">ج.م</span>
                </div>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="5"
                value={simSubtotal}
                onChange={(e) => setSimSubtotal(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-ink-soft mt-1">
                <span>10 ج.م</span>
                <span>100 ج.م</span>
                <span>200 ج.م</span>
                <span>350 ج.م</span>
                <span>500 ج.م</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-body font-bold text-ink block mb-1.5">
                طريقة الدفع:
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSimPaymentMethod('cash')}
                  className={cn(
                    'py-2 px-3 rounded-2xl border text-xs font-body font-bold flex items-center justify-center gap-2 transition-all',
                    simPaymentMethod === 'cash'
                      ? 'bg-ink text-white border-ink shadow-xs'
                      : 'bg-surface text-ink-soft border-line hover:border-ink-soft'
                  )}
                >
                  <Banknote className="w-4 h-4" />
                  <span>دفع كاش (عند الاستلام)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSimPaymentMethod('digital_wallet')}
                  className={cn(
                    'py-2 px-3 rounded-2xl border text-xs font-body font-bold flex items-center justify-center gap-2 transition-all',
                    simPaymentMethod === 'digital_wallet'
                      ? 'bg-accent text-white border-accent shadow-xs'
                      : 'bg-surface text-ink-soft border-line hover:border-ink-soft'
                  )}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>دفع إلكتروني (محفظة / انستاباي)</span>
                </button>
              </div>
            </div>

            {/* Test Day & First Order Toggles */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-line/60">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-body font-bold text-ink">
                <input
                  type="checkbox"
                  checked={simIsFirstOrder}
                  onChange={(e) => setSimIsFirstOrder(e.target.checked)}
                  className="rounded border-line text-accent focus:ring-accent"
                />
                <span>محاكاة: هذا أول أوردر للطالب؟</span>
              </label>

              <div className="flex items-center gap-2 text-xs font-body font-bold text-ink mr-auto">
                <span className="text-ink-soft">اليوم المراد اختباره:</span>
                <select
                  value={simDayOfWeek}
                  onChange={(e) => setSimDayOfWeek(Number(e.target.value))}
                  className="bg-surface border border-line rounded-lg px-2.5 py-1 text-xs font-body font-bold text-ink focus:border-primary focus:outline-none"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d.day} value={d.day}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Results Column: Visual Student Ticket */}
          <div className="lg:col-span-5 bg-surface border-2 border-line/80 rounded-3xl p-5 shadow-ticket space-y-3.5 relative">
            <div className="flex items-center justify-between pb-2 border-b border-line/60">
              <span className="text-xs font-display font-bold text-ink-soft">
                معاينة فاتورة الطالب الحقيقية
              </span>
              <span
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full',
                  simulatedResult.isFree
                    ? 'bg-accent-soft text-accent border border-accent/20'
                    : 'bg-primary-soft text-primary-ink border border-primary/20'
                )}
              >
                الشريحة {simulatedResult.appliedTier}
              </span>
            </div>

            <div className="space-y-2 text-xs font-body">
              <div className="flex justify-between text-ink-soft">
                <span>إجمالي الأصناف:</span>
                <span className="font-mono font-bold text-ink font-mono-nums">{formatEGP(simSubtotal)}</span>
              </div>

              <div className="flex justify-between text-ink-soft items-center">
                <div className="flex items-center gap-1.5">
                  <span>رسوم الخدمة:</span>
                  {simulatedResult.isFree && (
                    <span className="text-[10px] font-bold text-accent bg-accent-soft px-1.5 py-0.2 rounded-full">
                      مجاناً
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    'font-mono font-bold font-mono-nums',
                    simulatedResult.isFree ? 'text-accent' : 'text-ink'
                  )}
                >
                  {simulatedResult.isFree ? '0 ج.م' : formatEGP(simulatedResult.feeEGP)}
                </span>
              </div>

              {simulatedResult.discountAmountEGP > 0 && (
                <div className="flex justify-between text-[11px] text-accent font-bold">
                  <span>وفرت من العرض:</span>
                  <span className="font-mono font-mono-nums">-{formatEGP(simulatedResult.discountAmountEGP)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm font-bold font-body text-ink pt-2.5 border-t border-line/60">
                <span>المطلوب من الطالب:</span>
                <span className="font-mono text-lg font-black text-primary font-mono-nums">
                  {formatEGP(simSubtotal + simulatedResult.feeEGP)}
                </span>
              </div>
            </div>

            {/* Explanation Reason Tag */}
            <div className="bg-canvas p-3 rounded-2xl border border-line/60 text-[11px] font-body text-ink-soft flex items-center gap-2">
              <Info className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{simulatedResult.reason}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Last Updated Footnote */}
      {config.updatedAt && (
        <div className="text-center font-body text-xs text-ink-soft flex items-center justify-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          <span>
            آخر تحديث للإعدادات:{' '}
            <strong className="text-ink">
              {new Date(config.updatedAt).toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </strong>{' '}
            بواسطة ({config.updatedBy || 'مدير النظام'})
          </span>
        </div>
      )}
    </div>
  );
}

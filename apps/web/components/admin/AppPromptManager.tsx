'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';
import { apiClient } from '@/lib/api/client';
import {
  Zap,
  Coffee,
  UtensilsCrossed,
  Sparkles,
  Flame,
  Gift,
  Percent,
  Clock,
  ArrowLeft,
  X,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Save,
  Check,
  Smartphone,
  ImageIcon,
  Tag,
  Trash2,
  Layers,
} from 'lucide-react';

export interface AppPromptConfig {
  id?: string;
  isEnabled: boolean;
  mode: 'auto' | 'custom';
  title: string;
  message: string;
  subtext: string;
  icon: string;
  imageUrl?: string | null;
  badgeText?: string | null;
  layoutMode?: 'smart_fit' | 'full_poster' | 'banner';
  actionText: string;
  actionUrl: string;
  durationSeconds: number;
  frequencyHours: number;
}

const AVAILABLE_ICONS = [
  { id: 'zap', label: 'طاقة ونشاط', icon: Zap, bg: 'bg-amber-100', color: 'text-amber-600' },
  { id: 'coffee', label: 'قهوة ومشروبات', icon: Coffee, bg: 'bg-primary-soft', color: 'text-primary' },
  { id: 'utensils', label: 'وجبات وسندوتشات', icon: UtensilsCrossed, bg: 'bg-accent-soft', color: 'text-accent' },
  { id: 'sparkles', label: 'عروض ومميزات', icon: Sparkles, bg: 'bg-purple-100', color: 'text-purple-600' },
  { id: 'flame', label: 'تريند وأكثر طلباً', icon: Flame, bg: 'bg-orange-100', color: 'text-orange-600' },
  { id: 'gift', label: 'هدايا ومكافآت', icon: Gift, bg: 'bg-emerald-100', color: 'text-emerald-600' },
  { id: 'percent', label: 'خصومات خاصة', icon: Percent, bg: 'bg-rose-100', color: 'text-rose-600' },
];

const PRESET_BANNERS = [
  {
    label: 'طعمية سوري 🥙',
    url: '/images/festival_land_falafel_story.jpg',
    title: 'جديد: طعمية سوري بـ 25 ج.م',
    badge: 'Festival Land 🔥',
    layoutMode: 'full_poster' as const,
  },
  {
    label: 'برجر كومبو 🍔',
    url: '/images/banner_burger_combo.jpg',
    title: 'عروض الكومبو المميزة',
    badge: 'عرض محدود 🔥',
    layoutMode: 'smart_fit' as const,
  },
  {
    label: 'ساندوتشات الحرم 🥪',
    url: '/images/hero_campus_sandwich.jpg',
    title: 'ساندوتشك المفضل في ثواني',
    badge: 'طازج وسريع ⚡',
    layoutMode: 'smart_fit' as const,
  },
  {
    label: 'دوري FastOrder 🏆',
    url: '/images/fastorder_league_banner.png',
    title: 'تنافس واكسب نقاط وجوائز',
    badge: 'الموسم الأول 2026 🏅',
    layoutMode: 'banner' as const,
  },
];

const PRESET_URLS = [
  { label: 'تصفح كل الأكشاك', url: '/student/kiosks' },
  { label: 'دوري FastOrder', url: '/student/league' },
  { label: 'سجل الطلبات', url: '/student/orders' },
  { label: 'الرئيسية', url: '/student' },
];

export const AppPromptManager: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [isEnabled, setIsEnabled] = useState(true);
  const [mode, setMode] = useState<'auto' | 'custom'>('custom');
  const [title, setTitle] = useState('جدد طاقتك الجامعية');
  const [message, setMessage] = useState('يومك طويل في الكلية؟ اطلب مشروبك المفضل أو سناك خفيف بضغطة واحدة.');
  const [subtext, setSubtext] = useState('استلم بالرقم من الكشك مباشرة وادفع كاش أو بمحفظتك الإلكترونية.');
  const [icon, setIcon] = useState('zap');
  const [imageUrl, setImageUrl] = useState<string | null>('/images/festival_land_falafel_story.jpg');
  const [badgeText, setBadgeText] = useState<string>('Festival Land 🔥');
  const [layoutMode, setLayoutMode] = useState<'smart_fit' | 'full_poster' | 'banner'>('full_poster');
  const [actionText, setActionText] = useState('تصفح الأكشاك واطلب الآن');
  const [actionUrl, setActionUrl] = useState('/student/kiosks');
  const [durationSeconds, setDurationSeconds] = useState(10);
  const [frequencyHours, setFrequencyHours] = useState(4);

  // Load Prompt Config from Server
  useEffect(() => {
    let isMounted = true;
    async function loadConfig() {
      try {
        setIsLoading(true);
        const res = await apiClient.get<any>('/admin/marketing/prompt');
        const data = res?.data ?? res;
        if (data && isMounted) {
          setIsEnabled(data.isEnabled !== undefined ? Boolean(data.isEnabled) : true);
          setMode(data.mode === 'auto' ? 'auto' : 'custom');
          if (data.title) setTitle(data.title);
          if (data.message) setMessage(data.message);
          if (data.subtext) setSubtext(data.subtext);
          if (data.icon) setIcon(data.icon);
          setImageUrl(data.imageUrl || null);
          setBadgeText(data.badgeText || 'عرض خاص');
          if (data.layoutMode) setLayoutMode(data.layoutMode);
          if (data.actionText) setActionText(data.actionText);
          if (data.actionUrl) setActionUrl(data.actionUrl);
          if (data.durationSeconds) setDurationSeconds(Number(data.durationSeconds));
          if (data.frequencyHours !== undefined) setFrequencyHours(Number(data.frequencyHours));
        }
      } catch (err) {
        console.warn('[AppPromptManager] Failed loading prompt config:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-detect portrait flyers when imageUrl changes
  useEffect(() => {
    if (!imageUrl) return;
    const testImg = new window.Image();
    testImg.src = imageUrl;
    testImg.onload = () => {
      if (testImg.naturalHeight > testImg.naturalWidth * 1.15) {
        setLayoutMode((prev) => (prev === 'banner' ? 'full_poster' : prev));
      }
    };
  }, [imageUrl]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setFeedback(null);

      const payload = {
        isEnabled,
        mode,
        title,
        message,
        subtext,
        icon,
        imageUrl: imageUrl || null,
        badgeText: badgeText || null,
        layoutMode,
        actionText,
        actionUrl,
        durationSeconds: Number(durationSeconds),
        frequencyHours: Number(frequencyHours),
      };

      await apiClient.put('/admin/marketing/prompt', payload);

      setFeedback({
        type: 'success',
        message: 'تم حفظ إعدادات الإعلان المنبثق وتحديث صورته ونمط عرضه بنجاح!',
      });

      // Clear feedback after 4 seconds
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      console.error('[AppPromptManager] Failed saving prompt config:', err);
      setFeedback({
        type: 'error',
        message: 'حدث خطأ أثناء حفظ الإعدادات، يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setIsEnabled(true);
    setMode('custom');
    setTitle('جدد طاقتك الجامعية');
    setMessage('يومك طويل في الكلية؟ اطلب مشروبك المفضل أو سناك خفيف بضغطة واحدة.');
    setSubtext('استلم بالرقم من الكشك مباشرة وادفع كاش أو بمحفظتك الإلكترونية.');
    setIcon('zap');
    setImageUrl('/images/banner_burger_combo.jpg');
    setBadgeText('عرض خاص 🔥');
    setActionText('تصفح الأكشاك واطلب الآن');
    setActionUrl('/student/kiosks');
    setDurationSeconds(10);
    setFrequencyHours(4);
  };

  const selectedIconMeta = AVAILABLE_ICONS.find((i) => i.id === icon) || AVAILABLE_ICONS[0];
  const IconComponent = selectedIconMeta.icon;

  if (isLoading) {
    return (
      <Card className="p-8 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-body text-ink-soft">جاري تحميل إعدادات الإعلان المنبثق...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <Card className="p-5 sm:p-6 border-line/80 shadow-warm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-primary/20 text-primary-ink flex items-center justify-center font-bold">
                <ImageIcon className="w-5 h-5" />
              </span>
              <h3 className="font-display font-bold text-lg text-ink">
                إدارة بوستر وإعلان التطبيق المنبثق (In-App Promo Poster)
              </h3>
            </div>
            <p className="font-body text-xs text-ink-soft mt-1 leading-relaxed">
              تحكم كامل في مظهر الإعلان المنبثق، رفع صور البانر الترويجي، النصوص، والروابط التي تظهر للطلاب.
            </p>
          </div>

          {/* Master Enable/Disable Toggle */}
          <div className="flex items-center gap-3 bg-canvas border border-line p-2 sm:p-2.5 rounded-2xl self-start md:self-auto">
            <span className="text-xs font-bold text-ink">
              حالة الإعلان:
            </span>
            <button
              type="button"
              onClick={() => setIsEnabled(!isEnabled)}
              className={`relative inline-flex h-7 w-13 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                isEnabled ? 'bg-accent' : 'bg-line'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                  isEnabled ? '-translate-x-7' : '-translate-x-1'
                }`}
              />
            </button>
            <span className={`text-xs font-bold ${isEnabled ? 'text-accent' : 'text-ink-soft'}`}>
              {isEnabled ? 'مفعل ويظهر للطلاب' : 'معطل مؤقتاً'}
            </span>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mt-4 p-3.5 rounded-xl border flex items-center gap-2 text-xs font-body ${
              feedback.type === 'success'
                ? 'bg-accent-soft text-accent border-accent/30'
                : 'bg-danger-soft text-danger border-danger/30'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </Card>

      {/* Main Grid: Controls (7 Cols) & Live Phone Preview (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Controls */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 1: Media & Image Upload */}
          <Card className="p-5 sm:p-6 space-y-4 border-line/80 shadow-warm">
            <div className="flex items-center justify-between pb-3 border-b border-line/60">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" />
                <h4 className="font-display font-bold text-sm text-ink">
                  صورة الإعلان الترويجي (Banner Poster)
                </h4>
              </div>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="text-xs text-danger hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>إزالة الصورة</span>
                </button>
              )}
            </div>

            {/* Direct Upload Dropzone */}
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                ارفع صورة البانر من جهازك:
              </label>
              <ImageUploadDropzone
                value={imageUrl || ''}
                onChange={(url) => setImageUrl(url)}
                onClear={() => setImageUrl(null)}
              />
              <span className="text-[11px] text-ink-soft mt-1.5 block leading-relaxed">
                يدعم أي أبعاد صور يرسلها المطعم (بوسترات رأسية، ستوري، أو بانرات أفقية). يمكنك استخدام الصورة بحجمها الأصلي أو قصها بحرية.
              </span>
            </div>

            {/* Preset Banner Quick Select */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-ink mb-2">
                أو اختر صورة جاهزة من مكتبة التطبيق:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESET_BANNERS.map((preset) => {
                  const isSelected = imageUrl === preset.url;
                  return (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => {
                        setImageUrl(preset.url);
                        if (preset.title && !title) setTitle(preset.title);
                        if (preset.badge) setBadgeText(preset.badge);
                        if (preset.layoutMode) setLayoutMode(preset.layoutMode);
                      }}
                      className={`group relative rounded-xl overflow-hidden border p-1 text-right transition-all flex flex-col items-center ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/40 bg-primary-soft/50 shadow-xs'
                          : 'border-line hover:border-line/90 bg-surface'
                      }`}
                    >
                      <div className="w-full h-16 rounded-lg overflow-hidden relative bg-canvas mb-1.5">
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-ink truncate w-full text-center">
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Display Layout Mode Selector */}
            <div className="pt-3 border-t border-line/60 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-ink">
                  نمط عرض الإعلان والصورة (Display Style):
                </label>
                <span className="text-[10px] text-accent font-bold bg-accent-soft px-2 py-0.5 rounded-md">
                  حل مشكلة أحجام وبوسترات المطاعم ✨
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. Full Story Flyer */}
                <button
                  type="button"
                  onClick={() => setLayoutMode('full_poster')}
                  className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                    layoutMode === 'full_poster'
                      ? 'border-primary ring-2 ring-primary/40 bg-primary-soft/50 shadow-xs'
                      : 'border-line hover:border-line/90 bg-canvas'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                        📱 بوستر ستوري كامل
                      </span>
                      {layoutMode === 'full_poster' && <Check className="w-3.5 h-3.5 text-primary" />}
                    </div>
                    <p className="text-[10px] text-ink-soft leading-relaxed">
                      الأفضل لبوسترات وعروض المطاعم الرأسية (مثل Festival Land). تظهر الصورة كاملة بالطول 100% بدون أي قص مع أزرار عائمة أنيقة.
                    </p>
                  </div>
                </button>

                {/* 2. Smart Contain & Glow */}
                <button
                  type="button"
                  onClick={() => setLayoutMode('smart_fit')}
                  className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                    layoutMode === 'smart_fit'
                      ? 'border-primary ring-2 ring-primary/40 bg-primary-soft/50 shadow-xs'
                      : 'border-line hover:border-line/90 bg-canvas'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                        ✨ احتواء ذكي بدون قص
                      </span>
                      {layoutMode === 'smart_fit' && <Check className="w-3.5 h-3.5 text-primary" />}
                    </div>
                    <p className="text-[10px] text-ink-soft leading-relaxed">
                      يحتوي أي صورة بأي أبعاد غريبة بدون أي اقتصاص، مع خلفية ضبابية متوافقة لونيًا والنصوص بالأسفل.
                    </p>
                  </div>
                </button>

                {/* 3. Landscape Banner */}
                <button
                  type="button"
                  onClick={() => setLayoutMode('banner')}
                  className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                    layoutMode === 'banner'
                      ? 'border-primary ring-2 ring-primary/40 bg-primary-soft/50 shadow-xs'
                      : 'border-line hover:border-line/90 bg-canvas'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                        🖼️ بانر كلاسيكي (16:9)
                      </span>
                      {layoutMode === 'banner' && <Check className="w-3.5 h-3.5 text-primary" />}
                    </div>
                    <p className="text-[10px] text-ink-soft leading-relaxed">
                      بانر أفقي عريض مناسب للصور المصممة خصيصاً بنسبة 16:9 مع كارت المحتوى بالأسفل.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Badge Text Input */}
            <div className="pt-2 border-t border-line/60">
              <label className="block text-xs font-bold text-ink mb-1.5">
                شارة مميزة فوق الصورة (Badge Pill):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="مثال: عرض محدود 🔥 أو خصم 20% ✨"
                  className="flex-1 bg-canvas border border-line rounded-xl px-3.5 py-2 text-xs font-bold text-ink focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setBadgeText('عرض خاص 🔥')}
                  className="text-[11px] font-bold text-ink-soft bg-canvas border border-line px-2.5 py-2 rounded-xl hover:text-ink"
                >
                  افتراضي
                </button>
              </div>
            </div>
          </Card>

          {/* Section 2: Texts & Content */}
          <Card className="p-5 sm:p-6 space-y-4 border-line/80 shadow-warm">
            <div className="flex items-center gap-2 pb-3 border-b border-line/60">
              <Layers className="w-4 h-4 text-primary" />
              <h4 className="font-display font-bold text-sm text-ink">
                نصوص الإعلان وزر الإجراء
              </h4>
            </div>

            {/* Mode selection */}
            <div>
              <label className="block text-xs font-bold text-ink mb-2">
                وضع المحتوى:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setMode('custom')}
                  className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between ${
                    mode === 'custom'
                      ? 'border-primary bg-primary-soft/60 shadow-xs'
                      : 'border-line hover:border-line/90 bg-surface'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-ink block">محتوى مخصص</span>
                    <span className="text-[11px] text-ink-soft">أكتب العنوان والرسالة بنفسي</span>
                  </div>
                  {mode === 'custom' && <Check className="w-4 h-4 text-primary" />}
                </button>

                <button
                  type="button"
                  onClick={() => setMode('auto')}
                  className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between ${
                    mode === 'auto'
                      ? 'border-primary bg-primary-soft/60 shadow-xs'
                      : 'border-line hover:border-line/90 bg-surface'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-ink block">تلقائي حسب الوقت</span>
                    <span className="text-[11px] text-ink-soft">فطار وقهوة صباحاً، وجبات وسناكس</span>
                  </div>
                  {mode === 'auto' && <Check className="w-4 h-4 text-primary" />}
                </button>
              </div>
            </div>

            {mode === 'custom' ? (
              <div className="space-y-3.5 pt-2">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">
                    عنوان الإعلان الرئيسي:
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: جدد طاقتك الجامعية"
                    className="w-full bg-canvas border border-line rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-ink focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">
                    نص الإعلان والرسالة الترويجية:
                  </label>
                  <textarea
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="اكتب هنا الرسالة التشجيعية للطلب..."
                    className="w-full bg-canvas border border-line rounded-xl px-3.5 py-2 text-xs sm:text-sm text-ink focus:outline-none focus:border-primary resize-none leading-relaxed"
                  />
                </div>

                {/* Subtext */}
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">
                    نص توضيحي إضافي (اختياري):
                  </label>
                  <input
                    type="text"
                    value={subtext}
                    onChange={(e) => setSubtext(e.target.value)}
                    placeholder="استلم بالرقم من الكشك مباشرة وادفع كاش أو بمحفظتك."
                    className="w-full bg-canvas border border-line rounded-xl px-3.5 py-2 text-xs text-ink-soft focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Button & Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1.5">
                      نص الزر:
                    </label>
                    <input
                      type="text"
                      value={actionText}
                      onChange={(e) => setActionText(e.target.value)}
                      placeholder="تصفح الأكشاك واطلب الآن"
                      className="w-full bg-canvas border border-line rounded-xl px-3.5 py-2 text-xs font-bold text-ink focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink mb-1.5">
                      رابط التوجيه:
                    </label>
                    <input
                      type="text"
                      value={actionUrl}
                      onChange={(e) => setActionUrl(e.target.value)}
                      placeholder="/student/kiosks"
                      className="w-full bg-canvas border border-line rounded-xl px-3.5 py-2 text-xs text-ink focus:outline-none focus:border-primary font-mono"
                    />
                  </div>
                </div>

                {/* Quick links */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-ink-soft">روابط سريعة:</span>
                  {PRESET_URLS.map((p) => (
                    <button
                      key={p.url}
                      type="button"
                      onClick={() => setActionUrl(p.url)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                        actionUrl === p.url
                          ? 'bg-primary-soft text-primary font-bold border-primary/40'
                          : 'bg-canvas text-ink-soft hover:text-ink border-line'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-canvas rounded-2xl border border-line text-xs font-body text-ink space-y-1">
                <span className="font-bold text-primary block">الوضع التلقائي يعمل بذكاء:</span>
                <p className="text-[11px] text-ink-soft">
                  يعرض تلقائياً محتوى صباحي أو مسائي مع إمكانية استخدام صورة البانر المختارة بالأعلى لظهور احترافي.
                </p>
              </div>
            )}
          </Card>

          {/* Section 3: Timing & Frequency */}
          <Card className="p-5 sm:p-6 space-y-4 border-line/80 shadow-warm">
            <div className="flex items-center gap-2 pb-3 border-b border-line/60">
              <Clock className="w-4 h-4 text-primary" />
              <h4 className="font-display font-bold text-sm text-ink">
                إعدادات المؤقت ومعدل الظهور
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  مدة العد التنازلي التلقائي:
                </label>
                <select
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(Number(e.target.value))}
                  className="w-full bg-canvas border border-line rounded-xl px-3 py-2 text-xs font-bold text-ink focus:outline-none focus:border-primary"
                >
                  <option value={5}>5 ثوانٍ (سريع)</option>
                  <option value={10}>10 ثوانٍ (كما في صورتك)</option>
                  <option value={15}>15 ثانية (متوازن)</option>
                  <option value={20}>20 ثانية</option>
                  <option value={30}>30 ثانية</option>
                </select>
                <span className="text-[10px] text-ink-soft mt-1 block">
                  يختفي الإعلان تلقائياً عند انتهاء المؤقت.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  معدل تكرار الظهور للطالب:
                </label>
                <select
                  value={frequencyHours}
                  onChange={(e) => setFrequencyHours(Number(e.target.value))}
                  className="w-full bg-canvas border border-line rounded-xl px-3 py-2 text-xs font-bold text-ink focus:outline-none focus:border-primary"
                >
                  <option value={0}>في كل زيارة (للاختبار)</option>
                  <option value={1}>مرة كل ساعة</option>
                  <option value={2}>مرة كل ساعتين</option>
                  <option value={4}>مرة كل 4 ساعات (موصى به)</option>
                  <option value={24}>مرة واحدة يومياً</option>
                </select>
                <span className="text-[10px] text-ink-soft mt-1 block">
                  يمنع تكرار الإزعاج لنفس الطالب.
                </span>
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="pt-4 border-t border-line/60 flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetDefaults}
                className="text-xs text-ink-soft hover:text-ink flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>استعادة الافتراضي</span>
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handleSave}
                disabled={isSaving}
                className="text-xs sm:text-sm font-bold shadow-warm flex items-center gap-2 px-6"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-ink border-t-transparent rounded-full animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>حفظ التعديلات وتطبيقها</span>
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Live Phone Mockup Preview */}
        <div className="lg:col-span-5 sticky top-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-primary" />
              <span>معاينة حية لشاشة الطالب</span>
            </span>
            <span className="text-[10px] font-bold text-accent bg-accent-soft px-2.5 py-0.5 rounded-full">
              تحديث فوري مع صورتك
            </span>
          </div>

          {/* Phone Frame Simulator */}
          <div className="relative rounded-[36px] border-4 border-neutral-800 bg-neutral-900 p-3 shadow-floating max-w-sm mx-auto">
            {/* Phone Top Notch Bar */}
            <div className="w-24 h-4 bg-neutral-800 rounded-full mx-auto mb-3" />

            {/* Simulated Student Home Page with Pop-up */}
            <div className="relative bg-surface rounded-[24px] overflow-hidden min-h-[500px] flex items-center justify-center p-3">
              {/* Blurred background student app items */}
              <div className="absolute inset-0 p-4 space-y-3 opacity-25 select-none pointer-events-none">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-full bg-line/80" />
                  <div className="w-24 h-6 rounded-lg bg-line/80" />
                </div>
                <div className="h-20 bg-line/50 rounded-2xl" />
                <div className="h-24 bg-line/40 rounded-2xl" />
                <div className="h-28 bg-line/30 rounded-2xl" />
              </div>

              {/* The Actual In-App Promo Modal Replica */}
              {layoutMode === 'full_poster' && imageUrl ? (
                /* 1. Full Story Poster Style Replica (for Festival Land and vertical flyers) */
                <div className="relative z-10 w-full max-w-[275px] bg-stone-950 border border-white/20 rounded-[28px] shadow-floating overflow-hidden text-right flex flex-col animate-in zoom-in-95 duration-200">
                  {/* Poster Image Stage */}
                  <div className="relative w-full h-[360px] bg-black overflow-hidden flex items-center justify-center">
                    {/* Ambient Glow */}
                    <img
                      src={imageUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125 pointer-events-none"
                    />
                    {/* Full uncropped poster */}
                    <img
                      src={imageUrl}
                      alt={title}
                      className="relative z-10 w-full h-full object-contain"
                    />

                    {/* Floating Top Controls */}
                    <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-20">
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold shadow-sm">
                        <Clock className="w-3 h-3 text-primary" />
                        <span>يختفي خلال {durationSeconds}ث</span>
                      </div>

                      <div className="w-6 h-6 rounded-full bg-black/60 text-white backdrop-blur-md flex items-center justify-center text-xs border border-white/20">
                        <X className="w-3 h-3" />
                      </div>
                    </div>

                    {/* Floating Badge */}
                    {badgeText && (
                      <div className="absolute top-10 right-2.5 z-20">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary text-primary-ink font-body text-[10px] font-black shadow-md border border-white/30">
                          <Tag className="w-2.5 h-2.5" />
                          <span>{badgeText}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Sleek Floating Bottom CTA Bar */}
                  <div className="p-3 bg-stone-900/95 backdrop-blur-md border-t border-white/10 space-y-2 z-20">
                    <div>
                      <h4 className="font-display font-black text-white text-xs sm:text-sm leading-snug line-clamp-1">
                        {mode === 'custom' ? title || 'جديد طعمية سوري' : 'جديد طعمية سوري بـ 25 ج.م'}
                      </h4>
                      <p className="font-body text-[10px] text-stone-300 line-clamp-1">
                        {mode === 'custom' ? message || 'طعم أصيل بمذاق سوري' : 'طعم أصيل بمذاق سوري ♡'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 py-2 px-3 rounded-xl bg-primary text-primary-ink font-display font-bold text-xs shadow-warm flex items-center justify-center gap-1.5 text-center cursor-pointer">
                        <span>{mode === 'custom' ? actionText || 'اطلب الآن' : 'تصفح الأكشاك واطلب الآن'}</span>
                        <ArrowLeft className="w-3 h-3" />
                      </div>
                      <div className="py-2 px-2.5 rounded-xl bg-white/10 text-stone-300 font-body text-[11px] text-center cursor-pointer">
                        لاحقاً
                      </div>
                    </div>
                  </div>

                  {/* Progress bar simulation */}
                  <div className="h-[3px] bg-white/10 w-full overflow-hidden">
                    <div className="h-full bg-primary w-3/4" />
                  </div>
                </div>
              ) : (
                /* 2. Card Modal Replica (Smart Fit or Banner or Text-only) */
                <div className="relative z-10 w-full bg-surface border border-line rounded-[26px] shadow-floating overflow-hidden text-right animate-in zoom-in-95 duration-200">
                  {/* Header Media: Image Poster or Icon Banner */}
                  {imageUrl ? (
                    <div className="relative w-full h-40 sm:h-44 bg-stone-950 overflow-hidden flex items-center justify-center">
                      {/* Ambient Glow */}
                      <img
                        src={imageUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-35 scale-125 pointer-events-none"
                      />
                      <img
                        src={imageUrl}
                        alt={title}
                        className={`relative z-10 w-full h-full ${
                          layoutMode === 'smart_fit' ? 'object-contain' : 'object-cover'
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-black/40 pointer-events-none" />

                      {/* Top Controls on Image */}
                      <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10">
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold shadow-sm">
                          <Clock className="w-3 h-3 text-primary" />
                          <span>يختفي خلال {durationSeconds}ث</span>
                        </div>

                        <div className="w-6 h-6 rounded-full bg-black/60 text-white backdrop-blur-md flex items-center justify-center text-xs border border-white/20">
                          <X className="w-3 h-3" />
                        </div>
                      </div>

                      {/* Badge Pill on Image */}
                      {badgeText && (
                        <div className="absolute bottom-2.5 right-2.5 z-10">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary text-primary-ink font-body text-[10px] font-black shadow-md border border-white/30">
                            <Tag className="w-2.5 h-2.5" />
                            <span>{badgeText}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 pb-0 flex items-center justify-between">
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-canvas border border-line text-[10px] font-mono font-bold text-ink-soft">
                        <Clock className="w-3 h-3 text-primary" />
                        <span>يختفي خلال {durationSeconds}ث</span>
                      </div>

                      <div className="w-6 h-6 rounded-full bg-canvas text-ink-soft flex items-center justify-center text-xs">
                        <X className="w-3 h-3" />
                      </div>
                    </div>
                  )}

                  {/* Content Body */}
                  <div className={`p-4 sm:p-5 ${imageUrl ? 'pt-3' : 'pt-2'} space-y-2.5`}>
                    <h4 className="font-display font-black text-base sm:text-lg text-ink leading-snug">
                      {mode === 'custom' ? title || 'عنوان الإعلان' : 'جدد طاقتك الجامعية'}
                    </h4>

                    <p className="font-body text-xs font-semibold text-ink leading-relaxed line-clamp-2">
                      {mode === 'custom' ? message || 'نص الإعلان الرئيسي...' : 'يومك طويل في الكلية؟ اطلب مشروبك المفضل أو سناك خفيف بضغطة واحدة.'}
                    </p>

                    <p className="font-body text-[11px] text-ink-soft leading-relaxed line-clamp-2">
                      {mode === 'custom' ? subtext || 'النص التوضيحي...' : 'استلم بالرقم من الكشك مباشرة وادفع كاش أو بمحفظتك الإلكترونية.'}
                    </p>

                    {/* Buttons */}
                    <div className="mt-3.5 pt-3 border-t border-line/60 flex items-center gap-2">
                      <div className="flex-1 py-2.5 px-3 rounded-xl bg-primary text-primary-ink font-display font-bold text-xs shadow-warm flex items-center justify-center gap-1.5 text-center cursor-pointer">
                        <span>{mode === 'custom' ? actionText || 'اطلب الآن' : 'تصفح الأكشاك واطلب الآن'}</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </div>

                      <div className="py-2.5 px-3 rounded-xl bg-canvas text-ink-soft font-body font-semibold text-xs text-center cursor-pointer">
                        لاحقاً
                      </div>
                    </div>
                  </div>

                  {/* Progress bar simulation */}
                  <div className="h-[3px] bg-line/30 w-full overflow-hidden">
                    <div className="h-full bg-primary w-3/4" />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Home Indicator */}
            <div className="w-28 h-1 bg-neutral-700 rounded-full mx-auto mt-3" />
          </div>
        </div>
      </div>
    </div>
  );
};

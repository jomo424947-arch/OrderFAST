'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/branding/Logo';
import { Button } from '@/components/ui/Button';
import {
  Download,
  Smartphone,
  ShieldCheck,
  Zap,
  Bell,
  Clock,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  Copy,
  Check,
  Share2,
  ExternalLink,
  QrCode,
  ArrowLeft,
  Sparkles,
  Layers,
  AlertCircle,
} from 'lucide-react';

const APK_DOWNLOAD_URL = '/downloads/FastOrder.apk';
const APP_VERSION = 'v1.0.0 (Stable)';
const APP_SIZE = '4.7 ميجابايت';
const MIN_ANDROID = 'Android 8.0 فما فوق';

export default function DownloadPage() {
  const [copied, setCopied] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadClick = () => {
    setDownloadStarted(true);
  };

  const faqs = [
    {
      q: 'هل تحميل وتثبيت ملف APK آمن على هاتفي؟',
      a: 'نعم، بكل تأكيد! الملف تم بناؤه وتوقيعه رقمياً من الفريق الرسمي لـ FastOrder، وهو نظيف وخالٍ تماماً من أي برمجيات خبيثة أو إعلانات مزعجة. التحميل المباشر هو الطريقة الرسمية المعتمدة لحين اعتماد التطبيق على متجر Google Play.',
    },
    {
      q: 'لماذا يظهر لي تحذير "قد يكون هذا الملف ضاراً" عند التنزيل؟',
      a: 'هذا تحذير روتيني من نظام أندرويد يظهر عند تحميل أي تطبيق (APK) من خارج متجر جوجل بلاي. يمكنك الضغط بأمان على "التنزيل على أي حال" (Download anyway) ثم المتابعة.',
    },
    {
      q: 'كيف أسمح بالتثبيت من مصادر غير معروفة (Install unknown apps)؟',
      a: 'عند فتح ملف APK لأول مرة، قد يطلب منك هاتفك إذناً للمتصفح (مثل Chrome). اضغط على "الإعدادات" في الرسالة التي تظهر، ثم فعّل خيار "السماح من هذا المصدر"، ثم ارجع واضغط على "تثبيت".',
    },
    {
      q: 'هل أحتاج لإنشاء حساب جديد إذا كنت أستخدم الموقع بالفعل؟',
      a: 'لا، يمكنك استخدام نفس البريد الإلكتروني وكلمة المرور الخاصة بك على الموقع لتسجيل الدخول في التطبيق، وستجد كل طلباتك وسجلك محفوظاً كما هو.',
    },
    {
      q: 'متى سيتوفر التطبيق على متجر Google Play؟',
      a: 'ملفات التطبيق حالياً في مرحلة المراجعة والاعتماد النهائية لدى شركة Google، وسيتوفر على المتجر قريباً جداً. تحميل نسخة الـ APK الحالية يمنحك نفس التجربة الكاملة والتحديثات أولاً بأول.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink font-body selection:bg-primary-soft selection:text-primary-ink">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-line/70 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo variant="full" />
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-ink-soft hover:text-ink hover:bg-canvas transition-colors"
            >
              <span>فتح نسخة الويب</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <a
              href={APK_DOWNLOAD_URL}
              download="FastOrder.apk"
              onClick={handleDownloadClick}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-ink font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-warm transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>تحميل APK</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24 px-4 sm:px-6">
          {/* Subtle Ambient Glows */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
            {/* Badge Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-soft text-primary-ink text-xs font-bold mb-6 border border-primary/25 shadow-xs animate-in fade-in slide-in-from-top-3 duration-300">
              <Sparkles className="w-3.5 h-3.5 fill-primary text-primary" />
              <span>النسخة الرسمية للأندرويد • تحميل مباشر وسريع</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-display font-black text-3xl sm:text-5xl md:text-6xl text-ink leading-tight sm:leading-snug max-w-4xl mb-6">
              حمّل تطبيق <span className="text-primary">FastOrder</span> على هاتفك واطلب بدون أي طوابير
            </h1>

            {/* Subtitle */}
            <p className="font-body text-sm sm:text-lg text-ink-soft max-w-2xl leading-relaxed mb-8">
              استمتع بأسرع تجربة لطلب وتتبع وجبات ومشروبات أكشاك جامعتك. إشعارات فورية، تتبع دورك لحظة بلحظة، وحجم خفيف جداً يقل عن 5 ميجابايت!
            </p>

            {/* Main Download Card */}
            <div className="w-full max-w-xl bg-surface border-2 border-primary/30 rounded-3xl p-6 sm:p-8 shadow-ticket relative overflow-hidden mb-12 text-right">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* App Icon Visual */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#241F1A] p-2 flex-shrink-0 shadow-warm flex items-center justify-center border border-line/40">
                  <Image
                    src="/images/fastorder_app_icon.png"
                    alt="FastOrder Icon"
                    width={88}
                    height={88}
                    className="rounded-2xl"
                    priority
                  />
                </div>

                {/* App Meta Info */}
                <div className="flex-1 text-center sm:text-right">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <h2 className="font-display font-black text-xl sm:text-2xl text-ink">
                      FastOrder Android
                    </h2>
                    <span className="bg-accent-soft text-accent text-[11px] font-bold px-2 py-0.5 rounded-md">
                      رسمي
                    </span>
                  </div>

                  <p className="font-body text-xs text-ink-soft mb-3">
                    منصة طلب وتتبع أوردرات أكشاك الحرم الجامعي
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] font-mono text-ink-soft">
                    <span className="bg-canvas px-2.5 py-1 rounded-lg border border-line/50">
                      الحجم: <strong className="text-ink">{APP_SIZE}</strong>
                    </span>
                    <span className="bg-canvas px-2.5 py-1 rounded-lg border border-line/50">
                      الإصدار: <strong className="text-ink">{APP_VERSION}</strong>
                    </span>
                    <span className="bg-canvas px-2.5 py-1 rounded-lg border border-line/50">
                      النظام: <strong className="text-ink">{MIN_ANDROID}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Big CTA Download Action */}
              <div className="mt-6 pt-6 border-t border-line/60 flex flex-col sm:flex-row items-center gap-3">
                <a
                  href={APK_DOWNLOAD_URL}
                  download="FastOrder.apk"
                  onClick={handleDownloadClick}
                  className="w-full sm:flex-1 bg-primary hover:bg-primary-hover text-primary-ink font-display font-bold text-base sm:text-lg py-4 px-6 rounded-2xl shadow-warm flex items-center justify-center gap-3 transition-all transform active:scale-95 group"
                >
                  <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                  <span>تنزيل تطبيق أندرويد (APK)</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-canvas border border-line hover:border-ink-soft text-ink font-semibold text-xs transition-colors"
                  title="نسخ رابط الصفحة"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-accent" />
                      <span className="text-accent">تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>مشاركة الرابط</span>
                    </>
                  )}
                </button>
              </div>

              {/* Security Guarantee Badge */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-accent font-semibold">
                <ShieldCheck className="w-4 h-4 text-accent" />
                <span>ملف آمن 100% • خفيف وسريع • تم التحقق والفحص من قِبل FastOrder</span>
              </div>
            </div>

            {/* Notification if download was clicked */}
            {downloadStarted && (
              <div className="w-full max-w-xl bg-accent-soft border border-accent/30 text-ink rounded-2xl p-4 mb-10 flex items-start gap-3 text-right animate-in fade-in slide-in-from-bottom-2 duration-300">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm leading-relaxed">
                  <p className="font-bold text-accent mb-0.5">بدأ تنزيل ملف التطبيق الآن!</p>
                  <p className="text-ink-soft">
                    بمجرد اكتمال التنزيل، اسحب شريط الإشعارات واضغط على ملف <code className="font-mono font-bold text-ink">FastOrder.apk</code> لتثبيته. راجع خطوات التثبيت بالأسفل إذا واجهت أي استفسار.
                  </p>
                </div>
              </div>
            )}

            {/* Google Play Status Banner */}
            <div className="w-full max-w-xl bg-surface border border-line rounded-2xl p-4 flex items-center gap-3.5 text-right mb-14 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary-ink flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-primary-ink" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs sm:text-sm text-ink mb-0.5">
                  قريباً على متجر Google Play
                </h4>
                <p className="text-[11px] sm:text-xs text-ink-soft leading-relaxed">
                  التطبيق قيد المراجعة النهائية لدى متجر جوجل بلاي. يمكنك تنزيل ملف الـ APK المباشر واستخدامه الآن بكامل مميزاته.
                </p>
              </div>
            </div>

            {/* QR Code Section for Desktop Visitors */}
            <div className="w-full max-w-xl bg-surface border border-line rounded-3xl p-6 sm:p-8 shadow-warm text-right mb-16 flex flex-col sm:flex-row items-center gap-6">
              <div className="w-40 h-40 bg-surface p-2 rounded-2xl border-2 border-line/80 shadow-xs flex-shrink-0 flex items-center justify-center">
                <Image
                  src="/images/download_qr.png"
                  alt="Download QR Code"
                  width={150}
                  height={150}
                  className="rounded-xl"
                />
              </div>

              <div className="flex-1 text-center sm:text-right">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-ink bg-primary-soft px-2.5 py-1 rounded-lg mb-2">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>تنزيل سريع بالموبايل</span>
                </div>
                <h3 className="font-display font-bold text-lg text-ink mb-2">
                  فاتح الموقع من الكمبيوتر؟
                </h3>
                <p className="font-body text-xs sm:text-sm text-ink-soft leading-relaxed mb-4">
                  وجّه كاميرا هاتفك المحمول نحو رمز الاستجابة السريعة (QR Code) لفتح هذه الصفحة على هاتفك وبدء التنزيل بلمسة واحدة.
                </p>
                <div className="text-[11px] font-mono text-ink-soft bg-canvas px-3 py-1.5 rounded-xl inline-block border border-line/50">
                  fast0rder.online/download
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="bg-surface border-y border-line py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold text-accent bg-accent-soft px-3 py-1 rounded-full inline-block mb-3">
                مميزات حصرية للتطبيق
              </span>
              <h2 className="font-display font-black text-2xl sm:text-4xl text-ink mb-3">
                لماذا تفضل استخدام تطبيق الهاتف؟
              </h2>
              <p className="font-body text-xs sm:text-sm text-ink-soft">
                صممنا تطبيق FastOrder ليكون رفيقك اليومي داخل الحرم الجامعي لتوفير كل دقيقة من وقتك
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-right">
              {/* Feature 1 */}
              <div className="bg-canvas rounded-2xl p-5 border border-line hover:border-primary/40 transition-all flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary-ink flex items-center justify-center mb-4">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-base text-ink mb-1.5">
                  إشعارات صوتية فورية
                </h3>
                <p className="font-body text-xs text-ink-soft leading-relaxed">
                  تنبيهات فورية بالاهتزاز والصوت عند قبول طلبك وتجهيزه للاستلام، حتى لو كان هاتفك مقفلاً.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-canvas rounded-2xl p-5 border border-line hover:border-primary/40 transition-all flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-base text-ink mb-1.5">
                  أداء فائق وخفة لا تُقارن
                </h3>
                <p className="font-body text-xs text-ink-soft leading-relaxed">
                  حجم التطبيق أقل من 5MB، يفتح في لمح البصر ولا يستهلك ذاكرة هاتفك أو بطاريته إطلاقاً.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-canvas rounded-2xl p-5 border border-line hover:border-primary/40 transition-all flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary-ink flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-base text-ink mb-1.5">
                  تتبع الطابور الحي
                </h3>
                <p className="font-body text-xs text-ink-soft leading-relaxed">
                  شاهد رقم طلبك والطلبات التي تسبقك والوقت المتوقع بدقة متناهية دون الوقوف في أي زحام.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-canvas rounded-2xl p-5 border border-line hover:border-primary/40 transition-all flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-base text-ink mb-1.5">
                  تجربة مصممة للهاتف
                </h3>
                <p className="font-body text-xs text-ink-soft leading-relaxed">
                  واجهة سلسة ومريحة للإبهام تدعم اللغة العربية بالكامل، مع حفظ تسجيل الدخول الدائم.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Step-by-Step Installation Guide */}
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold text-primary-ink bg-primary-soft px-3 py-1 rounded-full inline-block mb-3">
                دليل سريع
              </span>
              <h2 className="font-display font-black text-2xl sm:text-4xl text-ink mb-3">
                طريقة التثبيت في 4 خطوات بسيطة
              </h2>
              <p className="font-body text-xs sm:text-sm text-ink-soft">
                تثبيت ملفات APK سهل جداً ولا يستغرق سوى دقيقة واحدة على أي هاتف أندرويد
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-right">
              {/* Step 1 */}
              <div className="bg-surface rounded-3xl p-6 border border-line shadow-xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary text-primary-ink font-display font-black text-lg flex items-center justify-center flex-shrink-0 shadow-xs">
                  ١
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-base text-ink mb-1">
                    تنزيل ملف التطبيق
                  </h3>
                  <p className="font-body text-xs text-ink-soft leading-relaxed">
                    اضغط على زر <strong className="text-ink">"تنزيل تطبيق أندرويد (APK)"</strong> بالأعلى. إذا سألك المتصفح عن أمان التنزيل، اضغط <strong className="text-ink">"تنزيل على أي حال"</strong>.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-surface rounded-3xl p-6 border border-line shadow-xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary text-primary-ink font-display font-black text-lg flex items-center justify-center flex-shrink-0 shadow-xs">
                  ٢
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-base text-ink mb-1">
                    فتح الملف بعد اكتمال التنزيل
                  </h3>
                  <p className="font-body text-xs text-ink-soft leading-relaxed">
                    اسحب شريط الإشعارات واضغط على إشعار اكتمال تنزيل <strong className="text-ink">FastOrder.apk</strong>، أو افتحه من تطبيق "الملفات" في مجلد التنزيلات (Downloads).
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-surface rounded-3xl p-6 border border-line shadow-xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary text-primary-ink font-display font-black text-lg flex items-center justify-center flex-shrink-0 shadow-xs">
                  ٣
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-base text-ink mb-1">
                    تفعيل التثبيت من هذا المصدر
                  </h3>
                  <p className="font-body text-xs text-ink-soft leading-relaxed">
                    إذا ظهرت لك رسالة أمان، اضغط على <strong className="text-ink">"الإعدادات"</strong> ثم فعّل زر <strong className="text-ink">"السماح بالتثبيت من هذا المصدر"</strong> لمتصفحك، ثم ارجع خطوة للخلف.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-surface rounded-3xl p-6 border border-line shadow-xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-accent text-white font-display font-black text-lg flex items-center justify-center flex-shrink-0 shadow-xs">
                  ٤
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-base text-ink mb-1">
                    الضغط على تثبيت والبدء
                  </h3>
                  <p className="font-body text-xs text-ink-soft leading-relaxed">
                    اضغط على <strong className="text-ink">"تثبيت" (Install)</strong>، وخلال ثوانٍ معدودة اضغط <strong className="text-ink">"فتح" (Open)</strong> وسجل دخولك وابدأ طلبك الأول!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Visual App Graphic Showcase */}
        <section className="bg-surface border-t border-line py-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
            <div className="w-full max-w-3xl rounded-3xl overflow-hidden border-2 border-line/80 shadow-ticket bg-canvas">
              <Image
                src="/images/fastorder_app_banner.png"
                alt="FastOrder Campus Ordering Experience"
                width={1024}
                height={500}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-xs font-bold text-ink-soft bg-canvas border border-line/60 px-3 py-1 rounded-full inline-block mb-3">
                الأسئلة الشائعة
              </span>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-ink">
                إجابات على أهم الاستفسارات
              </h2>
            </div>

            <div className="space-y-3 text-right">
              {faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div
                    key={idx}
                    className="bg-surface border border-line rounded-2xl overflow-hidden transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-right hover:bg-canvas/50 transition-colors"
                    >
                      <span className="font-display font-bold text-xs sm:text-sm text-ink">
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-ink-soft transition-transform duration-200 flex-shrink-0 ${
                          isOpen ? 'rotate-180 text-primary' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-5 sm:px-5 pt-0 text-xs sm:text-sm text-ink-soft leading-relaxed border-t border-line/40">
                        <p className="mt-3">{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="bg-gradient-to-b from-surface to-canvas border-t border-line py-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display font-black text-2xl sm:text-4xl text-ink mb-4">
              جاهز توفر وقتك وتطلب بذكاء؟
            </h2>
            <p className="font-body text-xs sm:text-base text-ink-soft max-w-xl mx-auto mb-8">
              حمّل التطبيق الآن واستمتع بمشروبك ووجبتك الساخنة بدون تضييع دقيقة واحدة من وقت المحاضرات.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
              <a
                href={APK_DOWNLOAD_URL}
                download="FastOrder.apk"
                onClick={handleDownloadClick}
                className="w-full bg-primary hover:bg-primary-hover text-primary-ink font-display font-bold text-base py-3.5 px-6 rounded-2xl shadow-warm flex items-center justify-center gap-2.5 transition-all active:scale-95"
              >
                <Download className="w-5 h-5" />
                <span>تحميل تطبيق APK ({APP_SIZE})</span>
              </a>

              <Link
                href="/auth/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-surface border border-line text-ink font-semibold text-xs hover:bg-canvas transition-colors"
              >
                <span>دخول نسخة الويب</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-line py-8 px-4 text-center text-xs font-body text-ink-soft">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo variant="compact" showTagline={false} />
            <span className="text-ink-soft">| النسخة الرسمية لتطبيق أندرويد</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link href="/terms" className="hover:text-ink transition-colors">
              الشروط والأحكام
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-ink transition-colors">
              سياسة الخصوصية
            </Link>
            <span>•</span>
            <a
              href="mailto:support@fast0rder.online"
              className="hover:text-ink transition-colors"
            >
              الدعم الفني
            </a>
          </div>

          <p className="font-mono text-[11px] opacity-70">
            © {new Date().getFullYear()} FastOrder — ORDER • WAIT • ENJOY
          </p>
        </div>
      </footer>
    </div>
  );
}

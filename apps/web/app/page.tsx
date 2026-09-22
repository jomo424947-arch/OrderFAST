'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/branding/Logo';
import { Button } from '@/components/ui/Button';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Zap,
  LogIn,
  UserPlus,
  Smartphone,
  Download,
  Store,
  Wallet,
  Coffee,
  Sparkles,
  ShieldCheck,
  Menu,
  X,
  Bell,
  Timer,
  UtensilsCrossed,
} from 'lucide-react';
import { AuthRedirectHandler } from '@/components/auth/AuthRedirectHandler';
import { StartupGateway } from '@/components/auth/StartupGateway';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ticketState, setTicketState] = useState<'preparing' | 'ready'>('preparing');

  const kiosks = [
    {
      name: 'كشك كلية الهندسة',
      location: 'الساحة المركزية - أمام مدرج 1',
      popular: 'سندوتشات كبدة وسجق · قهوة تركي · عصائر طبيعية',
      prepTime: '7-10 دقائق',
      status: 'مفتوح للطلب',
    },
    {
      name: 'كشك كلية التجارة',
      location: 'الممر الرئيسي - بجوار مبنى ج',
      popular: 'قهوة مختصة وإسبريسو · كرواسون وباتيه · مياه ومشروبات',
      prepTime: '5-8 دقائق',
      status: 'مفتوح للطلب',
    },
    {
      name: 'كشك مجمع الكليات الطبية',
      location: 'ساحة كلية الصيدلة والطب',
      popular: 'وجبات إفطار سريعة · شاي ومشروبات ساخنة · سناكس',
      prepTime: '6-9 دقائق',
      status: 'مفتوح للطلب',
    },
  ];

  return (
    <StartupGateway>
      <div className="min-h-screen flex flex-col bg-canvas text-ink selection:bg-primary-soft selection:text-primary-ink font-body">
        <AuthRedirectHandler />

        {/* Top Navbar */}
        <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-line/70">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Logo variant="compact" showTagline={false} />
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-ink-soft">
              <a href="#how-it-works" className="hover:text-primary transition-colors">
                كيف تعمل؟
              </a>
              <a href="#preview-ticket" className="hover:text-primary transition-colors">
                تذكرة الدور
              </a>
              <a href="#features" className="hover:text-primary transition-colors">
                المميزات
              </a>
              <a href="#kiosks" className="hover:text-primary transition-colors">
                الأكشاك
              </a>
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/download"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-primary-ink bg-primary-soft hover:bg-primary/20 transition-colors border border-primary/25 shadow-xs"
              >
                <Smartphone className="w-3.5 h-3.5 text-primary" />
                <span>التطبيق (APK)</span>
              </Link>

              <Link
                href="/auth/login"
                className="px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-ink hover:text-primary transition-colors"
              >
                تسجيل الدخول
              </Link>

              <Link href="/auth/register">
                <Button size="sm" variant="primary" className="shadow-warm font-bold text-xs sm:text-sm">
                  حساب جديد
                </Button>
              </Link>

              {/* Mobile menu toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-ink-soft hover:text-ink hover:bg-canvas transition-colors"
                aria-label="القائمة"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-surface border-b border-line px-4 py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <nav className="flex flex-col gap-2 text-sm font-bold text-ink-soft">
                <a
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl hover:bg-canvas hover:text-ink transition-colors"
                >
                  كيف تعمل المنصة؟
                </a>
                <a
                  href="#preview-ticket"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl hover:bg-canvas hover:text-ink transition-colors"
                >
                  تجربة تذكرة الدور الحية
                </a>
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl hover:bg-canvas hover:text-ink transition-colors"
                >
                  مميزات المنصة للطلاب
                </a>
                <a
                  href="#kiosks"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl hover:bg-canvas hover:text-ink transition-colors"
                >
                  أكشاك الحرم الجامعي
                </a>
              </nav>

              <div className="pt-2 border-t border-line/60 flex flex-col gap-2">
                <Link
                  href="/download"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-primary-soft text-primary-ink text-xs font-bold border border-primary/25"
                >
                  <Download className="w-4 h-4 text-primary" />
                  <span>تحميل تطبيق أندرويد (APK 4.7MB)</span>
                </Link>
              </div>
            </div>
          )}
        </header>

        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-8 pb-16 sm:pt-16 sm:pb-24 border-b border-line/60">
          {/* Ambient warm glow effects */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute top-10 right-10 w-64 h-64 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
              {/* Hero Right Column: Texts & Main Action */}
              <div className="lg:col-span-7 text-center lg:text-right flex flex-col items-center lg:items-start">
                {/* Badge pill */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface border border-line text-primary-ink text-xs font-body font-bold mb-6 shadow-warm animate-in fade-in duration-300">
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  <span className="text-primary font-black">FASTorder</span>
                  <span className="text-line">|</span>
                  <span>منصة طلبات أكشاك الحرم الجامعي الذكية ⚡</span>
                </div>

                {/* Hero Title */}
                <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-ink leading-[1.25] sm:leading-[1.2] mb-6">
                  اطلب من مكانك واعرف{' '}
                  <span
                    className="font-black"
                    style={{
                      background: 'linear-gradient(135deg, #FFA41C 0%, #E8992A 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    دورك في الطابور
                  </span>{' '}
                  قبل ما تنزل
                </h1>

                {/* Subtitle */}
                <p className="font-body text-sm sm:text-lg text-ink-soft max-w-xl leading-relaxed mb-8">
                  وداعاً للوقوف في طوابير الكشك بين المحاضرات! تصفح منيو كشك كليتك، اطلب قهوتك وسندوتشك وأنت لسه في المدرج، وروح استلم بالرقم وادفع على الجاهز وقت ما يجهز بس.
                </p>

                {/* Main Action CTAs */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full max-w-md mb-6">
                  <Link href="/auth/login" className="flex-1">
                    <Button
                      size="lg"
                      variant="primary"
                      className="w-full shadow-warm text-base font-bold py-3.5 flex items-center justify-center gap-2"
                    >
                      <LogIn className="w-5 h-5" />
                      <span>تسجيل الدخول</span>
                    </Button>
                  </Link>

                  <Link href="/auth/register" className="flex-1">
                    <Button
                      size="lg"
                      variant="ghost"
                      className="w-full bg-surface border border-line text-ink hover:bg-canvas text-base font-bold py-3.5 flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-5 h-5 text-accent" />
                      <span>إنشاء حساب جديد</span>
                    </Button>
                  </Link>
                </div>

                {/* Android App Direct Download Banner */}
                <Link
                  href="/download"
                  className="group inline-flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-surface/90 border border-line hover:border-primary/50 shadow-warm transition-all max-w-md w-full text-right"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Download className="w-5 h-5 text-primary-ink" />
                    </div>
                    <div>
                      <p className="font-bold text-xs sm:text-sm text-ink flex items-center gap-1.5">
                        <span>حمّل تطبيق أندرويد الرسمي (APK)</span>
                        <span className="text-[10px] bg-accent-soft text-accent px-1.5 py-0.2 rounded font-mono">v1.0</span>
                      </p>
                      <p className="text-[11px] text-ink-soft">تحميل مباشر وسريع • حجم خفيف 4.7MB • إشعارات فورية</p>
                    </div>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-ink-soft group-hover:-translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Hero Left Column: Interactive Live Ticket Preview */}
              <div className="lg:col-span-5 flex flex-col items-center" id="preview-ticket">
                <div className="w-full max-w-sm bg-surface border border-line/90 rounded-3xl p-5 sm:p-6 shadow-ticket relative overflow-hidden">
                  {/* Decorative background glow */}
                  <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none" />

                  {/* Header of Ticket */}
                  <div className="flex items-center justify-between text-xs mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary-soft flex items-center justify-center">
                        <Store className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-ink text-xs">كشك كلية الهندسة</p>
                        <p className="text-[10px] text-ink-soft">الساحة المركزية</p>
                      </div>
                    </div>

                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                      مفتوح للطلب
                    </span>
                  </div>

                  {/* Toggle Mode Buttons (Demonstration) */}
                  <div className="flex items-center gap-1 bg-canvas p-1 rounded-xl mb-4 text-xs font-bold text-ink-soft">
                    <button
                      type="button"
                      onClick={() => setTicketState('preparing')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${ticketState === 'preparing'
                        ? 'bg-surface text-primary shadow-xs font-bold'
                        : 'hover:text-ink'
                        }`}
                    >
                      ١. جاري التحضير
                    </button>
                    <button
                      type="button"
                      onClick={() => setTicketState('ready')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${ticketState === 'ready'
                        ? 'bg-surface text-accent shadow-xs font-bold'
                        : 'hover:text-ink'
                        }`}
                    >
                      ٢. جاهز للاستلام
                    </button>
                  </div>

                  {/* Large Order Number Box */}
                  <div className="text-center py-4 bg-canvas/70 rounded-2xl border border-line/40 my-2">
                    <span className="text-[11px] font-body text-ink-soft block mb-0.5 font-semibold">
                      رقم تذكرتك في الطابور
                    </span>
                    <h3 className="font-mono text-4xl sm:text-5xl font-black text-primary tracking-wider">
                      #0247
                    </h3>
                    <p className="text-[11px] font-bold text-ink-soft mt-1">
                      {ticketState === 'preparing' ? 'طلبك قيد التحضير في الكشك' : 'طلبك جاهز تماماً للاستلام الآن!'}
                    </p>
                  </div>

                  {/* Perforated dashed divider */}
                  <div className="ticket-divider my-4" />

                  {/* Ticket Status Metrics */}
                  <div className="grid grid-cols-2 gap-3 text-center mb-4">
                    <div className="bg-canvas/50 p-2.5 rounded-xl border border-line/30">
                      <span className="font-mono text-base sm:text-lg font-bold text-ink flex items-center justify-center gap-1.5">
                        <Clock className="w-4 h-4 text-accent" />
                        <span>{ticketState === 'preparing' ? '8 دقائق' : '0 دقيقة'}</span>
                      </span>
                      <p className="text-[10px] text-ink-soft mt-0.5 font-semibold">الوقت المتبقي</p>
                    </div>

                    <div className="bg-canvas/50 p-2.5 rounded-xl border border-line/30">
                      <span className="font-mono text-base sm:text-lg font-bold text-ink flex items-center justify-center gap-1.5">
                        <Timer className="w-4 h-4 text-primary" />
                        <span>{ticketState === 'preparing' ? '2 طلب' : 'دورك الآن!'}</span>
                      </span>
                      <p className="text-[10px] text-ink-soft mt-0.5 font-semibold">أوردرات قبلك</p>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="bg-surface rounded-xl p-3 border border-line/50 text-xs text-ink-soft space-y-1.5 mb-4">
                    <div className="flex justify-between items-center font-semibold text-ink">
                      <span>1x كابتشينو دبل + 1x باتيه جبنة رومي</span>
                      <span className="font-mono font-bold text-primary">35 ج.م</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-ink-soft pt-1 border-t border-line/40">
                      <span className="flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5 text-accent" />
                        <span>الدفع عند الاستلام (كاش أو محفظة)</span>
                      </span>
                    </div>
                  </div>

                  {/* Bottom Ticket Notice */}
                  <div className="p-2.5 rounded-xl bg-primary-soft/60 border border-primary/20 flex items-center justify-between text-xs font-semibold text-primary-ink">
                    <span className="flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-primary animate-bounce" />
                      <span>إشعار فوري عند الجاهزية</span>
                    </span>
                    <Link href="/onboarding" className="text-accent hover:underline text-[11px] font-bold">
                      جولة سريعة ←
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* QUICK STATS & TRUST STRIP */}
        <section className="py-8 bg-surface border-b border-line/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-right">
              {/* Stat 1 */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-canvas/60 border border-line/40">
                <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-mono font-black text-lg text-ink">0 دقائق</h4>
                  <p className="text-xs text-ink-soft font-semibold">وقوف في الطابور</p>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-canvas/60 border border-line/40">
                <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-mono font-black text-lg text-ink">+3 كليات</h4>
                  <p className="text-xs text-ink-soft font-semibold">أكشاك معتمدة بالحرم</p>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-canvas/60 border border-line/40">
                <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-mono font-black text-lg text-ink">100% لحظي</h4>
                  <p className="text-xs text-ink-soft font-semibold">تتبع بالرقم والوقت</p>
                </div>
              </div>

              {/* Stat 4 */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-canvas/60 border border-line/40">
                <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-mono font-black text-lg text-ink">دفع مرن</h4>
                  <p className="text-xs text-ink-soft font-semibold">كاش أو محافظ إلكترونية</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="py-16 sm:py-24 border-b border-line/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
            {/* Section Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-soft text-primary-ink text-xs font-bold mb-4 border border-primary/20 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>سهولة تامة بدون تعقيد</span>
            </div>

            <h2 className="font-display font-black text-2xl sm:text-4xl text-ink mb-4">
              كيف تطلب وتستلم في ٣ خطوات بس؟
            </h2>
            <p className="font-body text-xs sm:text-base text-ink-soft max-w-xl mx-auto mb-12">
              صممنا تجربة FastOrder لتناسب رتم يومك الجامعي السريع وتنقذك من ضياع أوقات الاستراحة بين المحاضرات.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
              {/* Step 1 */}
              <div className="bg-surface rounded-3xl p-6 sm:p-7 border border-line shadow-warm flex flex-col items-start relative hover:border-primary/50 transition-all group">
                <span className="font-mono font-black text-3xl sm:text-4xl text-line/60 absolute top-5 left-5 group-hover:text-primary/30 transition-colors">
                  01
                </span>
                <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-ink mb-2">
                  ١. اطلب من مكانك
                </h3>
                <p className="font-body text-xs sm:text-sm text-ink-soft leading-relaxed">
                  تصفح منيوهات أكشاك كليتك بأسعارها المحدثة، اختر مشروبك وسندوتشك المفضل وأنت لسه قاعد في المدرج أو السكشن.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-surface rounded-3xl p-6 sm:p-7 border border-line shadow-warm flex flex-col items-start relative hover:border-primary/50 transition-all group">
                <span className="font-mono font-black text-3xl sm:text-4xl text-line/60 absolute top-5 left-5 group-hover:text-primary/30 transition-colors">
                  02
                </span>
                <div className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-ink mb-2">
                  ٢. اعرف دورك ووقتك
                </h3>
                <p className="font-body text-xs sm:text-sm text-ink-soft leading-relaxed">
                  هتستلم رقم تذكرة واضح مع عد تنازلي مباشر يبين كم أوردر قبلك في الطابور والوقت المتبقي حتى ينتهي التحضير.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-surface rounded-3xl p-6 sm:p-7 border border-line shadow-warm flex flex-col items-start relative hover:border-primary/50 transition-all group">
                <span className="font-mono font-black text-3xl sm:text-4xl text-line/60 absolute top-5 left-5 group-hover:text-primary/30 transition-colors">
                  03
                </span>
                <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-ink mb-2">
                  ٣. استلم وادفع على الجاهز
                </h3>
                <p className="font-body text-xs sm:text-sm text-ink-soft leading-relaxed">
                  أول ما يوصلك إشعار الجاهزية، انزل على الكشك مباشرة، قول رقمك واستلم طلبك سخن وادفع بالطريقة اللي تريحك.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES / VALUE PROPOSITION */}
        <section id="features" className="py-16 sm:py-24 bg-surface border-b border-line/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-soft text-accent text-xs font-bold mb-3 border border-accent/20">
                <Zap className="w-3.5 h-3.5" />
                <span>مميزات حصرية لمجتمع الجامعة</span>
              </div>
              <h2 className="font-display font-black text-2xl sm:text-4xl text-ink mb-3">
                ليه كل طالب بيعتمد على FastOrder؟
              </h2>
              <p className="font-body text-xs sm:text-base text-ink-soft">
                حل متكامل ينهي مشكلة التكدس والتدافع أمام منافذ الأغذية في الحرم الجامعي.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
              {/* Feature 1 */}
              <div className="p-6 rounded-3xl bg-canvas/70 border border-line hover:border-primary/40 transition-all flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-ink mb-1.5">
                    استغلال وقت البريك كاملاً
                  </h3>
                  <p className="font-body text-xs sm:text-sm text-ink-soft leading-relaxed">
                    بدل ما تقضي نصف ساعة الراحة بين المحاضرات واقف في الشمس والزحمة، اقعد براحتك وانزل استلم في دقيقة واحدة بس.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-3xl bg-canvas/70 border border-line hover:border-primary/40 transition-all flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-ink mb-1.5">
                    إشعارات وتنبيهات دقيقة لحظة بلحظة
                  </h3>
                  <p className="font-body text-xs sm:text-sm text-ink-soft leading-relaxed">
                    إشعار صوتي فوري على تليفونك أول ما طلبك يبدأ يتحضر ولما يجهز للاستلام بدون ما تفضل متابع الشاشة طوال الوقت.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-3xl bg-canvas/70 border border-line hover:border-primary/40 transition-all flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-ink mb-1.5">
                    منيو كامل بأسعار شفافة وحقيقية
                  </h3>
                  <p className="font-body text-xs sm:text-sm text-ink-soft leading-relaxed">
                    تصفح كل المشروبات والسندوتشات والوجبات المتاحة حالياً في كل كشك مع أسعارها الدقيقة بدون أي رسوم خفية.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-3xl bg-canvas/70 border border-line hover:border-primary/40 transition-all flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-ink mb-1.5">
                    نظام موثوق يمنع الأخطاء في الطلبات
                  </h3>
                  <p className="font-body text-xs sm:text-sm text-ink-soft leading-relaxed">
                    طلبك مسجل بالرقم والاسم والملاحظات المخصصة، مفيش لخبطة في السندوتشات أو نسيان لأي تفاصيل طلبتها.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CAMPUS KIOSKS SECTION */}
        <section id="kiosks" className="py-16 sm:py-24 border-b border-line/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-10 text-center sm:text-right gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary mb-1.5">
                  <Store className="w-4 h-4" />
                  <span>منافذ الخدمة المتاحة بالحرم</span>
                </div>
                <h2 className="font-display font-black text-2xl sm:text-4xl text-ink">
                  أكشاك الحرم الجامعي المشتركة
                </h2>
              </div>

              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="bg-surface border border-line font-bold">
                  <span>عرض جميع الأكشاك والمنيوهات</span>
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
              {kiosks.map((kiosk, idx) => (
                <div
                  key={idx}
                  className="bg-surface rounded-3xl p-6 border border-line shadow-warm flex flex-col justify-between hover:border-primary/40 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-primary-soft text-primary flex items-center justify-center">
                        <Store className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {kiosk.status}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-xl text-ink mb-1">
                      {kiosk.name}
                    </h3>
                    <p className="text-xs text-ink-soft mb-3">{kiosk.location}</p>

                    <div className="p-3 bg-canvas/60 rounded-2xl border border-line/40 text-xs mb-4">
                      <span className="text-[11px] font-bold text-primary block mb-1">أشهر الأصناف:</span>
                      <p className="text-ink-soft leading-relaxed">{kiosk.popular}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-line/60 flex items-center justify-between text-xs">
                    <span className="text-ink-soft flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-accent" />
                      <span>متوسط التحضير: <strong>{kiosk.prepTime}</strong></span>
                    </span>
                    <Link href="/auth/login" className="text-primary font-bold hover:underline">
                      طلب الآن ←
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MOBILE APP HIGHLIGHT BANNER */}
        <section className="py-12 bg-surface/60 border-b border-line/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="bg-gradient-to-r from-[#FAF8F3] to-[#F5EFE6] border border-line rounded-3xl p-6 sm:p-10 shadow-ticket flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-right">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft text-primary-ink text-xs font-bold mb-3 border border-primary/20">
                  <Smartphone className="w-3.5 h-3.5 text-primary" />
                  <span>تطبيق الأندرويد المباشر</span>
                </div>
                <h3 className="font-display font-black text-2xl sm:text-3xl text-ink mb-2">
                  حمّل تطبيق FastOrder على موبايلك
                </h3>
                <p className="font-body text-xs sm:text-sm text-ink-soft leading-relaxed">
                  احصل على إشعارات Push حقيقية تنبهك بصوت واضح عند جهوزية أوردرك، واستمتع بتصفح فائق السرعة وخفيف جداً على باقة الإنترنت الخاصة بك.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <Link href="/download" className="w-full sm:w-auto">
                  <Button size="lg" variant="primary" className="w-full shadow-warm font-bold flex items-center justify-center gap-2">
                    <Download className="w-5 h-5" />
                    <span>تحميل تطبيق APK (4.7MB)</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>


        {/* BOTTOM FINAL CALL TO ACTION */}
        <section className="py-16 sm:py-20 bg-surface text-center relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="w-16 h-16 rounded-3xl bg-primary-soft text-primary flex items-center justify-center mx-auto mb-6 shadow-warm">
              <ShoppingBag className="w-8 h-8" />
            </div>

            <h2 className="font-display font-black text-3xl sm:text-4xl text-ink mb-4">
              جاهز توفر وقتك وتطلب أسرع أوردر في كليتك؟
            </h2>
            <p className="font-body text-sm sm:text-base text-ink-soft max-w-xl mx-auto mb-8">
              انضم لمئات الطلاب اللي ودعوا الطوابير وبدأوا يستمتعوا بوقت راحتهم بالكامل.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
              <Link href="/auth/register" className="w-full sm:w-auto flex-1">
                <Button size="lg" variant="primary" className="w-full shadow-warm font-bold py-3.5">
                  <UserPlus className="w-5 h-5 ml-2" />
                  <span>إنشاء حساب مجاني</span>
                </Button>
              </Link>

              <Link href="/auth/login" className="w-full sm:w-auto flex-1">
                <Button size="lg" variant="ghost" className="w-full bg-canvas border border-line text-ink font-bold py-3.5">
                  <LogIn className="w-5 h-5 ml-2" />
                  <span>تسجيل الدخول</span>
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-surface border-t border-line py-8 px-4 text-center text-xs font-body text-ink-soft">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <Logo variant="compact" showTagline={false} />
              <span className="text-ink-soft/70">
                — منصة تنظيم طوابير وأوردرات الأكشاك في الحرم الجامعي
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
              <Link href="/download" className="text-primary hover:underline">
                تحميل التطبيق (APK)
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-ink transition-colors">
                الشروط والأحكام
              </Link>
              <span>•</span>
              <Link href="/privacy" className="hover:text-ink transition-colors">
                سياسة الخصوصية
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-line/40 text-[11px] text-ink-soft/60 font-mono">
            FASTorder © {new Date().getFullYear()} — ORDER • WAIT • ENJOY
          </div>
        </footer>
      </div>
    </StartupGateway>
  );
}

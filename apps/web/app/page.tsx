import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/branding/Logo';
import { Button } from '@/components/ui/Button';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Store,
  ArrowLeft,
  Sparkles,
  Zap,
  Users,
  ShieldCheck,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-line/70 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo variant="full" />
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-body font-semibold text-ink hover:text-primary-ink transition-colors"
            >
              تسجيل الدخول
            </Link>
            <Link href="/onboarding">
              <Button size="sm" variant="primary">
                ابدأ الآن
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col items-center text-center">
        {/* Badge Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-soft text-primary-ink text-xs font-body font-bold mb-6 border border-primary/20 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <Zap className="w-3.5 h-3.5 fill-primary" />
          <span>منصة طلبات أكشاك الحرم الجامعي الذكية</span>
        </div>

        {/* Hero Heading */}
        <h1 className="font-display font-black text-3xl sm:text-5xl md:text-6xl text-ink leading-tight sm:leading-snug max-w-3xl mb-6">
          اطلب من مكانك واعرف <span className="text-primary">دورك</span> قبل ما تنزل
        </h1>

        {/* Subtitle */}
        <p className="font-body text-sm sm:text-lg text-ink-soft max-w-2xl leading-relaxed mb-8">
          منصة <strong className="text-ink font-bold">OrderFAST</strong> تخلصك من طوابير الأكشاك في الجامعة. تصفح المنيو، تابع دورك لحظة بلحظة، وروح استلم وادفع وقت ما يجهز بس.
        </p>

        {/* Main Action Portals */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full max-w-md mb-14">
          <Link href="/student" className="w-full">
            <Button size="lg" variant="primary" className="w-full shadow-warm">
              <ShoppingBag className="w-5 h-5 ml-2" />
              <span>دخول كطالب (تجربة الطلب)</span>
            </Button>
          </Link>
          <Link href="/kiosk" className="w-full">
            <Button size="lg" variant="ghost" className="w-full bg-surface">
              <Store className="w-5 h-5 ml-2 text-accent" />
              <span>لوحة تحكم الكاشير</span>
            </Button>
          </Link>
        </div>

        {/* 3-Step Value Proposition Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full text-right my-8">
          {/* Card 1 */}
          <div className="bg-surface rounded-3xl p-6 border border-line shadow-warm flex flex-col items-start hover:border-primary/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center mb-4">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-ink mb-2">
              ١. اطلب من مكانك
            </h3>
            <p className="font-body text-xs sm:text-sm text-ink-soft leading-relaxed">
              تصفح منيوهات كل الأكشاك والمحلات في الجامعة واطلب مشروبك وسندوتشك وانت لسه في المحاضرة.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-surface rounded-3xl p-6 border border-line shadow-warm flex flex-col items-start hover:border-primary/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary-ink flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-ink mb-2">
              ٢. اعرف دورك ووقتك
            </h3>
            <p className="font-body text-xs sm:text-sm text-ink-soft leading-relaxed">
              تابع عدد الأوردرات اللي قدامك ووقت الانتظار المتوقع لحظة بلحظة برقم أوردر واضح وتذكرة مخصصة.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-surface rounded-3xl p-6 border border-line shadow-warm flex flex-col items-start hover:border-primary/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-ink mb-2">
              ٣. استلم وادفع مباشرة
            </h3>
            <p className="font-body text-xs sm:text-sm text-ink-soft leading-relaxed">
              هتوصلك رسالة أول ما الأوردر يجهز، تدفع كاش أو محفظة إلكترونية عند الكشك وتستلم على طول.
            </p>
          </div>
        </div>

        {/* Live Interactive Preview Ticket Component */}
        <div className="mt-8 p-6 sm:p-8 bg-surface border border-line rounded-3xl max-w-md w-full shadow-ticket text-right">
          <div className="flex items-center justify-between text-xs font-body text-ink-soft mb-2">
            <span className="font-bold text-ink">كشك الحرية (كلية الهندسة)</span>
            <span className="bg-accent-soft text-accent px-2 py-0.5 rounded-md font-semibold">مفتوح</span>
          </div>
          <div className="text-center my-4">
            <span className="text-[11px] font-body text-ink-soft block mb-1">تذكرة تجريبية</span>
            <h3 className="font-mono text-4xl sm:text-5xl font-black text-ink">#0247</h3>
          </div>
          <div className="ticket-divider my-4" />
          <div className="flex justify-around text-center">
            <div>
              <span className="font-mono text-base font-bold text-ink">15 د</span>
              <p className="text-[11px] font-body text-ink-soft mt-0.5">الوقت المتوقع</p>
            </div>
            <div>
              <span className="font-mono text-base font-bold text-ink">3</span>
              <p className="text-[11px] font-body text-ink-soft mt-0.5">أوردرات قدامك</p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-line/60 flex items-center justify-between">
            <span className="text-xs font-body text-ink-soft">جاهز تبدأ تجربتك؟</span>
            <Link href="/onboarding" className="text-xs font-body font-bold text-accent flex items-center gap-1 hover:underline">
              <span>جولة تعريفية</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-line py-6 px-4 text-center text-xs font-body text-ink-soft">
        <p className="mb-1">
          <strong className="text-ink font-semibold">OrderFAST</strong> — منصة تنظيم طوابير وأوردرات الأكشاك الجامعية
        </p>
        <p className="font-mono text-[11px] opacity-75">ORDER • WAIT • ENJOY</p>
      </footer>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/branding/Logo';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ArrowRight,
  Sparkles,
  ListOrdered,
  Store,
  Wallet,
  Coffee,
  UtensilsCrossed,
} from 'lucide-react';
import { markIntroSeen } from '@/lib/utils/introStorage';

export default function OnboardingIntroPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const cards = [
    {
      id: 'step-order',
      title: 'اطلب من مكانك واكسب وقتك',
      description: 'تصفح منيوهات أكشاك الجامعة واطلب مشروبك وسندوتشك وأنت لسه في المحاضرة أو السكشن.',
      badgeText: 'تصفح فوري وسهل',
      renderVisual: () => (
        <div className="relative flex flex-col items-center justify-center w-full">
          {/* Main Icon Visual */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-primary-soft border border-primary/25 flex items-center justify-center shadow-warm transition-transform duration-300 hover:scale-105">
            <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
          </div>

          {/* Floating Category Pills with Brand Style */}
          <div className="flex items-center gap-2 mt-5 flex-wrap justify-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-line text-xs font-body font-bold text-ink shadow-xs">
              <Coffee className="w-3.5 h-3.5 text-primary" />
              <span>قهوة ومشروبات</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-line text-xs font-body font-bold text-ink shadow-xs">
              <UtensilsCrossed className="w-3.5 h-3.5 text-accent" />
              <span>سندوتشات وسناكس</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'step-queue',
      title: 'اعرف دورك ووقتك بالثانية',
      description: 'تابع ترتيب أوردرك في الطابور ووقت استلامه المتوقع لحظة بلحظة وبدون ما تقف في الزحمة.',
      badgeText: 'تتبع مباشر ولحظي',
      renderVisual: () => (
        <div className="w-full max-w-[290px] bg-surface border border-line rounded-3xl p-4 sm:p-5 shadow-ticket text-right relative overflow-hidden transition-transform duration-300 hover:scale-105">
          {/* Top header row of ticket */}
          <div className="flex items-center justify-between text-xs text-ink-soft mb-2">
            <div className="flex items-center gap-1.5 font-bold text-ink">
              <Store className="w-4 h-4 text-accent" />
              <span>كشك الهندسة</span>
            </div>
            <span className="text-accent bg-accent-soft px-2.5 py-0.5 rounded-full font-bold text-[11px] border border-accent/20">
              مفتوح للطلب
            </span>
          </div>

          {/* Large ticket number */}
          <div className="text-center my-3 bg-canvas/60 rounded-2xl py-2 border border-line/40">
            <span className="text-[11px] font-body text-ink-soft block mb-0.5 font-medium">رقم دورك في الطابور</span>
            <h3 className="font-mono text-3xl sm:text-4xl font-black text-primary tracking-wider">#0247</h3>
          </div>

          {/* Perforated dashed divider */}
          <div className="border-t-2 border-dashed border-line/80 my-3" />

          {/* Ticket metadata */}
          <div className="flex justify-around text-center">
            <div>
              <span className="font-mono text-sm font-bold text-ink flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-accent" />
                10 د
              </span>
              <p className="text-[10px] text-ink-soft mt-0.5">الوقت المتوقع</p>
            </div>
            <div className="w-[1px] bg-line/60 h-8" />
            <div>
              <span className="font-mono text-sm font-bold text-ink flex items-center justify-center gap-1">
                <ListOrdered className="w-3.5 h-3.5 text-primary" />
                2 أوردر
              </span>
              <p className="text-[10px] text-ink-soft mt-0.5">أوردرات قبلك</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'step-pickup',
      title: 'استلم على الجاهز وادفع براحتك',
      description: 'أول ما طلبك يجهز هيوصلك إشعار فوري، تروح تستلم بالرقم وتدفع بالطريقة اللي تناسبك.',
      badgeText: 'استلام سريع وبدون زحمة',
      renderVisual: () => (
        <div className="relative flex flex-col items-center justify-center w-full">
          {/* Main Success Icon */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-accent-soft border border-accent/25 flex items-center justify-center shadow-warm transition-transform duration-300 hover:scale-105">
            <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-accent" />
          </div>

          {/* Ready Banner */}
          <div className="mt-4 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/90 rounded-full px-4 py-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
            <span className="text-xs font-body font-bold text-emerald-800">
              أوردرك جاهز للاستلام الآن! 🎉
            </span>
          </div>

          {/* Payment Pill */}
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-canvas border border-line text-[11px] font-body text-ink-soft">
            <Wallet className="w-3 h-3 text-primary" />
            <span>كاش عند الاستلام · فودافون كاش · إنستاباي</span>
          </div>
        </div>
      ),
    },
  ];

  const handleFinish = () => {
    markIntroSeen();
    router.replace('/auth/login');
  };

  const handleNext = () => {
    if (currentStep < cards.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        setIsTransitioning(false);
      }, 150);
    } else {
      handleFinish();
    }
  };

  const currentCard = cards[currentStep];

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-canvas text-ink flex flex-col justify-between px-4 sm:px-6 py-6 sm:py-10 select-none overflow-hidden relative"
    >
      {/* Background warm ambiance */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
      </div>

      {/* Top Header: Official Logo & Skip Button */}
      <header className="relative z-10 flex items-center justify-between w-full max-w-md mx-auto pt-safe">
        {/* Brand identity */}
        <Logo variant="compact" showTagline={false} />

        {/* Skip button */}
        <button
          type="button"
          onClick={handleFinish}
          className="text-xs font-body font-semibold text-ink-soft hover:text-ink bg-surface hover:bg-surface/80 px-4 py-1.5 rounded-full border border-line transition-all shadow-xs"
        >
          تخطي
        </button>
      </header>

      {/* Middle: Active Card Presentation */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full my-6">
        <div className="bg-surface border border-line/90 rounded-3xl p-6 sm:p-8 shadow-warm w-full text-center flex flex-col items-center relative overflow-hidden">
          {/* Subtle top decoration glow */}
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-primary/15 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-accent/10 rounded-full blur-xl pointer-events-none" />

          <div
            key={currentStep}
            className={`w-full flex flex-col items-center transition-all duration-300 ease-out ${
              isTransitioning
                ? 'opacity-0 translate-y-3'
                : 'opacity-100 translate-y-0'
            }`}
          >
            {/* Visual Container */}
            <div className="min-h-[170px] flex items-center justify-center mb-6 w-full">
              {currentCard.renderVisual()}
            </div>

            {/* Badge Pill */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary-soft text-primary-ink text-xs font-body font-bold mb-3.5 border border-primary/25 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>{currentCard.badgeText}</span>
            </div>

            {/* Title */}
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-ink mb-2.5 leading-snug">
              {currentCard.title}
            </h2>

            {/* Description */}
            <p className="font-body text-xs sm:text-sm text-ink-soft max-w-xs leading-relaxed">
              {currentCard.description}
            </p>
          </div>
        </div>
      </main>

      {/* Bottom: Stepper Dots & Action Button */}
      <footer className="relative z-10 w-full max-w-md mx-auto pb-safe flex flex-col items-center gap-5">
        {/* Stepper Dots */}
        <div className="flex items-center justify-center gap-2">
          {cards.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentStep(idx)}
              aria-label={`انتقل للبطاقة ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? 'w-8 bg-primary shadow-sm'
                  : 'w-2 bg-line hover:bg-ink-soft/40'
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleNext}
          className="w-full py-3.5 px-6 rounded-2xl bg-primary hover:bg-primary-hover text-primary-ink font-display font-bold text-base shadow-warm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span>{currentStep === cards.length - 1 ? 'ابدأ الآن' : 'التالي'}</span>
          {currentStep === cards.length - 1 ? (
            <Sparkles className="w-5 h-5 text-primary-ink" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </footer>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ArrowRight,
  Sparkles,
  ListOrdered,
} from 'lucide-react';
import { markIntroSeen, hasSeenIntro } from '@/lib/utils/introStorage';

export default function OnboardingIntroPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const cards = [
    {
      id: 'step-order',
      title: 'اطلب من مكانك',
      description: 'اعرف الأماكن المتاحة حواليك',
      badgeText: 'تصفح فوري ⚡',
      renderVisual: () => (
        <div className="relative flex flex-col items-center justify-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#FFA41C]/15 border border-[#FFA41C]/30 flex items-center justify-center shadow-[0_0_30px_rgba(255,164,28,0.25)]">
            <ShoppingBag className="w-12 h-12 sm:w-14 sm:h-14 text-[#FFA41C]" />
          </div>
          {/* Subtle floating feature pills */}
          <div className="flex items-center gap-2 mt-5">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-[#FFFBF5]/80">
              ☕ مشروبات وسناكس
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-[#FFFBF5]/80">
              🍔 وجبات سريعة
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'step-queue',
      title: 'اعرف دورك ووقتك',
      description: 'تابع ترتيبك بدون انتظار',
      badgeText: 'تتبع لحظي ⏱️',
      renderVisual: () => (
        <div className="w-full max-w-[280px] bg-[#20242E] border border-white/10 rounded-2xl p-4 shadow-xl text-right">
          <div className="flex items-center justify-between text-xs text-[#FFFBF5]/60 mb-2">
            <span className="font-bold text-[#FFFBF5]">كشك الهندسة</span>
            <span className="text-[#FFA41C] bg-[#FFA41C]/15 px-2 py-0.5 rounded-md font-semibold text-[10px]">
              مفتوح
            </span>
          </div>
          <div className="text-center my-2">
            <span className="text-[10px] text-[#FFFBF5]/50 block mb-0.5">رقم دورك</span>
            <h3 className="font-mono text-3xl sm:text-4xl font-black text-[#FFA41C]">#0247</h3>
          </div>
          <div className="border-t border-dashed border-white/15 my-2.5" />
          <div className="flex justify-around text-center">
            <div>
              <span className="font-mono text-sm font-bold text-[#FFFBF5] flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#FFA41C]" />
                12 د
              </span>
              <p className="text-[10px] text-[#FFFBF5]/50 mt-0.5">الوقت المتوقع</p>
            </div>
            <div>
              <span className="font-mono text-sm font-bold text-[#FFFBF5] flex items-center justify-center gap-1">
                <ListOrdered className="w-3.5 h-3.5 text-[#FFA41C]" />
                2
              </span>
              <p className="text-[10px] text-[#FFFBF5]/50 mt-0.5">أوردرات قدامك</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'step-pickup',
      title: 'استلم طلبك بسهولة',
      description: 'كل شيء واضح من أول الطلب لحد الاستلام',
      badgeText: 'جاهز للاستلام 🎯',
      renderVisual: () => (
        <div className="relative flex flex-col items-center justify-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#FFA41C]/15 border border-[#FFA41C]/30 flex items-center justify-center shadow-[0_0_30px_rgba(255,164,28,0.25)]">
            <CheckCircle2 className="w-12 h-12 sm:w-14 sm:h-14 text-[#FFA41C]" />
          </div>
          <div className="mt-5 inline-flex items-center gap-2 bg-[#FFA41C]/15 border border-[#FFA41C]/30 rounded-full px-4 py-1.5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#FFA41C] animate-ping" />
            <span className="text-xs font-bold text-[#FFA41C]">
              أوردرك جاهز للاستلام الآن!
            </span>
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
      className="min-h-screen bg-[#161920] text-[#FFFBF5] flex flex-col justify-between px-6 py-8 sm:py-12 select-none overflow-hidden relative"
    >
      {/* Background ambient radial glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[380px] h-[380px] bg-[#FFA41C]/10 rounded-full blur-[100px]" />
      </div>

      {/* Top Header: Brand & Skip Button */}
      <header className="relative z-10 flex items-center justify-between w-full max-w-md mx-auto pt-safe">
        {/* Brand identity */}
        <div dir="ltr" className="flex items-baseline gap-1">
          <span className="font-display font-black text-xl text-[#FFA41C] tracking-tight">
            FAST
          </span>
          <span className="font-display font-black text-xl text-[#FFFBF5]">
            order
          </span>
        </div>

        {/* Skip button */}
        <button
          type="button"
          onClick={handleFinish}
          className="text-xs font-body font-semibold text-[#FFFBF5]/60 hover:text-[#FFFBF5] bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10 transition-all backdrop-blur-sm"
        >
          تخطي
        </button>
      </header>

      {/* Middle: Active Card Content with Fade-In + Slide-Up */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full my-6 text-center">
        <div
          key={currentStep}
          className={`w-full flex flex-col items-center transition-all duration-300 ease-out ${
            isTransitioning
              ? 'opacity-0 translate-y-3'
              : 'opacity-100 translate-y-0'
          }`}
        >
          {/* Visual Container */}
          <div className="min-h-[160px] flex items-center justify-center mb-6">
            {currentCard.renderVisual()}
          </div>

          {/* Badge Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFA41C]/10 border border-[#FFA41C]/25 text-[#FFA41C] text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{currentCard.badgeText}</span>
          </div>

          {/* Title */}
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#FFFBF5] mb-2 leading-snug">
            {currentCard.title}
          </h2>

          {/* Description */}
          <p className="font-body text-sm sm:text-base text-[#FFFBF5]/70 max-w-xs leading-relaxed">
            {currentCard.description}
          </p>
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
                  ? 'w-7 bg-[#FFA41C]'
                  : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleNext}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#FFA41C] to-[#E8992A] text-[#161920] font-body font-bold text-base shadow-[0_4px_20px_rgba(255,164,28,0.35)] hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          <span>{currentStep === cards.length - 1 ? 'ابدأ الآن' : 'التالي'}</span>
          <ChevronLeft className="w-5 h-5" />
        </button>
      </footer>
    </div>
  );
}

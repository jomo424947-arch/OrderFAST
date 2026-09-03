'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Check, Clock, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      badgeIcon: <ShoppingBag className="w-10 h-10 text-accent" />,
      title: 'اطلب من مكانك',
      subtitle: 'تصفح منيوهات كل الأكشاك والمحلات في الجامعة، واطلب وانت لسه في المحاضرة.',
      hasTicket: false,
    },
    {
      badgeIcon: null,
      title: 'اعرف دورك قبل ما تنزل',
      subtitle: 'تابع عدد الأوردرات اللي قدامك، ووقت الانتظار المتوقع لحظة بلحظة.',
      hasTicket: true,
    },
    {
      badgeIcon: <Check className="w-10 h-10 text-accent stroke-[3]" />,
      title: 'روح وقت ما يجهز بس',
      subtitle: 'هتوصلك رسالة أول ما الأوردر يبقى جاهز، تدفع كاش أو محفظة وتستلم على طول.',
      hasTicket: false,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      router.push('/student');
    }
  };

  const step = steps[currentStep];

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
      {/* Mobile Device Frame Container */}
      <div className="w-full max-w-sm bg-surface border-[8px] border-ink rounded-[40px] overflow-hidden shadow-floating relative min-h-[620px] flex flex-col justify-between p-6 text-center">
        {/* Top Skip button */}
        <div className="flex justify-between items-center w-full">
          <div className="w-14 h-1.5 bg-ink/20 rounded-full mx-auto" />
          <Link
            href="/student"
            className="absolute left-6 top-6 text-xs font-body font-semibold text-ink-soft hover:text-ink transition-colors"
          >
            تخطي
          </Link>
        </div>

        {/* Center Content */}
        <div className="flex-1 flex flex-col items-center justify-center my-6">
          {step.badgeIcon && (
            <div className="w-24 h-24 rounded-3xl bg-accent-soft flex items-center justify-center mb-6 shadow-sm">
              {step.badgeIcon}
            </div>
          )}

          <h2 className="font-display font-bold text-2xl text-ink mb-3">
            {step.title}
          </h2>

          <p className="font-body text-xs sm:text-sm text-ink-soft leading-relaxed px-4 max-w-xs">
            {step.subtitle}
          </p>

          {/* Ticket illustration for Step 2 */}
          {step.hasTicket && (
            <div className="w-full bg-canvas/70 border border-line rounded-2xl p-4 mt-6 text-right shadow-sm">
              <div className="flex justify-between text-xs font-body text-ink-soft">
                <span className="font-bold text-ink">كشك الحرية</span>
                <span>أوردر رقم</span>
              </div>
              <div className="text-center my-2">
                <span className="font-mono text-3xl sm:text-4xl font-black text-ink">
                  0247
                </span>
              </div>
              <div className="ticket-divider my-3" />
              <div className="flex justify-around text-center">
                <div>
                  <span className="font-mono text-sm font-bold text-ink flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-accent" />
                    15 د
                  </span>
                  <span className="text-[10px] font-body text-ink-soft">الوقت المتوقع</span>
                </div>
                <div>
                  <span className="font-mono text-sm font-bold text-ink flex items-center justify-center gap-1">
                    <ListOrdered className="w-3.5 h-3.5 text-accent" />
                    3
                  </span>
                  <span className="text-[10px] font-body text-ink-soft">أوردرات قدامك</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation: Stepper Dots & Next Button */}
        <div>
          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? 'w-6 bg-primary'
                    : 'w-1.5 bg-line'
                }`}
              />
            ))}
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleNext}
            className="w-full"
          >
            {currentStep === steps.length - 1 ? 'ابدأ' : 'التالي'}
          </Button>
        </div>
      </div>
    </div>
  );
}

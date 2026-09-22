'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOrderStore } from '@/stores/useOrderStore';
import {
  Coffee,
  UtensilsCrossed,
  Zap,
  ArrowLeft,
  X,
  Clock,
} from 'lucide-react';

interface PromptConfig {
  title: string;
  message: string;
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBgClass: string;
  iconColorClass: string;
}

const STORAGE_KEY = 'fastorder_student_prompt_last_seen';
const TOTAL_DURATION_SECONDS = 15;

export function StudentMotivationalPrompt() {
  const { student, role } = useAuthStore();
  const orders = useOrderStore((s) => s.orders);

  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_DURATION_SECONDS);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if student has an active order
  const hasActiveOrder = orders.some(
    (o) =>
      (student?.id ? o.studentId === student.id : true) &&
      (o.status === 'PENDING_KIOSK' ||
        o.status === 'ACCEPTED' ||
        o.status === 'PREPARING' ||
        o.status === 'READY')
  );

  useEffect(() => {
    // Only for students
    if (role && role !== 'student') return;

    // Suppress if student already placed an active order
    if (hasActiveOrder) return;

    if (typeof window !== 'undefined') {
      // Expose reset helper to window for easy testing in console
      (window as any).__resetStudentPrompt = () => {
        sessionStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
      };

      const urlParams = new URLSearchParams(window.location.search);
      const forceShow = urlParams.get('prompt') === 'true';

      if (!forceShow) {
        // Suppress if already seen in this session
        const seenSession = sessionStorage.getItem(STORAGE_KEY);
        if (seenSession) return;

        // Frequency check: once every 4 hours max in localStorage
        const lastSeen = localStorage.getItem(STORAGE_KEY);
        if (lastSeen) {
          const timeDiff = Date.now() - parseInt(lastSeen, 10);
          if (timeDiff < 4 * 60 * 60 * 1000) {
            return;
          }
        }
      }

      // Gentle delay before showing (1.2 seconds after load)
      const showTimer = setTimeout(() => {
        setIsVisible(true);
        setTimeLeft(TOTAL_DURATION_SECONDS);
      }, 1200);

      return () => clearTimeout(showTimer);
    }
  }, [role, hasActiveOrder]);

  // Exact 15-second countdown timer
  useEffect(() => {
    if (isVisible && !isClosing) {
      countdownIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current as NodeJS.Timeout);
            handleDismiss();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      };
    }
  }, [isVisible, isClosing]);

  const handleDismiss = () => {
    setIsClosing(true);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEY, 'true');
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
      }
    }, 250);
  };

  if (!isVisible || hasActiveOrder) return null;

  // Determine dynamic prompt copy based on time of day (strictly NO emojis)
  const getPromptConfig = (): PromptConfig => {
    const hour = new Date().getHours();

    if (hour >= 6 && hour < 11) {
      return {
        title: 'صباح النشاط',
        message: 'وفّر طابور أول اليوم في كليتك واطلب قهوتك أو فطارك مسبقاً.',
        subtext: 'طلبك يبدأ يتحضر وأنت في طريقك، وتستلم سخن فور وصولك.',
        icon: Coffee,
        iconBgClass: 'bg-primary-soft',
        iconColorClass: 'text-primary',
      };
    } else if (hour >= 11 && hour < 16) {
      return {
        title: 'وقت بريك المحاضرات',
        message: 'وراك محاضرة قادمة؟ اطلب وجبتك أو سندوتشك الآن بدون انتظار.',
        subtext: 'تصفح قائمة الكشك واعرف دورك بالثانية لتستغل وقت راحتك كاملاً.',
        icon: UtensilsCrossed,
        iconBgClass: 'bg-accent-soft',
        iconColorClass: 'text-accent',
      };
    } else {
      return {
        title: 'جدد طاقتك الجامعية',
        message: 'يومك طويل في الكلية؟ اطلب مشروبك المفضل أو سناك خفيف بضغطة واحدة.',
        subtext: 'استلم بالرقم من الكشك مباشرة وادفع كاش أو بمحفظتك الإلكترونية.',
        icon: Zap,
        iconBgClass: 'bg-primary-soft',
        iconColorClass: 'text-primary',
      };
    }
  };

  const config = getPromptConfig();
  const IconComponent = config.icon;

  return (
    <div
      dir="rtl"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-[2px] transition-all duration-300 ease-out ${
        isClosing ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      <div
        aria-label="إشعار تحفيزي للطلب"
        className={`w-full max-w-sm sm:max-w-md bg-surface border border-line rounded-3xl p-5 sm:p-6 shadow-floating relative overflow-hidden text-right transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100 animate-in zoom-in-95'
        }`}
      >
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full blur-xl pointer-events-none" />

        {/* Top row: Countdown timer & Close button */}
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-canvas border border-line text-[11px] font-mono font-bold text-ink-soft">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>يختفي خلال {timeLeft}ث</span>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full bg-canvas hover:bg-line/40 text-ink-soft hover:text-ink flex items-center justify-center transition-colors"
            aria-label="إغلاق التنبيه"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Box */}
        <div className="flex items-start gap-3.5 relative z-10 my-2">
          {/* Main Icon */}
          <div
            className={`w-12 h-12 rounded-2xl ${config.iconBgClass} ${config.iconColorClass} flex items-center justify-center shrink-0 shadow-warm`}
          >
            <IconComponent className="w-6 h-6" />
          </div>

          {/* Texts */}
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-lg text-ink mb-1">
              {config.title}
            </h3>
            <p className="font-body text-xs sm:text-sm font-semibold text-ink leading-relaxed">
              {config.message}
            </p>
            <p className="font-body text-xs text-ink-soft leading-relaxed mt-1">
              {config.subtext}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-3 border-t border-line/60 flex items-center gap-2.5 relative z-10">
          <Link
            href="/student/kiosks"
            onClick={handleDismiss}
            className="flex-1 py-3 px-4 rounded-2xl bg-primary hover:bg-primary-hover text-primary-ink font-display font-bold text-sm shadow-warm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>تصفح الأكشاك واطلب الآن</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={handleDismiss}
            className="py-3 px-4 rounded-2xl bg-canvas hover:bg-canvas/80 text-ink-soft font-body font-semibold text-xs transition-colors"
          >
            لاحقاً
          </button>
        </div>

        {/* 15-second visual progress bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-line/30 overflow-hidden">
          <div className="h-full bg-primary animate-progress-15s" />
        </div>
      </div>

      <style jsx>{`
        @keyframes progress15s {
          0% {
            width: 100%;
          }
          100% {
            width: 0%;
          }
        }
        .animate-progress-15s {
          animation: progress15s 15s linear forwards;
        }
      `}</style>
    </div>
  );
}

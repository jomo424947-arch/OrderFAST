'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { apiClient } from '@/lib/api/client';
import {
  Coffee,
  UtensilsCrossed,
  Zap,
  Sparkles,
  Flame,
  Gift,
  Percent,
  ArrowLeft,
  X,
  Clock,
  Tag,
} from 'lucide-react';

interface PromptConfig {
  title: string;
  message: string;
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBgClass: string;
  iconColorClass: string;
  imageUrl?: string | null;
  badgeText?: string | null;
  layoutMode?: 'smart_fit' | 'full_poster' | 'banner';
  actionText: string;
  actionUrl: string;
}

interface ServerPromptConfig {
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

const STORAGE_KEY = 'fastorder_student_prompt_last_seen';

const ICON_MAP: Record<string, { icon: React.ComponentType<{ className?: string }>; bg: string; color: string }> = {
  zap: { icon: Zap, bg: 'bg-amber-100', color: 'text-amber-600' },
  coffee: { icon: Coffee, bg: 'bg-primary-soft', color: 'text-primary' },
  utensils: { icon: UtensilsCrossed, bg: 'bg-accent-soft', color: 'text-accent' },
  sparkles: { icon: Sparkles, bg: 'bg-purple-100', color: 'text-purple-600' },
  flame: { icon: Flame, bg: 'bg-orange-100', color: 'text-orange-600' },
  gift: { icon: Gift, bg: 'bg-emerald-100', color: 'text-emerald-600' },
  percent: { icon: Percent, bg: 'bg-rose-100', color: 'text-rose-600' },
};

export function StudentMotivationalPrompt() {
  const { student, role } = useAuthStore();
  const orders = useOrderStore((s) => s.orders);

  const [serverConfig, setServerConfig] = useState<ServerPromptConfig | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
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

  // 1. Fetch server prompt settings
  useEffect(() => {
    let isMounted = true;
    apiClient
      .get<any>('/notifications/app-prompt')
      .then((res) => {
        const data = res?.data ?? res;
        if (isMounted && data) {
          setServerConfig(data);
          if (data.durationSeconds) {
            setTimeLeft(Number(data.durationSeconds));
          }
        }
      })
      .catch((err) => {
        console.warn('[Prompt] Failed to load server prompt config, falling back:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Control visibility according to admin rules and frequency
  useEffect(() => {
    // Only for students
    if (role && role !== 'student') return;

    // Suppress if student already placed an active order
    if (hasActiveOrder) return;

    // Check if prompt is disabled by admin
    if (serverConfig && serverConfig.isEnabled === false) return;

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

        // Frequency check according to Admin frequencyHours
        const freqHours = serverConfig?.frequencyHours ?? 4;
        if (freqHours > 0) {
          const lastSeen = localStorage.getItem(STORAGE_KEY);
          if (lastSeen) {
            const timeDiff = Date.now() - parseInt(lastSeen, 10);
            if (timeDiff < freqHours * 60 * 60 * 1000) {
              return;
            }
          }
        }
      }

      // Gentle delay before showing (1.2 seconds after load)
      const duration = serverConfig?.durationSeconds ?? 10;
      const showTimer = setTimeout(() => {
        setIsVisible(true);
        setTimeLeft(duration);
      }, 1200);

      return () => clearTimeout(showTimer);
    }
  }, [role, hasActiveOrder, serverConfig]);

  // 3. Countdown timer
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

  if (!isVisible || hasActiveOrder || (serverConfig && serverConfig.isEnabled === false)) return null;

  // Determine prompt copy (Admin Custom vs Dynamic Time-of-day)
  const getPromptConfig = (): PromptConfig => {
    if (serverConfig?.mode === 'custom') {
      const iconMeta = ICON_MAP[serverConfig.icon] || ICON_MAP.zap;
      return {
        title: serverConfig.title || 'جدد طاقتك الجامعية',
        message: serverConfig.message || 'يومك طويل في الكلية؟ اطلب مشروبك المفضل أو سناك خفيف بضغطة واحدة.',
        subtext: serverConfig.subtext || 'استلم بالرقم من الكشك مباشرة وادفع كاش أو بمحفظتك الإلكترونية.',
        icon: iconMeta.icon,
        iconBgClass: iconMeta.bg,
        iconColorClass: iconMeta.color,
        imageUrl: serverConfig.imageUrl || null,
        badgeText: serverConfig.badgeText || null,
        layoutMode: serverConfig.layoutMode || 'full_poster',
        actionText: serverConfig.actionText || 'تصفح الأكشاك واطلب الآن',
        actionUrl: serverConfig.actionUrl || '/student/kiosks',
      };
    }

    // Auto Mode: Time-of-day presets
    const hour = new Date().getHours();

    if (hour >= 6 && hour < 11) {
      return {
        title: 'صباح النشاط',
        message: 'وفّر طابور أول اليوم في كليتك واطلب قهوتك أو فطارك مسبقاً.',
        subtext: 'طلبك يبدأ يتحضر وأنت في طريقك، وتستلم سخن فور وصولك.',
        icon: Coffee,
        iconBgClass: 'bg-primary-soft',
        iconColorClass: 'text-primary',
        imageUrl: serverConfig?.imageUrl || null,
        badgeText: 'بداية اليوم ☀️',
        layoutMode: serverConfig?.layoutMode || 'full_poster',
        actionText: 'تصفح الأكشاك واطلب الآن',
        actionUrl: '/student/kiosks',
      };
    } else if (hour >= 11 && hour < 16) {
      return {
        title: 'وقت بريك المحاضرات',
        message: 'وراك محاضرة قادمة؟ اطلب وجبتك أو سندوتشك الآن بدون انتظار.',
        subtext: 'تصفح قائمة الكشك واعرف دورك بالثانية لتستغل وقت راحتك كاملاً.',
        icon: UtensilsCrossed,
        iconBgClass: 'bg-accent-soft',
        iconColorClass: 'text-accent',
        imageUrl: serverConfig?.imageUrl || null,
        badgeText: 'وجبات وسندوتشات 🥪',
        layoutMode: serverConfig?.layoutMode || 'full_poster',
        actionText: 'تصفح الأكشاك واطلب الآن',
        actionUrl: '/student/kiosks',
      };
    } else {
      return {
        title: 'جدد طاقتك الجامعية',
        message: 'يومك طويل في الكلية؟ اطلب مشروبك المفضل أو سناك خفيف بضغطة واحدة.',
        subtext: 'استلم بالرقم من الكشك مباشرة وادفع كاش أو بمحفظتك الإلكترونية.',
        icon: Zap,
        iconBgClass: 'bg-amber-100',
        iconColorClass: 'text-amber-600',
        imageUrl: serverConfig?.imageUrl || null,
        badgeText: 'سناك ومشروبات ⚡',
        layoutMode: serverConfig?.layoutMode || 'full_poster',
        actionText: 'تصفح الأكشاك واطلب الآن',
        actionUrl: '/student/kiosks',
      };
    }
  };

  const config = getPromptConfig();
  const IconComponent = config.icon;
  const totalDuration = serverConfig?.durationSeconds || 10;
  const hasImage = Boolean(config.imageUrl);
  const layoutMode = config.layoutMode || 'full_poster';

  return (
    <div
      dir="rtl"
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md transition-all duration-300 ease-out ${
        isClosing ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      {/* 1. Full Story Flyer Modal (For restaurant story flyers like Festival Land) */}
      {layoutMode === 'full_poster' && hasImage ? (
        <div
          aria-label="إعلان ترويجي"
          className={`w-full max-w-[330px] sm:max-w-[370px] max-h-[90vh] bg-stone-950 border border-white/20 rounded-[32px] shadow-floating relative overflow-hidden text-right flex flex-col transition-all duration-300 ${
            isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100 animate-in zoom-in-95'
          }`}
        >
          {/* Main uncropped poster stage */}
          <div className="relative flex-1 min-h-[390px] max-h-[70vh] w-full bg-black overflow-hidden flex items-center justify-center">
            {/* Ambient matching glow */}
            <img
              src={config.imageUrl!}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125 pointer-events-none select-none"
            />
            {/* Uncropped crisp poster */}
            <img
              src={config.imageUrl!}
              alt={config.title}
              className="relative z-10 w-full h-full object-contain max-h-[70vh]"
            />

            {/* Top floating controls */}
            <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between z-20">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 text-xs font-mono font-bold shadow-md">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>يختفي خلال {timeLeft}ث</span>
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition-colors border border-white/20 shadow-md"
                aria-label="إغلاق الإعلان"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Floating Price/Offer Badge if any */}
            {config.badgeText && (
              <div className="absolute top-14 right-3.5 z-20">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-ink font-body text-xs font-black shadow-lg border border-white/30">
                  <Tag className="w-3 h-3" />
                  <span>{config.badgeText}</span>
                </span>
              </div>
            )}
          </div>

          {/* Floating Glass Bottom CTA Action Bar */}
          <div className="p-4 bg-stone-900/95 backdrop-blur-lg border-t border-white/10 space-y-2.5 z-20">
            {config.title && (
              <div className="text-right">
                <h4 className="font-display font-black text-white text-base leading-snug line-clamp-1">
                  {config.title}
                </h4>
                {config.message && (
                  <p className="font-body text-xs text-stone-300 line-clamp-1">
                    {config.message}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Link
                href={config.actionUrl}
                onClick={handleDismiss}
                className="flex-1 py-3 px-4 rounded-2xl bg-primary hover:bg-primary-hover text-primary-ink font-display font-bold text-sm shadow-warm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span>{config.actionText}</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={handleDismiss}
                className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-stone-300 font-body font-semibold text-xs transition-colors"
              >
                لاحقاً
              </button>
            </div>
          </div>

          {/* Bottom Progress Bar */}
          <div className="h-[3px] bg-white/10 w-full overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{
                width: `${(timeLeft / totalDuration) * 100}%`,
                transition: 'width 1s linear',
              }}
            />
          </div>
        </div>
      ) : (
        /* 2. Standard Card Modal with Ambient Contain Support */
        <div
          aria-label="إعلان ترويجي"
          className={`w-full max-w-sm sm:max-w-md bg-surface border border-line rounded-[28px] shadow-floating relative overflow-hidden text-right transition-all duration-300 ${
            isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100 animate-in zoom-in-95'
          }`}
        >
          {/* Header Media Area: Image Poster or Styled Gradient */}
          {hasImage ? (
            <div className="relative w-full h-48 sm:h-56 bg-stone-950 overflow-hidden flex items-center justify-center">
              {/* Ambient blur glow */}
              <img
                src={config.imageUrl!}
                alt=""
                className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-35 scale-125 pointer-events-none"
              />
              <img
                src={config.imageUrl!}
                alt={config.title}
                className={`relative z-10 ${
                  layoutMode === 'smart_fit'
                    ? 'max-h-full max-w-full object-contain'
                    : 'w-full h-full object-cover'
                }`}
              />
              {/* Soft gradient shade at bottom of image */}
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-black/40 pointer-events-none" />

              {/* Top floating controls */}
              <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 text-white backdrop-blur-md border border-white/20 text-xs font-mono font-bold shadow-sm">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>يختفي خلال {timeLeft}ث</span>
                </div>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition-colors border border-white/20"
                  aria-label="إغلاق الإعلان"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Bottom floating badge on image */}
              {config.badgeText && (
                <div className="absolute bottom-3 right-3 z-10">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-ink font-body text-xs font-black shadow-md border border-white/30">
                    <Tag className="w-3 h-3" />
                    <span>{config.badgeText}</span>
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Non-image sleek top bar */
            <div className="p-5 pb-0">
              {/* Subtle decorative glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/15 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full blur-xl pointer-events-none" />

              <div className="flex items-center justify-between mb-2 relative z-10">
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
            </div>
          )}

          {/* Content Details Area */}
          <div className={`p-5 sm:p-6 ${hasImage ? 'pt-4' : 'pt-2'} space-y-3 relative z-10`}>
            {!hasImage ? (
              <div className="flex items-start gap-3.5">
                <div className={`w-12 h-12 rounded-2xl ${config.iconBgClass} ${config.iconColorClass} flex items-center justify-center shrink-0 shadow-warm`}>
                  <IconComponent className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  {config.badgeText && (
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-primary-soft text-primary-ink text-[11px] font-bold mb-1 border border-primary/20">
                      {config.badgeText}
                    </span>
                  )}
                  <h3 className="font-display font-black text-lg sm:text-xl text-ink leading-snug">
                    {config.title}
                  </h3>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-display font-black text-xl text-ink leading-snug">
                  {config.title}
                </h3>
              </div>
            )}

            {/* Description Texts */}
            <p className="font-body text-xs sm:text-sm font-semibold text-ink leading-relaxed">
              {config.message}
            </p>

            {config.subtext && (
              <p className="font-body text-xs text-ink-soft leading-relaxed">
                {config.subtext}
              </p>
            )}

            {/* Action Buttons */}
            <div className="mt-5 pt-3.5 border-t border-line/60 flex items-center gap-2.5">
              <Link
                href={config.actionUrl}
                onClick={handleDismiss}
                className="flex-1 py-3 px-4 rounded-2xl bg-primary hover:bg-primary-hover text-primary-ink font-display font-bold text-sm shadow-warm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span>{config.actionText}</span>
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
          </div>

          {/* Smooth animated progress bar at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-line/30 overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{
                width: `${(timeLeft / totalDuration) * 100}%`,
                transition: 'width 1s linear',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

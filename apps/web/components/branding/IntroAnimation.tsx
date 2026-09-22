'use client';

import React, { useEffect, useState } from 'react';

interface IntroAnimationProps {
  forceShow?: boolean;
  onComplete?: () => void;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({
  forceShow = false,
  onComplete,
}) => {
  const [phase, setPhase] = useState<'idle' | 'animating' | 'exiting' | 'done'>('idle');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Suppress in native Capacitor Android (the native Java splash already handled launch)
    if (typeof window !== 'undefined') {
      const isNative =
        (window as any).Capacitor?.isNativePlatform?.() ||
        navigator.userAgent.includes('FastOrder-Android');
      if (isNative && !forceShow) {
        setPhase('done');
        onComplete?.();
        return;
      }
    }

    // Check if seen in this session (unless forced)
    if (!forceShow && typeof window !== 'undefined') {
      const seen = sessionStorage.getItem('fastorder_intro_seen');
      if (seen) {
        setPhase('done');
        return;
      }
      sessionStorage.setItem('fastorder_intro_seen', 'true');
    }

    // Start brand animation
    setPhase('animating');

    // Begin smooth exit fade out at 1.5s
    const exitTimer = setTimeout(() => {
      setPhase('exiting');
    }, 1550);

    // Complete animation at 1.9s
    const doneTimer = setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, 1900);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [forceShow, onComplete]);

  // Support replaying via global event
  useEffect(() => {
    const handleReplay = () => {
      setPhase('animating');
      setTimeout(() => setPhase('exiting'), 1550);
      setTimeout(() => setPhase('done'), 1900);
    };

    window.addEventListener('replay-fastorder-intro', handleReplay);
    return () => {
      window.removeEventListener('replay-fastorder-intro', handleReplay);
    };
  }, []);

  if (!mounted || phase === 'done') return null;

  const handleSkip = () => {
    setPhase('done');
    onComplete?.();
  };

  return (
    <div
      dir="ltr"
      onClick={handleSkip}
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-canvas select-none cursor-pointer transition-all duration-350 ease-out overflow-hidden ${
        phase === 'exiting' ? 'opacity-0 scale-102 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background ambient warm glows matching brand colors */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[450px] h-[450px] bg-primary/15 rounded-full blur-[110px] animate-ambient-pulse" />
        <div className="absolute top-1/4 -right-10 w-[260px] h-[260px] bg-accent/10 rounded-full blur-[90px]" />
      </div>

      {/* Skip button matching site theme */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleSkip();
        }}
        className="absolute top-6 left-6 text-xs font-body font-semibold text-ink-soft hover:text-ink bg-surface/90 hover:bg-surface px-4 py-1.5 rounded-full border border-line shadow-warm backdrop-blur-sm transition-all z-10"
      >
        تخطي • SKIP
      </button>

      {/* Main Brand Content Container */}
      <div className="relative flex flex-col items-center justify-center text-center -translate-y-4 px-4">
        {/* Official FASTorder Logo */}
        <div className="relative mb-5 flex items-center justify-center animate-logo-entrance">
          <div className="absolute inset-0 bg-primary/25 rounded-full blur-2xl animate-pulse" />
          <img
            src="/logo_trans.png"
            alt="FASTorder"
            className="relative w-28 h-28 sm:w-32 sm:h-32 object-contain drop-shadow-[0_12px_28px_rgba(232,153,42,0.35)]"
          />
        </div>

        {/* Brand Title: FASTorder */}
        <div className="animate-text-entrance">
          <h1 className="text-4xl sm:text-5xl font-display font-black tracking-tight flex items-baseline justify-center gap-0.5">
            <span
              className="font-black"
              style={{
                background: 'linear-gradient(135deg, #FFA41C 0%, #E8992A 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              FAST
            </span>
            <span className="text-ink">order</span>
          </h1>

          {/* Tagline */}
          <p className="mt-2 text-xs sm:text-sm font-mono tracking-[0.25em] text-ink-soft uppercase font-semibold">
            ORDER • WAIT • ENJOY
          </p>

          {/* Slogan badge matching site design system */}
          <div className="mt-4 inline-flex items-center gap-2 bg-surface border border-line rounded-full px-4 py-1.5 shadow-warm backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span className="text-xs font-body font-bold text-primary-ink" dir="rtl">
              أسرع طلب في حرم جامعتك ⚡
            </span>
          </div>
        </div>
      </div>

      {/* Scoped CSS Keyframe Animations */}
      <style jsx>{`
        @keyframes ambientPulse {
          0% {
            transform: scale(0.85);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.15);
            opacity: 1;
          }
          100% {
            transform: scale(0.85);
            opacity: 0.6;
          }
        }

        @keyframes logoEntrance {
          0% {
            transform: scale(0.85);
            opacity: 0;
            filter: blur(6px);
          }
          100% {
            transform: scale(1);
            opacity: 1;
            filter: blur(0px);
          }
        }

        @keyframes textEntrance {
          0% {
            transform: translateY(24px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        :global(.animate-ambient-pulse) {
          animation: ambientPulse 2s ease-in-out infinite;
        }

        :global(.animate-logo-entrance) {
          animation: logoEntrance 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        :global(.animate-text-entrance) {
          animation: textEntrance 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.25s forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

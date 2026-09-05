'use client';

import React, { useEffect, useState } from 'react';
import {
  playIntroBellRing,
  playSpeedDashWhoosh,
  playIntroBrandChime,
} from '@/lib/utils/sound';

interface IntroAnimationProps {
  forceShow?: boolean;
  onComplete?: () => void;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({
  forceShow = false,
  onComplete,
}) => {
  const [phase, setPhase] = useState<'idle' | 'ringing' | 'dashing' | 'revealing' | 'exiting' | 'done'>('idle');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if seen in this session (unless forced)
    if (!forceShow && typeof window !== 'undefined') {
      const seen = sessionStorage.getItem('fastorder_intro_seen');
      if (seen) {
        setPhase('done');
        return;
      }
      sessionStorage.setItem('fastorder_intro_seen', 'true');
    }

    // Phase 1: Ringing (0s - 0.7s)
    setPhase('ringing');
    playIntroBellRing();

    // Phase 2: Speed Dash (0.7s - 1.4s)
    const timer1 = setTimeout(() => {
      setPhase('dashing');
      playSpeedDashWhoosh();
    }, 700);

    // Phase 3: Brand Reveal (1.4s - 2.2s)
    const timer2 = setTimeout(() => {
      setPhase('revealing');
      playIntroBrandChime();
    }, 1400);

    // Phase 4: Exit fade out (2.2s - 2.6s)
    const timer3 = setTimeout(() => {
      setPhase('exiting');
    }, 2200);

    // Finish
    const timer4 = setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, 2600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [forceShow, onComplete]);

  // Support replaying via global event
  useEffect(() => {
    const handleReplay = () => {
      setPhase('ringing');
      playIntroBellRing();
      setTimeout(() => {
        setPhase('dashing');
        playSpeedDashWhoosh();
      }, 700);
      setTimeout(() => {
        setPhase('revealing');
        playIntroBrandChime();
      }, 1400);
      setTimeout(() => {
        setPhase('exiting');
      }, 2200);
      setTimeout(() => {
        setPhase('done');
      }, 2600);
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
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#161920] select-none transition-all duration-400 ease-out overflow-hidden ${
        phase === 'exiting' ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background subtle radial ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[#FFA41C]/15 rounded-full blur-[90px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-[#FF6B00]/20 rounded-full blur-[60px]" />
      </div>

      {/* Skip button */}
      <button
        type="button"
        onClick={handleSkip}
        className="absolute top-6 left-6 text-xs font-mono font-bold tracking-widest text-[#FFFBF5]/50 hover:text-[#FFFBF5] bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm transition-all border border-white/10 z-10"
      >
        تخطي • SKIP
      </button>

      {/* Stage Container */}
      <div className="relative w-full max-w-sm flex flex-col items-center justify-center min-h-[320px]">
        {/* ========================================================= */}
        {/* PHASE 1: RINGING BELL (0 - 0.7s) */}
        {/* ========================================================= */}
        {phase === 'ringing' && (
          <div className="relative flex flex-col items-center justify-center animate-intro-bell-ring">
            {/* Sound Wave Rings radiating outward */}
            <div className="absolute -left-12 top-2 flex flex-col gap-1.5 opacity-80 animate-ping-slow">
              <span className="w-2 h-5 border-l-2 border-[#FFA41C] rounded-l-full block" />
              <span className="w-3 h-8 border-l-2 border-[#FFA41C] rounded-l-full block" />
            </div>
            <div className="absolute -right-12 top-2 flex flex-col gap-1.5 opacity-80 animate-ping-slow">
              <span className="w-2 h-5 border-r-2 border-[#FFA41C] rounded-r-full block" />
              <span className="w-3 h-8 border-r-2 border-[#FFA41C] rounded-r-full block" />
            </div>

            {/* Cloche Bell SVG */}
            <svg
              width="100"
              height="100"
              viewBox="0 0 100 100"
              fill="none"
              className="drop-shadow-[0_10px_25px_rgba(255,164,28,0.4)]"
            >
              <defs>
                <linearGradient id="bellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFAE34" />
                  <stop offset="50%" stopColor="#FFA41C" />
                  <stop offset="100%" stopColor="#D97A08" />
                </linearGradient>
              </defs>
              {/* Handle knob */}
              <circle cx="50" cy="18" r="7" fill="#FFA41C" />
              <rect x="47" y="24" width="6" height="6" rx="2" fill="#E8992A" />
              {/* Dome */}
              <path
                d="M20 54 C20 30, 80 30, 80 54 Z"
                fill="url(#bellGrad)"
              />
              {/* Base Rim */}
              <rect x="14" y="54" width="72" height="8" rx="4" fill="#FFFBF5" />
              {/* Clapper / bell ring bottom */}
              <circle cx="50" cy="65" r="4.5" fill="#FFA41C" />
            </svg>

            <span className="mt-4 font-mono text-xs text-[#FFA41C] tracking-widest font-black uppercase animate-pulse">
              🔔 Ringing...
            </span>
          </div>
        )}

        {/* ========================================================= */}
        {/* PHASE 2: SPEED DASH / SPRINTING (0.7s - 1.4s) */}
        {/* ========================================================= */}
        {phase === 'dashing' && (
          <div className="relative w-full flex items-center justify-center animate-intro-dash">
            {/* Supersonic speed trails / lines behind the bell */}
            <div className="absolute right-full mr-2 flex flex-col gap-2 opacity-90">
              <div className="w-20 h-1.5 bg-gradient-to-l from-[#FFA41C] to-transparent rounded-full" />
              <div className="w-32 h-2.5 bg-gradient-to-l from-[#FF6B00] to-transparent rounded-full shadow-[0_0_12px_#FFA41C]" />
              <div className="w-16 h-1 bg-gradient-to-l from-[#FFA41C] to-transparent rounded-full" />
            </div>

            {/* Dashing Bell tilted forward with motion blur */}
            <div className="transform -rotate-12 scale-110 flex flex-col items-center">
              <svg
                width="110"
                height="110"
                viewBox="0 0 100 100"
                fill="none"
                className="drop-shadow-[0_15px_30px_rgba(255,107,0,0.6)]"
              >
                <defs>
                  <linearGradient id="dashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFAE34" />
                    <stop offset="100%" stopColor="#FF6B00" />
                  </linearGradient>
                </defs>
                {/* Motion lines on the bell body */}
                <rect x="2" y="32" width="22" height="4.5" rx="2.2" fill="#FFA41C" />
                <rect x="6" y="48" width="18" height="4" rx="2" fill="#FFA41C" />
                {/* Handle */}
                <circle cx="50" cy="18" r="7" fill="#FFA41C" />
                <rect x="47" y="24" width="6" height="6" rx="2" fill="#FFA41C" />
                {/* Dome */}
                <path
                  d="M20 54 C20 30, 80 30, 80 54 Z"
                  fill="url(#dashGrad)"
                />
                {/* Base Rim */}
                <rect x="14" y="54" width="72" height="8" rx="4" fill="#FFFBF5" />
                {/* Speed wheels / energetic sprint feet */}
                <circle cx="34" cy="67" r="5.5" fill="#FFA41C" className="animate-spin" />
                <circle cx="66" cy="67" r="5.5" fill="#FFA41C" className="animate-spin" />
              </svg>
            </div>

            <div className="absolute -bottom-8 font-mono text-xs font-black text-[#FFA41C] tracking-widest uppercase">
              ⚡ FAST SPEED...
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PHASE 3 & 4: BRAND IMPACT & REVEAL (1.4s - 2.6s) */}
        {/* ========================================================= */}
        {(phase === 'revealing' || phase === 'exiting') && (
          <div className="flex flex-col items-center text-center animate-intro-brand-reveal px-4">
            {/* Brand Logo Symbol */}
            <div className="relative mb-3">
              <div className="absolute inset-0 bg-[#FFA41C] rounded-full blur-xl opacity-40 animate-pulse" />
              <svg
                width="84"
                height="84"
                viewBox="0 0 100 100"
                fill="none"
                className="relative drop-shadow-[0_8px_20px_rgba(255,164,28,0.5)]"
              >
                <defs>
                  <linearGradient id="revealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFA41C" />
                    <stop offset="100%" stopColor="#E8992A" />
                  </linearGradient>
                  <linearGradient id="revealCloche" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFAE34" />
                    <stop offset="100%" stopColor="#D97A08" />
                  </linearGradient>
                </defs>

                {/* Speed motion lines on left */}
                <rect x="6" y="26" width="22" height="5" rx="2.5" fill="#FFA41C" />
                <rect x="2" y="44" width="26" height="6.5" rx="3.25" fill="#FFA41C" />
                <rect x="8" y="62" width="20" height="5" rx="2.5" fill="#FFA41C" />

                {/* Top Cloche */}
                <circle cx="70" cy="12" r="4.5" fill="#FFA41C" />
                <path d="M50 25 C50 14, 90 14, 90 25 Z" fill="url(#revealCloche)" />
                <rect x="47" y="25" width="46" height="5" rx="2.5" fill="#FFFFFF" />

                {/* Alarm Clock Body */}
                <circle cx="62" cy="58" r="30" fill="#FFFFFF" stroke="#241F1A" strokeWidth="6.5" />
                <circle cx="62" cy="58" r="22" fill="#241F1A" />
                <line x1="62" y1="58" x2="62" y2="42" stroke="#FFA41C" strokeWidth="4" strokeLinecap="round" />
                <line x1="62" y1="58" x2="48" y2="50" stroke="#FFA41C" strokeWidth="4" strokeLinecap="round" />
                <circle cx="62" cy="58" r="3.5" fill="#FFFFFF" />
              </svg>
            </div>

            {/* Brand Title */}
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight flex items-baseline gap-1">
              <span className="bg-gradient-to-r from-[#FFA41C] via-[#FF8A00] to-[#FF5500] bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(255,164,28,0.4)]">
                FAST
              </span>
              <span className="text-[#FFFBF5]">Order</span>
            </h1>

            {/* Tagline */}
            <p className="mt-2 text-xs sm:text-sm font-mono tracking-[0.25em] text-[#FFFBF5]/70 uppercase font-semibold">
              ORDER • WAIT • ENJOY
            </p>

            {/* Arabic Slogan Badge */}
            <div className="mt-4 inline-flex items-center gap-2 bg-[#FFA41C]/15 border border-[#FFA41C]/30 rounded-full px-4 py-1.5 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#FFA41C] animate-ping" />
              <span className="text-xs font-bold text-[#FFA41C]" dir="rtl">
                أسرع طلب في حرم جامعتك ⚡
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Embedded CSS Animations */}
      <style jsx>{`
        @keyframes bellRingKeyframes {
          0% {
            transform: rotate(0deg) scale(0.9);
          }
          15% {
            transform: rotate(-14deg) scale(1.05);
          }
          30% {
            transform: rotate(14deg) scale(1.05);
          }
          45% {
            transform: rotate(-10deg) scale(1.02);
          }
          60% {
            transform: rotate(10deg) scale(1.02);
          }
          75% {
            transform: rotate(-5deg) scale(1);
          }
          100% {
            transform: rotate(0deg) scale(1);
          }
        }

        @keyframes dashKeyframes {
          0% {
            transform: translateX(-120px) scale(0.85) skewX(-12deg);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          50% {
            transform: translateX(0px) scale(1.1) skewX(-18deg);
          }
          80% {
            transform: translateX(60px) scale(1.05) skewX(-10deg);
            opacity: 1;
          }
          100% {
            transform: translateX(140px) scale(0.9) skewX(-5deg);
            opacity: 0.8;
          }
        }

        @keyframes brandRevealKeyframes {
          0% {
            transform: scale(0.7) translateY(15px);
            opacity: 0;
            filter: blur(8px);
          }
          60% {
            transform: scale(1.05) translateY(-3px);
            opacity: 1;
            filter: blur(0px);
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }

        @keyframes pingSlow {
          0% {
            transform: scale(0.8);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.3);
            opacity: 1;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }

        :global(.animate-intro-bell-ring) {
          animation: bellRingKeyframes 0.7s cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite;
        }

        :global(.animate-intro-dash) {
          animation: dashKeyframes 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        :global(.animate-intro-brand-reveal) {
          animation: brandRevealKeyframes 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        :global(.animate-ping-slow) {
          animation: pingSlow 0.6s ease-out infinite;
        }
      `}</style>
    </div>
  );
};

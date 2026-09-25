'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Trophy, ChevronLeft } from 'lucide-react';
import { useLeagueStore } from '@/stores/useLeagueStore';

/**
 * FastOrder League widget shown on the student home page.
 * Compact, perfectly scaled for mobile & desktop, adhering to Sphinx brand identity.
 */
export const LeagueWidget: React.FC = () => {
  const { currentData, fetchCurrentLeaderboard, isLoadingLeaderboard } = useLeagueStore();

  useEffect(() => {
    if (!currentData) {
      fetchCurrentLeaderboard(1, 3);
    }
  }, [currentData, fetchCurrentLeaderboard]);

  const season = currentData?.season;
  const stats = currentData?.studentStats;

  // Don't render if no active season and done loading
  if (!season && !isLoadingLeaderboard) return null;

  // Compact loading skeleton
  if (isLoadingLeaderboard && !currentData) {
    return (
      <div className="bg-surface border border-line/70 rounded-2xl p-3 sm:p-3.5 animate-pulse shadow-warm">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-line/30 flex-shrink-0" />
            <div className="space-y-1.5">
              <div className="h-3.5 bg-line/30 rounded w-28" />
              <div className="h-2.5 bg-line/20 rounded w-36" />
            </div>
          </div>
          <div className="w-16 h-7 bg-line/20 rounded-lg flex-shrink-0" />
        </div>
      </div>
    );
  }

  if (!season) return null;

  return (
    <Link
      href="/student/league"
      className="block bg-surface border border-line/80 hover:border-primary/60 rounded-2xl p-3 sm:p-3.5 shadow-warm hover:shadow-ticket transition-all duration-200 group relative select-none"
      aria-label="FastOrder League - عرض الترتيب والجوائز"
    >
      <div className="flex items-center justify-between gap-2.5">
        {/* Right side: Icon + Content (RTL) */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Trophy Badge in Sphinx Gold */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary text-primary-ink flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-200">
            <Trophy className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.2]" />
          </div>

          <div className="min-w-0">
            {/* Title & Season Name */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h3 className="font-display font-bold text-sm sm:text-base text-ink group-hover:text-primary transition-colors whitespace-nowrap leading-tight">
                FastOrder League
              </h3>
              <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold font-body bg-primary-soft text-primary-ink border border-primary/20 whitespace-nowrap leading-none">
                {season.name}
              </span>
            </div>

            {/* Subtitle / Points - Short, crystal clear, never clipped */}
            {stats && (stats.totalPoints > 0 || stats.rank) ? (
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1 font-mono text-[11px] sm:text-xs font-bold text-ink bg-canvas px-2 py-0.5 rounded-lg border border-line/60">
                  <span className="font-body text-ink-soft">رصيدك:</span>
                  <strong className="text-primary font-mono font-mono-nums">{stats.totalPoints}</strong>
                  <span className="font-body text-ink-soft">نقطة</span>
                </span>
                {stats.rank && (
                  <span className="inline-flex items-center font-body text-[11px] sm:text-xs font-bold text-accent bg-accent-soft px-2 py-0.5 rounded-lg border border-accent/20">
                    المركز #{stats.rank}
                  </span>
                )}
              </div>
            ) : (
              <p className="font-body text-[11px] sm:text-xs text-ink-soft mt-0.5 leading-snug">
                تنافس واكسب جوائز مع كل طلب
              </p>
            )}
          </div>
        </div>

        {/* Left side: Compact Action Button (RTL) */}
        <div className="flex items-center gap-1 text-primary-ink font-body text-xs font-bold bg-primary-soft px-2.5 py-1.5 rounded-xl group-hover:bg-primary transition-colors flex-shrink-0 mr-auto whitespace-nowrap">
          <span>عرض الترتيب</span>
          <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
};

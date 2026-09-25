'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useLeagueStore } from '@/stores/useLeagueStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Trophy, Medal, Crown, Star, Clock, ChevronDown, Award, Users, TrendingUp, Info, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function formatTimeLeft(endsAt: string): string {
  const now = new Date().getTime();
  const end = new Date(endsAt).getTime();
  const diff = end - now;

  if (diff <= 0) return 'انتهى';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days} يوم ${hours} ساعة`;
  if (hours > 0) return `${hours} ساعة ${mins} دقيقة`;
  return `${mins} دقيقة`;
}

function formatEGP(piasters: number): string {
  return `${(piasters / 100).toFixed(0)} ج.م`;
}

/** Rank medal styles — no emoji, use Lucide icons and colored badges */
function getRankStyle(rank: number) {
  switch (rank) {
    case 1:
      return {
        bg: 'bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500',
        text: 'text-amber-900',
        border: 'ring-2 ring-amber-400/60',
        label: 'المركز الأول',
        icon: Crown,
        size: 'w-20 h-20',
        podiumHeight: 'h-28',
      };
    case 2:
      return {
        bg: 'bg-gradient-to-br from-slate-300 via-gray-200 to-slate-400',
        text: 'text-slate-700',
        border: 'ring-2 ring-slate-300/60',
        label: 'المركز الثاني',
        icon: Medal,
        size: 'w-16 h-16',
        podiumHeight: 'h-20',
      };
    case 3:
      return {
        bg: 'bg-gradient-to-br from-orange-400 via-amber-600 to-orange-700',
        text: 'text-orange-950',
        border: 'ring-2 ring-orange-400/60',
        label: 'المركز الثالث',
        icon: Medal,
        size: 'w-16 h-16',
        podiumHeight: 'h-14',
      };
    default:
      return {
        bg: 'bg-canvas',
        text: 'text-ink',
        border: '',
        label: `#${rank}`,
        icon: null,
        size: 'w-10 h-10',
        podiumHeight: '',
      };
  }
}

export default function LeaguePage() {
  const { student } = useAuthStore();
  const {
    currentData,
    hallOfFame,
    isLoadingLeaderboard,
    isLoadingHallOfFame,
    fetchCurrentLeaderboard,
    fetchHallOfFame,
  } = useLeagueStore();

  const [activeTab, setActiveTab] = useState<'leaderboard' | 'hallOfFame'>('leaderboard');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchCurrentLeaderboard(1, 50);
  }, [fetchCurrentLeaderboard]);

  useEffect(() => {
    if (activeTab === 'hallOfFame' && hallOfFame.length === 0) {
      fetchHallOfFame();
    }
  }, [activeTab, hallOfFame.length, fetchHallOfFame]);

  const season = currentData?.season;
  const leaderboard = currentData?.leaderboard || [];
  const studentStats = currentData?.studentStats;
  const top3 = leaderboard.slice(0, 3);
  const restOfList = leaderboard.slice(3);

  // Reorder for podium display: [2nd, 1st, 3rd]
  const podiumOrder = useMemo(() => {
    if (top3.length < 3) return top3;
    return [top3[1], top3[0], top3[2]];
  }, [top3]);

  const noSeason = !season;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="pb-3 border-b border-line/60">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-primary text-primary-ink flex items-center justify-center shadow-sm">
            <Trophy className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl text-ink">
              FastOrder League
            </h2>
            <p className="font-body text-xs text-ink-soft mt-0.5">
              اطلب وجبتك واكسب نقاط وتنافس مع زملائك على جوائز المراكز الأولى
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-canvas border border-line/70 rounded-2xl p-1.5 shadow-xs">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-body font-bold transition-all ${
            activeTab === 'leaderboard'
              ? 'bg-surface text-ink shadow-warm border border-line/50'
              : 'text-ink-soft hover:text-ink hover:bg-surface/50'
          }`}
        >
          لوحة الصدارة
        </button>
        <button
          onClick={() => setActiveTab('hallOfFame')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-body font-bold transition-all ${
            activeTab === 'hallOfFame'
              ? 'bg-surface text-ink shadow-warm border border-line/50'
              : 'text-ink-soft hover:text-ink hover:bg-surface/50'
          }`}
        >
          قاعة الشرف
        </button>
      </div>

      {activeTab === 'leaderboard' ? (
        <>
          {noSeason ? (
            /* Empty State — No Active Season */
            <div className="bg-surface border border-line/80 rounded-2xl sm:rounded-3xl p-8 text-center shadow-warm">
              <div className="w-16 h-16 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mx-auto mb-4 border border-primary/20">
                <Trophy className="w-8 h-8 stroke-[2.2]" />
              </div>
              <h3 className="font-display font-bold text-xl text-ink mb-2">
                لا يوجد موسم نشط حالياً
              </h3>
              <p className="font-body text-sm text-ink-soft mb-6 max-w-sm mx-auto">
                FastOrder League هو نظام نقاط ومنافسة موسمية تكافئك على كل طلب. اطلب من كشك الحرم الجامعي واكسب نقاطاً تلقائياً عند استلام طلبك.
              </p>

              {/* Points Rules Explanation */}
              <div className="bg-canvas rounded-xl p-4 text-right space-y-3">
                <h4 className="font-display font-bold text-sm text-ink flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  نظام النقاط
                </h4>
                <div className="space-y-2 text-xs font-body text-ink-soft">
                  <div className="flex items-center justify-between bg-surface rounded-lg px-3 py-2">
                    <span>أوردر أقل من 100 ج.م</span>
                    <span className="font-bold text-primary">+1 نقطة</span>
                  </div>
                  <div className="flex items-center justify-between bg-surface rounded-lg px-3 py-2">
                    <span>أوردر من 100 إلى 199 ج.م</span>
                    <span className="font-bold text-primary">+2 نقطة</span>
                  </div>
                  <div className="flex items-center justify-between bg-surface rounded-lg px-3 py-2">
                    <span>أوردر 200 ج.م أو أكثر</span>
                    <span className="font-bold text-primary">+3 نقاط</span>
                  </div>
                  <div className="flex items-center justify-between bg-primary-soft rounded-lg px-3 py-2">
                    <span>أول أوردر لك على الإطلاق</span>
                    <span className="font-bold text-primary">+5 نقاط</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Season Info Banner */}
              <div className="bg-surface border border-line/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-warm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-body bg-primary-soft text-primary-ink border border-primary/20 mb-1 inline-block">
                      الموسم الحالي
                    </span>
                    <h3 className="font-display font-bold text-lg text-ink">{season.name}</h3>
                  </div>
                  <div className="text-left">
                    <p className="font-body text-xs text-ink-soft">باقي على الانتهاء</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="font-mono text-sm font-bold text-primary font-mono-nums">
                        {formatTimeLeft(season.endsAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Podium — Top 3 */}
              {top3.length > 0 && (
                <div className="bg-surface border border-line/80 rounded-2xl sm:rounded-3xl p-5 shadow-warm">
                  <div className="flex items-center justify-center gap-4 sm:gap-8 pt-4">
                    {podiumOrder.map((entry) => {
                      if (!entry) return null;
                      const style = getRankStyle(entry.rank);
                      const IconComp = style.icon;
                      const isFirst = entry.rank === 1;

                      return (
                        <div
                          key={entry.studentId}
                          className={`flex flex-col items-center gap-2 ${isFirst ? '-mt-4' : 'mt-4'}`}
                        >
                          {/* Avatar/Medal */}
                          <div className={`relative ${style.size} rounded-full ${style.bg} ${style.border} flex items-center justify-center shadow-warm`}>
                            {IconComp && (
                              <IconComp className={`${isFirst ? 'w-8 h-8' : 'w-6 h-6'} ${style.text}`} />
                            )}
                            <div className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-primary text-primary-ink text-xs font-bold flex items-center justify-center shadow-md font-mono">
                              {entry.rank}
                            </div>
                          </div>

                          {/* Name + Points */}
                          <div className="text-center">
                            <p className={`font-body font-bold text-ink ${isFirst ? 'text-sm' : 'text-xs'} truncate max-w-[100px]`}>
                              {entry.studentName.split(' ')[0]}
                            </p>
                            <p className="font-mono text-xs text-primary font-bold font-mono-nums">
                              {entry.totalPoints} نقطة
                            </p>
                          </div>

                          {/* Podium Bar */}
                          <div className={`w-16 sm:w-20 ${style.podiumHeight} rounded-t-xl ${style.bg} opacity-35`} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Student's Own Rank Card (if not in top 3) */}
              {studentStats && studentStats.rank && studentStats.rank > 3 && (
                <div className="bg-primary-soft border border-primary/20 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="font-mono text-sm font-bold text-primary-ink">
                          #{studentStats.rank}
                        </span>
                      </div>
                      <div>
                        <p className="font-body text-xs text-ink-soft">ترتيبك الحالي</p>
                        <p className="font-display font-bold text-ink">
                          {studentStats.totalPoints} نقطة
                          <span className="font-body text-xs text-ink-soft font-normal mr-2">
                            ({studentStats.ordersCount} طلب)
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      {studentStats.isEligibleForPrize ? (
                        <span className="inline-flex items-center gap-1 text-xs font-body font-semibold text-accent bg-accent-soft px-2 py-1 rounded-lg">
                          <Award className="w-3 h-3" />
                          مؤهل للجائزة
                        </span>
                      ) : (
                        <span className="text-xs font-body text-ink-soft">
                          {season.minOrdersForPrize - studentStats.ordersCount} طلب متبقي للتأهل
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Student's stats if rank is in top 3 */}
              {studentStats && studentStats.rank && studentStats.rank <= 3 && (
                <div className="bg-gradient-to-l from-primary/10 to-primary-soft border border-primary/20 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-body text-xs text-ink-soft">أنت في المراكز الأولى</p>
                      <p className="font-display font-bold text-ink">
                        المركز #{studentStats.rank} — {studentStats.totalPoints} نقطة
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Ranked List (4th and below) */}
              {restOfList.length > 0 && (
                <div className="bg-surface border border-line/50 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-line/30 flex items-center gap-2">
                    <Users className="w-4 h-4 text-ink-soft" />
                    <span className="font-body text-sm font-semibold text-ink">الترتيب الكامل</span>
                    <span className="text-xs text-ink-soft font-body mr-auto">
                      {currentData?.total || 0} طالب
                    </span>
                  </div>

                  <div className="divide-y divide-line/20">
                    {restOfList.map((entry) => (
                      <div
                        key={entry.studentId}
                        className={`flex items-center gap-3 px-4 py-3 hover:bg-canvas/50 transition-colors ${
                          entry.studentId === student?.id ? 'bg-primary-soft/30' : ''
                        }`}
                      >
                        <span className="w-8 text-center font-mono text-sm font-bold text-ink-soft">
                          {entry.rank}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-line/30 flex items-center justify-center text-xs font-bold text-ink-soft">
                          {entry.studentName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm text-ink truncate">
                            {entry.studentName}
                            {entry.studentId === student?.id && (
                              <span className="text-xs text-primary font-semibold mr-1">(أنت)</span>
                            )}
                          </p>
                          <p className="font-body text-xs text-ink-soft">
                            {entry.ordersCount} طلب
                          </p>
                        </div>
                        <div className="text-left">
                          <span className="font-mono text-sm font-bold text-primary">
                            {entry.totalPoints}
                          </span>
                          <span className="text-xs text-ink-soft font-body mr-1">نقطة</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty leaderboard */}
              {leaderboard.length === 0 && !isLoadingLeaderboard && (
                <div className="bg-surface border border-line/50 rounded-2xl p-8 text-center">
                  <TrendingUp className="w-10 h-10 text-line mx-auto mb-3" />
                  <h3 className="font-display font-bold text-lg text-ink mb-1">
                    الموسم بدأ للتو
                  </h3>
                  <p className="font-body text-sm text-ink-soft">
                    لا يوجد متسابقين بعد. كن أول من يكسب نقاط!
                  </p>
                </div>
              )}

              {/* Points Rules (collapsible) */}
              <details className="bg-surface border border-line/50 rounded-2xl group">
                <summary className="px-4 py-3 cursor-pointer flex items-center justify-between font-body text-sm font-semibold text-ink hover:bg-canvas/50 transition-colors rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    كيف يتم احتساب النقاط؟
                  </div>
                  <ChevronDown className="w-4 h-4 text-ink-soft group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-4 pb-4 space-y-2">
                  <div className="text-xs font-body text-ink-soft space-y-1.5">
                    <div className="flex items-center justify-between bg-canvas rounded-lg px-3 py-2">
                      <span>أوردر أقل من {formatEGP(season.tier1MaxPiasters)}</span>
                      <span className="font-bold text-primary">+1 نقطة</span>
                    </div>
                    <div className="flex items-center justify-between bg-canvas rounded-lg px-3 py-2">
                      <span>أوردر من {formatEGP(season.tier1MaxPiasters)} إلى {formatEGP(season.tier2MaxPiasters - 100)}</span>
                      <span className="font-bold text-primary">+2 نقطة</span>
                    </div>
                    <div className="flex items-center justify-between bg-canvas rounded-lg px-3 py-2">
                      <span>أوردر {formatEGP(season.tier2MaxPiasters)} أو أكثر</span>
                      <span className="font-bold text-primary">+3 نقاط</span>
                    </div>
                    <div className="flex items-center justify-between bg-primary-soft rounded-lg px-3 py-2">
                      <span>أول أوردر لك على الإطلاق</span>
                      <span className="font-bold text-primary">+{season.firstOrderPoints} نقاط</span>
                    </div>
                    <div className="mt-2 p-2 bg-danger-soft rounded-lg text-danger text-xs">
                      للتأهل للجائزة يجب إتمام {season.minOrdersForPrize} طلبات على الأقل خلال الموسم.
                    </div>
                  </div>
                </div>
              </details>
            </>
          )}
        </>
      ) : (
        /* Hall of Fame Tab */
        <div className="space-y-4">
          {isLoadingHallOfFame ? (
            <div className="bg-surface border border-line/50 rounded-2xl p-8 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-body text-sm text-ink-soft mt-3">جاري التحميل...</p>
            </div>
          ) : hallOfFame.length === 0 ? (
            <div className="bg-surface border border-line/50 rounded-2xl p-8 text-center">
              <Award className="w-10 h-10 text-line mx-auto mb-3" />
              <h3 className="font-display font-bold text-lg text-ink mb-1">
                لا توجد مواسم سابقة
              </h3>
              <p className="font-body text-sm text-ink-soft">
                سيظهر هنا سجل الفائزين بعد انتهاء أول موسم.
              </p>
            </div>
          ) : (
            hallOfFame.map((season) => (
              <div key={season.id} className="bg-surface border border-line/50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-bold text-base text-ink">{season.name}</h3>
                  <span className="font-body text-xs text-ink-soft">
                    {new Date(season.endsAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>

                {season.winners.length === 0 ? (
                  <p className="font-body text-sm text-ink-soft">لا يوجد فائزين</p>
                ) : (
                  <div className="space-y-2">
                    {season.winners.map((winner) => {
                      const style = getRankStyle(winner.rank);
                      return (
                        <div
                          key={winner.studentId}
                          className="flex items-center gap-3 bg-canvas rounded-xl px-3 py-2"
                        >
                          <div className={`w-8 h-8 rounded-full ${style.bg} flex items-center justify-center`}>
                            <span className={`text-xs font-bold ${style.text}`}>{winner.rank}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-body text-sm text-ink font-semibold truncate">
                              {winner.studentName}
                            </p>
                          </div>
                          <span className="font-mono text-sm font-bold text-primary">
                            {winner.totalPoints} نقطة
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoadingLeaderboard && activeTab === 'leaderboard' && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-surface border border-line/30 rounded-2xl p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-line/30" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-line/30 rounded w-24" />
                  <div className="h-2 bg-line/20 rounded w-16" />
                </div>
                <div className="h-4 bg-line/30 rounded w-12" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

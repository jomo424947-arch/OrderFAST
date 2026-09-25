import React from 'react';
import Link from 'next/link';
import { Trophy, Sparkles, ChevronLeft, Award, Flame } from 'lucide-react';
import { Order } from '@/types';
import { getOrderPointsDetails, formatPointsArabic } from '@/lib/leagueHelper';
import { useLeagueStore } from '@/stores/useLeagueStore';

export interface OrderLeagueEarnedCardProps {
  order: Order;
  className?: string;
}

/**
 * Celebratory League Points Card shown immediately after order completion / receipt.
 * Positioned right after the completed order timeline and before the rating card (Image 2).
 */
export const OrderLeagueEarnedCard: React.FC<OrderLeagueEarnedCardProps> = ({
  order,
  className = '',
}) => {
  const { currentData } = useLeagueStore();
  const details = getOrderPointsDetails(
    order,
    currentData?.season,
    currentData?.studentStats
  );

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border-2 border-primary/40 bg-gradient-to-br from-primary-soft/90 via-surface to-amber-500/10 p-5 sm:p-6 shadow-ticket transition-all duration-300 animate-in slide-in-from-bottom-3 ${className}`}
    >
      {/* Decorative Background Trophy Watermark */}
      <div className="absolute -left-5 -bottom-6 text-primary/10 pointer-events-none select-none">
        <Trophy className="w-36 h-36 stroke-[1.2]" />
      </div>

      <div className="relative z-10 space-y-4">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1.5 bg-primary/20 text-primary-ink px-3 py-1 rounded-full text-xs font-bold font-body">
            <Sparkles className="w-3.5 h-3.5 text-primary-ink" />
            <span>مكافأة دوري FastOrder</span>
          </div>

          <span className="text-[11px] font-bold text-ink-soft bg-canvas/80 border border-line/60 px-2.5 py-0.5 rounded-full">
            {details.seasonName}
          </span>
        </div>

        {/* Main Points & Celebration Message */}
        <div className="flex items-center gap-4">
          {/* Glowing Points Circular Badge */}
          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-primary to-amber-400 text-primary-ink flex flex-col items-center justify-center flex-shrink-0 shadow-warm transform -rotate-2 hover:rotate-0 transition-transform">
            <span className="font-mono text-xl sm:text-2xl font-black font-mono-nums leading-none tracking-tight">
              +{details.points}
            </span>
            <span className="font-body text-[10px] sm:text-[11px] font-bold mt-0.5 leading-none">
              {details.points === 1 ? 'نقطة' : 'نقاط'}
            </span>
          </div>

          {/* Text Content */}
          <div className="min-w-0 flex-1">
            <h4 className="font-display font-black text-base sm:text-lg text-ink leading-snug">
              {details.isFirstOrder
                ? `🎉 مبروك! حصلت على +${details.points} نقاط ترحيبية!`
                : `🎉 حصلت على +${details.points} ${details.points === 1 ? 'نقطة' : 'نقاط'} في الدوري!`}
            </h4>
            <p className="font-body text-xs text-ink-soft mt-1 leading-relaxed">
              تمت إضافة النقاط بنجاح إلى رصيدك في دوري الحرم الجامعي بعد استلام الأوردر.
            </p>
          </div>
        </div>

        {/* Student Stats Badges Strip */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {details.rank && (
            <div className="inline-flex items-center gap-1.5 bg-accent-soft text-accent border border-accent/20 px-3 py-1 rounded-xl text-xs font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>ترتيبك الحالي: المركز #{details.rank}</span>
            </div>
          )}

          {details.totalPoints !== null && details.totalPoints > 0 && (
            <div className="inline-flex items-center gap-1.5 bg-canvas border border-line text-ink px-3 py-1 rounded-xl text-xs font-bold">
              <Flame className="w-3.5 h-3.5 text-primary" />
              <span>إجمالي نقاطك: <strong className="font-mono font-mono-nums text-primary">{details.totalPoints}</strong> نقطة</span>
            </div>
          )}
        </div>

        {/* Action Link to League Leaderboard */}
        <Link
          href="/student/league"
          className="group flex items-center justify-between bg-surface border border-primary/30 hover:border-primary/70 hover:bg-primary-soft/50 rounded-2xl p-3 text-xs font-body font-bold text-ink transition-all shadow-xs"
        >
          <div className="flex items-center gap-2 text-primary-ink">
            <Trophy className="w-4 h-4 text-primary flex-shrink-0" />
            <span>عرض ترتيبك في الدوري والجوائز المتاحة</span>
          </div>
          <ChevronLeft className="w-4 h-4 text-primary group-hover:-translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

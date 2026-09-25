import React from 'react';
import Link from 'next/link';
import { Trophy, Gift, Sparkles, ChevronLeft, Info } from 'lucide-react';
import { Order } from '@/types';
import { getOrderPointsDetails } from '@/lib/leagueHelper';
import { useLeagueStore } from '@/stores/useLeagueStore';

export interface OrderLeagueRewardPreviewProps {
  order: Order;
  className?: string;
}

/**
 * Gamification Reward Preview banner shown during active order tracking.
 * Informs the student of the league points they will receive upon order pickup (Image 3).
 * Placed right above the Order Ticket.
 */
export const OrderLeagueRewardPreview: React.FC<OrderLeagueRewardPreviewProps> = ({
  order,
  className = '',
}) => {
  const { currentData } = useLeagueStore();
  const details = getOrderPointsDetails(
    order,
    currentData?.season,
    currentData?.studentStats
  );

  // If daily cap is reached, show informative notice
  if (details.dailyCapReached) {
    return (
      <div
        className={`bg-canvas border border-line rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs font-body shadow-xs ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-line/40 text-ink-soft flex items-center justify-center flex-shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-ink block">الحد اليومي لنقاط الدوري مكتمل</span>
            <span className="text-[11px] text-ink-soft">
              أكملت الحد الأقصى للنقاط اليومية (3 طلبات). استمتع بطلبك!
            </span>
          </div>
        </div>

        <Link
          href="/student/league"
          className="text-primary-ink font-bold text-[11px] bg-primary-soft hover:bg-primary px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors flex-shrink-0"
        >
          <span>الدوري</span>
          <ChevronLeft className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-r from-primary-soft/95 via-surface to-amber-500/10 p-3.5 sm:p-4 shadow-warm transition-all duration-200 group ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Right side: Icon + Points information */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Animated Trophy / Gift Box Icon */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-primary to-amber-400 text-primary-ink flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            {details.isFirstOrder ? (
              <Gift className="w-5 h-5 animate-bounce stroke-[2.2]" />
            ) : (
              <Trophy className="w-5 h-5 stroke-[2.2]" />
            )}
          </div>

          <div className="min-w-0">
            {/* Header with points to be earned */}
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-display font-black text-sm sm:text-base text-ink leading-tight">
                {details.isFirstOrder ? (
                  <>ستحصل على <strong className="font-mono text-primary font-mono-nums">+{details.points}</strong> نقاط ترحيبية! 🎁</>
                ) : (
                  <>ستحصل على <strong className="font-mono text-primary font-mono-nums">+{details.points}</strong> {details.points === 1 ? 'نقطة' : 'نقاط'} في الدوري 🏆</>
                )}
              </h4>
            </div>

            {/* Subtitle explaining condition */}
            <p className="font-body text-[11px] sm:text-xs text-ink-soft mt-0.5 leading-snug">
              {details.isFirstOrder
                ? 'مكافأة خاصة بأول أوردر لك! ستُضاف فوراً عند استلامك الطلب من الكشك.'
                : `تُضاف تلقائياً إلى ترتيبك في ${details.seasonName} فور استلام طلبك.`}
            </p>
          </div>
        </div>

        {/* Left side: Quick Link to League */}
        <Link
          href="/student/league"
          className="flex items-center gap-1 text-primary-ink font-body text-xs font-bold bg-primary hover:bg-primary-hover px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl transition-colors flex-shrink-0 mr-auto shadow-xs whitespace-nowrap"
          aria-label="عرض الترتيب في دوري FastOrder"
        >
          <span>عرض الترتيب</span>
          <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

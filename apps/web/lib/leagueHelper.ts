import { Order } from '@/types';
import { LeagueSeason, StudentLeagueStats } from './services/leagueService';

export interface OrderPointsDetails {
  points: number;
  seasonName: string;
  rank: number | null;
  totalPoints: number | null;
  isFirstOrder: boolean;
  dailyCapReached: boolean;
}

/**
 * Calculates or extracts league reward points for an order.
 * Works seamlessly with server-provided league info, while providing
 * an instant, rock-solid client-side fallback matching business rules.
 */
export function getOrderPointsDetails(
  order: Order,
  season?: LeagueSeason | null,
  studentStats?: StudentLeagueStats | null
): OrderPointsDetails {
  // If order already has authoritative backend league info, prioritize it
  if (order.league) {
    const isCompleted = order.status === 'COMPLETED';
    const points = isCompleted
      ? (order.league.earnedPoints ?? order.league.potentialPoints ?? 1)
      : (order.league.potentialPoints ?? 1);

    return {
      points: Math.max(1, points),
      seasonName: order.league.seasonName || season?.name || 'دوري FastOrder 2026',
      rank: order.league.currentRank ?? studentStats?.rank ?? null,
      totalPoints: order.league.totalPoints ?? studentStats?.totalPoints ?? null,
      isFirstOrder: !!order.league.isFirstOrder,
      dailyCapReached: !!order.league.dailyCapReached,
    };
  }

  // Fallback calculation using order details + season / student stats
  const isFirstOrder = (studentStats?.ordersCount ?? 0) === 0;
  const firstOrderPoints = season?.firstOrderPoints ?? 5;
  const tier1MaxEgp = (season?.tier1MaxPiasters ?? 10000) / 100; // 100 EGP
  const tier2MaxEgp = (season?.tier2MaxPiasters ?? 20000) / 100; // 200 EGP

  let points = 1;
  if (isFirstOrder) {
    points = firstOrderPoints;
  } else if (order.total < tier1MaxEgp) {
    points = 1;
  } else if (order.total < tier2MaxEgp) {
    points = 2;
  } else {
    points = 3;
  }

  return {
    points,
    seasonName: season?.name || 'الموسم الأول 2026',
    rank: studentStats?.rank ?? null,
    totalPoints: studentStats?.totalPoints ?? null,
    isFirstOrder,
    dailyCapReached: false,
  };
}

export function formatPointsArabic(points: number): string {
  if (points === 1) return 'نقطة واحدة';
  if (points === 2) return 'نقطتان';
  if (points >= 3 && points <= 10) return `${points} نقاط`;
  return `${points} نقطة`;
}

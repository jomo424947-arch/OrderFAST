import { apiClient } from '@/lib/api/client';

export interface LeagueSeason {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  status: 'upcoming' | 'active' | 'ended';
  minOrdersForPrize: number;
  tier1MaxPiasters: number;
  tier2MaxPiasters: number;
  firstOrderPoints: number;
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  totalPoints: number;
  ordersCount: number;
  lastPointAt: string | null;
  studentName: string;
  avatarUrl: string | null;
}

export interface StudentLeagueStats {
  rank: number | null;
  totalPoints: number;
  ordersCount: number;
  lifetimePoints: number;
  minOrdersForPrize: number;
  isEligibleForPrize: boolean;
}

export interface CurrentLeagueData {
  season: LeagueSeason | null;
  leaderboard: LeaderboardEntry[];
  studentStats: StudentLeagueStats | null;
  total: number;
}

export interface StudentDetailedStats {
  currentSeason: {
    seasonId: string;
    seasonName: string;
    endsAt: string;
    rank: number | null;
    totalPoints: number;
    ordersCount: number;
    minOrdersForPrize: number;
    isEligibleForPrize: boolean;
  } | null;
  lifetimePoints: number;
  recentPoints: Array<{
    points: number;
    reason: string;
    createdAt: string;
    orderId: string;
  }>;
  wonPrizes: Array<{
    seasonName: string;
    rank: number;
    description: string;
    claimedAt: string | null;
  }>;
}

export interface PastSeasonWithWinners {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  status: string;
  winners: Array<{
    rank: number;
    studentId: string;
    totalPoints: number;
    studentName: string;
    avatarUrl: string | null;
  }>;
}

export const leagueService = {
  getCurrentLeaderboard: (page = 1, limit = 20) =>
    apiClient.get<CurrentLeagueData>(`/league/current`, { params: { page, limit } }),

  getMyStats: () =>
    apiClient.get<StudentDetailedStats>('/league/me'),

  getSeasonStandings: (seasonId: string, page = 1, limit = 20) =>
    apiClient.get<any>(`/league/seasons/${seasonId}`, { params: { page, limit } }),

  getHallOfFame: () =>
    apiClient.get<PastSeasonWithWinners[]>('/league/hall-of-fame'),

  // Admin
  getAllSeasons: () =>
    apiClient.get<LeagueSeason[]>('/league/admin/seasons'),

  createSeason: (input: {
    name: string;
    startsAt: string;
    endsAt: string;
    tier1MaxPiasters?: number;
    tier2MaxPiasters?: number;
    firstOrderPoints?: number;
    minOrdersForPrize?: number;
    maxPointsOrdersPerDay?: number;
  }) => apiClient.post<LeagueSeason>('/league/admin/seasons', input),

  endSeason: (seasonId: string) =>
    apiClient.post<any>(`/league/admin/seasons/${seasonId}/end`),

  createPrize: (input: {
    seasonId: string;
    rank: number;
    description: string;
    sponsorKioskId?: string;
  }) => apiClient.post<any>('/league/admin/prizes', input),

  claimPrize: (prizeId: string) =>
    apiClient.post<any>(`/league/admin/prizes/${prizeId}/claim`),

  getStudentAudit: (studentId: string, seasonId?: string) =>
    apiClient.get<any>(`/league/admin/audit/${studentId}`, { params: { seasonId } }),
};

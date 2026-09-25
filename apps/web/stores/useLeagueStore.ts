import { create } from 'zustand';
import {
  leagueService,
  type CurrentLeagueData,
  type StudentDetailedStats,
  type PastSeasonWithWinners,
} from '@/lib/services/leagueService';

interface LeagueState {
  // Data
  currentData: CurrentLeagueData | null;
  myStats: StudentDetailedStats | null;
  hallOfFame: PastSeasonWithWinners[];

  // Loading
  isLoadingLeaderboard: boolean;
  isLoadingMyStats: boolean;
  isLoadingHallOfFame: boolean;
  error: string | null;

  // Actions
  fetchCurrentLeaderboard: (page?: number, limit?: number) => Promise<void>;
  fetchMyStats: () => Promise<void>;
  fetchHallOfFame: () => Promise<void>;
  reset: () => void;
}

export const useLeagueStore = create<LeagueState>((set) => ({
  currentData: null,
  myStats: null,
  hallOfFame: [],
  isLoadingLeaderboard: false,
  isLoadingMyStats: false,
  isLoadingHallOfFame: false,
  error: null,

  fetchCurrentLeaderboard: async (page = 1, limit = 20) => {
    set({ isLoadingLeaderboard: true, error: null });
    try {
      const data = await leagueService.getCurrentLeaderboard(page, limit);
      set({ currentData: data, isLoadingLeaderboard: false });
    } catch (err: any) {
      set({ isLoadingLeaderboard: false, error: err.message || 'حدث خطأ' });
    }
  },

  fetchMyStats: async () => {
    set({ isLoadingMyStats: true, error: null });
    try {
      const data = await leagueService.getMyStats();
      set({ myStats: data, isLoadingMyStats: false });
    } catch (err: any) {
      set({ isLoadingMyStats: false, error: err.message || 'حدث خطأ' });
    }
  },

  fetchHallOfFame: async () => {
    set({ isLoadingHallOfFame: true, error: null });
    try {
      const data = await leagueService.getHallOfFame();
      set({ hallOfFame: data, isLoadingHallOfFame: false });
    } catch (err: any) {
      set({ isLoadingHallOfFame: false, error: err.message || 'حدث خطأ' });
    }
  },

  reset: () =>
    set({
      currentData: null,
      myStats: null,
      hallOfFame: [],
      error: null,
    }),
}));

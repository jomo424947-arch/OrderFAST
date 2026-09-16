'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoriteState {
  favoriteKioskIds: string[];
  toggleFavorite: (kioskId: string) => void;
  isFavorite: (kioskId: string) => boolean;
}

export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      favoriteKioskIds: [],
      toggleFavorite: (kioskId: string) => {
        const { favoriteKioskIds } = get();
        if (favoriteKioskIds.includes(kioskId)) {
          set({ favoriteKioskIds: favoriteKioskIds.filter((id) => id !== kioskId) });
        } else {
          set({ favoriteKioskIds: [...favoriteKioskIds, kioskId] });
        }
      },
      isFavorite: (kioskId: string) => {
        return get().favoriteKioskIds.includes(kioskId);
      },
    }),
    {
      name: 'orderfast-favorite-kiosks',
    }
  )
);

import { create } from 'zustand';
import { Kiosk, MenuItem, MenuCategory, Cashier } from '@/types';
import { MOCK_KIOSKS } from '@/lib/mock/kiosks';
import { MOCK_MENU_ITEMS, MOCK_CATEGORIES } from '@/lib/mock/menu';
import { MOCK_CASHIERS } from '@/lib/mock/cashiers';

interface KioskState {
  kiosks: Kiosk[];
  menuItems: MenuItem[];
  categories: MenuCategory[];
  cashiers: Cashier[];
  activeKioskId: string;
  setActiveKioskId: (id: string) => void;
  toggleKioskOpen: (id: string) => void;
  setWaitTime: (id: string, mins: number) => void;
  toggleItemAvailability: (itemId: string) => void;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => MenuItem;
  updateMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (itemId: string) => void;
  addKiosk: (data: Omit<Kiosk, 'id'>) => Kiosk;
  addCashier: (data: Omit<Cashier, 'id' | 'createdAt'>) => Cashier;
  approveMenuItem: (itemId: string) => void;
  rejectMenuItem: (itemId: string) => void;
}

export const useKioskStore = create<KioskState>((set, get) => ({
  kiosks: [...MOCK_KIOSKS],
  menuItems: [...MOCK_MENU_ITEMS],
  categories: [...MOCK_CATEGORIES],
  cashiers: [...MOCK_CASHIERS],
  activeKioskId: "kiosk-01",

  setActiveKioskId: (id: string) => set({ activeKioskId: id }),

  toggleKioskOpen: (id: string) => {
    set((state) => ({
      kiosks: state.kiosks.map((k) =>
        k.id === id ? { ...k, isOpen: !k.isOpen } : k
      ),
    }));
  },

  setWaitTime: (id: string, mins: number) => {
    set((state) => ({
      kiosks: state.kiosks.map((k) =>
        k.id === id ? { ...k, estimatedWaitMins: mins } : k
      ),
    }));
  },

  toggleItemAvailability: (itemId: string) => {
    set((state) => ({
      menuItems: state.menuItems.map((item) =>
        item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item
      ),
    }));
  },

  addMenuItem: (itemData) => {
    const newItem: MenuItem = {
      ...itemData,
      id: `item-${Date.now()}`,
      isUnderReview: true,
    };
    set((state) => ({
      menuItems: [newItem, ...state.menuItems],
    }));
    return newItem;
  },

  updateMenuItem: (item) => {
    set((state) => ({
      menuItems: state.menuItems.map((i) => (i.id === item.id ? item : i)),
    }));
  },

  deleteMenuItem: (itemId) => {
    set((state) => ({
      menuItems: state.menuItems.filter((i) => i.id !== itemId),
    }));
  },

  addKiosk: (data) => {
    const newKiosk: Kiosk = {
      ...data,
      id: `kiosk-${Date.now()}`,
    };
    set((state) => ({
      kiosks: [...state.kiosks, newKiosk],
    }));
    return newKiosk;
  },

  addCashier: (data) => {
    const newCashier: Cashier = {
      ...data,
      id: `cashier-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      cashiers: [...state.cashiers, newCashier],
    }));
    return newCashier;
  },

  approveMenuItem: (itemId: string) => {
    set((state) => ({
      menuItems: state.menuItems.map((item) =>
        item.id === itemId ? { ...item, isUnderReview: false } : item
      ),
    }));
  },

  rejectMenuItem: (itemId: string) => {
    set((state) => ({
      menuItems: state.menuItems.filter((item) => item.id !== itemId),
    }));
  },
}));

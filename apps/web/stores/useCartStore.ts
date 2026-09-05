import { create } from 'zustand';
import { CartItem, MenuItem, Kiosk } from '@/types';
import { playAddToCartSound, playRemoveFromCartSound } from '@/lib/utils/sound';

interface CartState {
  items: CartItem[];
  kiosk: Kiosk | null;
  addItem: (item: MenuItem, kiosk: Kiosk) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotalItems: () => number;
  getItemQuantity: (itemId: string) => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  kiosk: null,

  addItem: (item: MenuItem, kiosk: Kiosk) => {
    const { items, kiosk: currentKiosk } = get();

    // If from a different kiosk, reset cart to new kiosk
    let updatedItems = [...items];
    if (currentKiosk && currentKiosk.id !== kiosk.id) {
      updatedItems = [];
    }

    const existingIndex = updatedItems.findIndex(
      (ci) => ci.menuItem.id === item.id
    );

    if (existingIndex > -1) {
      updatedItems[existingIndex].quantity += 1;
    } else {
      updatedItems.push({ menuItem: item, quantity: 1 });
    }

    playAddToCartSound();
    set({ items: updatedItems, kiosk });
  },

  removeItem: (itemId: string) => {
    const { items } = get();
    playRemoveFromCartSound();
    const updated = items.filter((ci) => ci.menuItem.id !== itemId);
    set({ items: updated, kiosk: updated.length === 0 ? null : get().kiosk });
  },

  updateQuantity: (itemId: string, quantity: number) => {
    const { items } = get();
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }
    const current = items.find((ci) => ci.menuItem.id === itemId);
    if (current) {
      if (quantity > current.quantity) {
        playAddToCartSound();
      } else if (quantity < current.quantity) {
        playRemoveFromCartSound();
      }
    }
    const updated = items.map((ci) =>
      ci.menuItem.id === itemId ? { ...ci, quantity } : ci
    );
    set({ items: updated });
  },

  clearCart: () => {
    set({ items: [], kiosk: null });
  },

  getSubtotal: () => {
    const { items } = get();
    return items.reduce((sum, ci) => sum + ci.menuItem.price * ci.quantity, 0);
  },

  getTotalItems: () => {
    const { items } = get();
    return items.reduce((sum, ci) => sum + ci.quantity, 0);
  },

  getItemQuantity: (itemId: string) => {
    const { items } = get();
    const found = items.find((ci) => ci.menuItem.id === itemId);
    return found ? found.quantity : 0;
  },
}));


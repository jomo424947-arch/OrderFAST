import { create } from 'zustand';
import { Kiosk, MenuItem, MenuCategory, Cashier } from '@/types';
import { kioskService } from '@/lib/services/kioskService';
import { menuService } from '@/lib/services/menuService';
import { ApiMenuService } from '@/lib/services/api/apiMenuService';
import { ApiKioskService } from '@/lib/services/api/apiKioskService';
import { isValidUUID } from '@/lib/utils';

interface KioskState {
  kiosks: Kiosk[];
  kiosksWithStaff: any[];
  staffList: any[];
  menuItems: MenuItem[];
  categories: MenuCategory[];
  cashiers: Cashier[];
  activeKioskId: string;
  kioskStats: Record<string, any>;
  isLoading: boolean;
  error: string | null;

  setActiveKioskId: (id: string) => void;
  fetchKiosks: () => Promise<Kiosk[]>;
  fetchKiosksWithStaff: () => Promise<any[]>;
  fetchStaffList: () => Promise<any[]>;
  assignStaff: (kioskId: string, userId: string, role?: string) => Promise<void>;
  removeStaff: (kioskId: string, userId: string) => Promise<void>;
  fetchKioskById: (id: string) => Promise<Kiosk | null>;
  fetchKioskStats: (kioskId: string) => Promise<any>;
  fetchMenu: (kioskId: string, isStaff?: boolean) => Promise<{ categories: MenuCategory[]; items: MenuItem[] }>;
  fetchUnderReviewItems: () => Promise<MenuItem[]>;

  toggleKioskOpen: (id: string) => Promise<void>;
  setWaitTime: (id: string, mins: number) => Promise<void>;
  updateKioskSettings: (id: string, settings: any) => Promise<Kiosk>;
  toggleItemAvailability: (itemId: string) => Promise<void>;
  createCategory: (kioskId: string, name: string) => Promise<MenuCategory>;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<MenuItem>;
  updateMenuItem: (item: MenuItem) => Promise<void>;
  deleteMenuItem: (itemId: string) => Promise<void>;
  addKiosk: (data: Omit<Kiosk, 'id'>) => Kiosk;
  createKiosk: (data: any) => Promise<Kiosk>;
  addCashier: (data: Omit<Cashier, 'id' | 'createdAt'>) => Cashier;
  approveMenuItem: (itemId: string) => Promise<void>;
  rejectMenuItem: (itemId: string) => Promise<void>;
}

export const useKioskStore = create<KioskState>((set, get) => ({
  kiosks: [],
  kiosksWithStaff: [],
  staffList: [],
  menuItems: [],
  categories: [],
  cashiers: [],
  activeKioskId: '',
  kioskStats: {},
  isLoading: false,
  error: null,

  setActiveKioskId: (id: string) => set({ activeKioskId: id }),

  fetchKiosks: async () => {
    try {
      set({ isLoading: true, error: null });
      const fetched = await kioskService.getAllKiosks();
      const currentActive = get().activeKioskId;
      const validActiveId = isValidUUID(currentActive) && fetched.some((k) => k.id === currentActive)
        ? currentActive
        : '';

      set({
        kiosks: fetched,
        activeKioskId: validActiveId,
        isLoading: false,
      });
      return fetched;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'فشل جلب الأكشاك' });
      return [];
    }
  },

  fetchKiosksWithStaff: async () => {
    try {
      set({ isLoading: true, error: null });
      if (kioskService instanceof ApiKioskService) {
        const list = await (kioskService as ApiKioskService).getAdminKiosksWithStaff();
        set({ kiosksWithStaff: list, kiosks: list, isLoading: false });
        return list;
      }
      const list = await kioskService.getAllKiosks();
      set({ kiosks: list, kiosksWithStaff: list, isLoading: false });
      return list;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'فشل جلب الأكشاك والموظفين' });
      return [];
    }
  },

  fetchKioskStats: async (kioskId: string) => {
    if (!isValidUUID(kioskId)) return null;
    try {
      if (kioskService instanceof ApiKioskService) {
        const stats = await (kioskService as ApiKioskService).getKioskStats(kioskId);
        set((state) => ({
          kioskStats: { ...state.kioskStats, [kioskId]: stats },
        }));
        return stats;
      }
      return null;
    } catch {
      return null;
    }
  },

  createKiosk: async (data: any) => {
    try {
      set({ isLoading: true, error: null });
      if (kioskService instanceof ApiKioskService) {
        const created = await (kioskService as ApiKioskService).createKiosk(data);
        set((state) => ({
          kiosks: [created, ...state.kiosks],
          isLoading: false,
        }));
        return created;
      }
      const local = get().addKiosk(data);
      set({ isLoading: false });
      return local;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'فشل إنشاء الكشك' });
      throw err;
    }
  },

  fetchKioskById: async (id: string) => {
    if (!isValidUUID(id)) return null;
    try {
      const kiosk = await kioskService.getKioskById(id);
      if (kiosk) {
        set((state) => ({
          kiosks: [kiosk, ...state.kiosks.filter((k) => k.id !== kiosk.id)],
        }));
      }
      return kiosk;
    } catch {
      return null;
    }
  },

  fetchMenu: async (kioskId: string, isStaff = false) => {
    if (!isValidUUID(kioskId)) {
      return { categories: [], items: [] };
    }
    try {
      set({ isLoading: true, error: null });
      let categories: MenuCategory[] = [];
      let items: MenuItem[] = [];

      if (menuService instanceof ApiMenuService) {
        const result = await menuService.getMenu(kioskId, isStaff);
        categories = result.categories;
        items = result.items;
      } else {
        categories = await menuService.getCategories(kioskId);
        items = await menuService.getMenuItems(kioskId);
      }

      set({ categories, menuItems: items, isLoading: false });
      return { categories, items };
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'فشل جلب قائمة الطعام' });
      return { categories: [], items: [] };
    }
  },

  fetchUnderReviewItems: async () => {
    try {
      if (menuService instanceof ApiMenuService) {
        const items = await menuService.getUnderReviewItems();
        set((state) => {
          const reviewItems = items.map((i) => ({ ...i, isUnderReview: true }));
          const otherItems = state.menuItems.filter(
            (existing) => !reviewItems.some((r) => r.id === existing.id)
          );
          return { menuItems: [...reviewItems, ...otherItems] };
        });
        return items;
      }
      return get().menuItems.filter((i) => i.isUnderReview);
    } catch {
      return [];
    }
  },

  toggleKioskOpen: async (id: string) => {
    const target = get().kiosks.find((k) => k.id === id);
    const newOpenState = target ? !target.isOpen : true;

    try {
      const updated = await kioskService.updateKioskStatus(id, newOpenState);
      set((state) => ({
        kiosks: state.kiosks.map((k) => (k.id === id ? updated : k)),
      }));
    } catch (err: any) {
      set({ error: err.message || 'فشل تغيير حالة الكشك' });
    }
  },

  setWaitTime: async (id: string, mins: number) => {
    try {
      const updated = await kioskService.updateEstimatedWaitTime(id, mins);
      set((state) => ({
        kiosks: state.kiosks.map((k) => (k.id === id ? updated : k)),
      }));
    } catch (err: any) {
      set({ error: err.message || 'فشل تعديل وقت الانتظار' });
    }
  },

  updateKioskSettings: async (id: string, settings: any) => {
    try {
      const updated = await kioskService.updateKioskSettings(id, settings);
      set((state) => ({
        kiosks: state.kiosks.map((k) => (k.id === id ? { ...k, ...updated } : k)),
        kiosksWithStaff: state.kiosksWithStaff.map((k) => (k.id === id ? { ...k, ...updated } : k)),
      }));
      return updated;
    } catch (err: any) {
      set({ error: err.message || 'فشل تعديل إعدادات الكشك' });
      throw err;
    }
  },

  toggleItemAvailability: async (itemId: string) => {
    const target = get().menuItems.find((i) => i.id === itemId);
    const newAvail = target ? !target.isAvailable : true;

    try {
      const updated = await menuService.toggleItemAvailability(itemId, newAvail);
      set((state) => ({
        menuItems: state.menuItems.map((item) => (item.id === itemId ? updated : item)),
      }));
    } catch (err: any) {
      set({ error: err.message || 'فشل تغيير توفر الصنف' });
    }
  },

  createCategory: async (kioskId: string, name: string) => {
    try {
      if (menuService instanceof ApiMenuService) {
        const newCat = await menuService.createCategory(kioskId, name);
        set((state) => ({
          categories: [...state.categories, newCat],
        }));
        return newCat;
      } else {
        const newCat: MenuCategory = {
          id: `cat-${Date.now()}`,
          kioskId,
          name,
          displayOrder: get().categories.length + 1,
        };
        set((state) => ({
          categories: [...state.categories, newCat],
        }));
        return newCat;
      }
    } catch (err: any) {
      set({ error: err.message || 'فشل إضافة التصنيف' });
      throw err;
    }
  },

  addMenuItem: async (itemData) => {
    try {
      const newItem = await menuService.addMenuItem(itemData);
      set((state) => ({
        menuItems: [newItem, ...state.menuItems],
      }));
      return newItem;
    } catch (err: any) {
      set({ error: err.message || 'فشل إضافة الصنف' });
      throw err;
    }
  },

  updateMenuItem: async (item) => {
    try {
      const updated = await menuService.updateMenuItem(item);
      set((state) => ({
        menuItems: state.menuItems.map((i) => (i.id === item.id ? updated : i)),
      }));
    } catch (err: any) {
      set({ error: err.message || 'فشل تعديل الصنف' });
    }
  },

  deleteMenuItem: async (itemId) => {
    try {
      await menuService.deleteMenuItem(itemId);
      set((state) => ({
        menuItems: state.menuItems.filter((i) => i.id !== itemId),
      }));
    } catch (err: any) {
      set({ error: err.message || 'فشل حذف الصنف' });
    }
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

  approveMenuItem: async (itemId: string) => {
    try {
      if (menuService instanceof ApiMenuService) {
        const approved = await menuService.approveMenuItem(itemId);
        set((state) => ({
          menuItems: state.menuItems.map((item) => (item.id === itemId ? approved : item)),
        }));
      } else {
        set((state) => ({
          menuItems: state.menuItems.map((item) =>
            item.id === itemId ? { ...item, isUnderReview: false } : item
          ),
        }));
      }
    } catch (err: any) {
      set({ error: err.message || 'فشل اعتماد الصنف' });
    }
  },

  rejectMenuItem: async (itemId: string) => {
    try {
      if (menuService instanceof ApiMenuService) {
        await menuService.rejectMenuItem(itemId);
      }
      set((state) => ({
        menuItems: state.menuItems.filter((item) => item.id !== itemId),
      }));
    } catch (err: any) {
      set({ error: err.message || 'فشل رفض الصنف' });
    }
  },

  fetchStaffList: async () => {
    try {
      if (kioskService instanceof ApiKioskService) {
        const staff = await kioskService.getStaffList();
        set({ staffList: staff });
        return staff;
      }
      return [];
    } catch (err: any) {
      set({ error: err.message || 'فشل جلب قائمة الموظفين' });
      return [];
    }
  },

  assignStaff: async (kioskId: string, userId: string, role: string = 'cashier') => {
    try {
      set({ isLoading: true, error: null });
      if (kioskService instanceof ApiKioskService) {
        await kioskService.assignStaff(kioskId, userId, role);
      }
      // Refresh both kiosks and staff list
      await Promise.all([
        get().fetchKiosksWithStaff(),
        get().fetchStaffList(),
      ]);
      set({ isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'فشل تعيين الموظف' });
      throw err;
    }
  },

  removeStaff: async (kioskId: string, userId: string) => {
    try {
      set({ isLoading: true, error: null });
      if (kioskService instanceof ApiKioskService) {
        await kioskService.removeStaff(kioskId, userId);
      }
      await Promise.all([
        get().fetchKiosksWithStaff(),
        get().fetchStaffList(),
      ]);
      set({ isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'فشل إلغاء تعيين الموظف' });
      throw err;
    }
  },
}));

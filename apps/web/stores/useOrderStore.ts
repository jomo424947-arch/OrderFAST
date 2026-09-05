import { create } from 'zustand';
import { Order, OrderStatus, CartItem, Kiosk, AdminAnalyticsResponse } from '@/types';
import { orderService } from '@/lib/services/orderService';
import { ApiOrderService } from '@/lib/services/api/apiOrderService';
import { isValidUUID } from '@/lib/utils';
import { playNewOrderChime, playOrderPlacedSuccessSound } from '@/lib/utils/sound';
import { useKioskStore } from './useKioskStore';

interface OrderState {
  orders: Order[];
  adminOrders: Order[];
  adminStats: { totalOrders: number; todayOrdersCount: number; todaySalesPiasters: number; activeKitchenCount: number; totalFeeRevenuePiasters?: number; todayFeeRevenuePiasters?: number } | null;
  adminAnalytics: AdminAnalyticsResponse | null;
  isLoading: boolean;
  error: string | null;
  lastPolledAt: number | null;

  fetchStudentOrders: (studentId?: string, silent?: boolean) => Promise<Order[]>;
  fetchKioskOrders: (kioskId: string, silent?: boolean) => Promise<Order[]>;
  fetchAdminOrders: () => Promise<Order[]>;
  fetchAdminStats: () => Promise<any>;
  fetchAdminAnalytics: (timeframe?: 'all' | 'today' | 'week' | 'month') => Promise<AdminAnalyticsResponse | null>;
  fetchOrderById: (orderId: string, silent?: boolean) => Promise<Order | null>;

  startKioskPolling: (kioskId: string, intervalMs?: number) => () => void;
  startStudentTrackingPolling: (orderId: string, intervalMs?: number) => () => void;
  startStudentOrdersPolling: (studentId?: string, intervalMs?: number) => () => void;

  placeOrder: (params: {
    studentId: string;
    studentName: string;
    studentCollege: string;
    kiosk: Kiosk;
    items: CartItem[];
    paymentMethod?: 'cash' | 'digital_wallet';
  }) => Promise<Order>;

  acceptOrder: (orderId: string, customPrepTimeMins?: number) => Promise<void>;
  rejectOrder: (orderId: string, reason?: string) => Promise<void>;
  setOrderStatus: (orderId: string, status: OrderStatus, reason?: string) => Promise<void>;
  cancelOrder: (orderId: string, reason?: string) => Promise<void>;
  rateOrder: (orderId: string, rating: number) => Promise<void>;
  batchAcceptOrders: (kioskId: string, orderIds: string[]) => Promise<void>;

  getOrderById: (orderId: string) => Order | undefined;
  getStudentOrders: (studentId: string) => Order[];
  getKioskIncomingOrders: (kioskId: string) => Order[];
  getKioskActiveOrders: (kioskId: string) => Order[];
  getKioskFinishedOrders: (kioskId: string) => Order[];
  decrementTimers: () => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  adminOrders: [],
  adminStats: null,
  adminAnalytics: null,
  isLoading: false,
  error: null,
  lastPolledAt: null,

  fetchStudentOrders: async (studentId?: string, silent = false) => {
    try {
      if (!silent) set({ isLoading: true, error: null });
      const studentOrders = await orderService.getOrdersByStudent(studentId || '');
      set((state) => {
        const otherOrders = state.orders.filter((o) => studentId && o.studentId !== studentId);
        return {
          orders: [...studentOrders, ...otherOrders],
          isLoading: false,
          lastPolledAt: Date.now(),
        };
      });
      return studentOrders;
    } catch (err: any) {
      if (!silent) set({ isLoading: false, error: err.message || 'فشل جلب الطلبات' });
      return [];
    }
  },

  fetchKioskOrders: async (kioskId: string, silent = false) => {
    if (!isValidUUID(kioskId)) {
      return [];
    }
    try {
      if (!silent) set({ isLoading: true, error: null });
      const kioskOrders = await orderService.getOrdersByKiosk(kioskId);
      set((state) => {
        const otherOrders = state.orders.filter((o) => o.kioskId !== kioskId);
        return {
          orders: [...kioskOrders, ...otherOrders],
          isLoading: false,
          lastPolledAt: Date.now(),
        };
      });
      return kioskOrders;
    } catch (err: any) {
      if (!silent) set({ isLoading: false, error: err.message || 'فشل جلب طلبات الكشك' });
      return [];
    }
  },

  fetchAdminOrders: async () => {
    try {
      set({ isLoading: true, error: null });
      if (orderService instanceof ApiOrderService) {
        const adminOrders = await (orderService as ApiOrderService).getAdminRecentOrders(50, 1);
        set({ adminOrders, isLoading: false, lastPolledAt: Date.now() });
        return adminOrders;
      }
      const all = await orderService.getOrdersByStudent();
      set({ adminOrders: all, isLoading: false });
      return all;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'فشل جلب أوردرات الحرم الجامعي' });
      return [];
    }
  },

  fetchAdminStats: async () => {
    try {
      if (orderService instanceof ApiOrderService) {
        const stats = await (orderService as ApiOrderService).getAdminCampusStats();
        set({ adminStats: stats });
        return stats;
      }
      return null;
    } catch {
      return null;
    }
  },

  fetchAdminAnalytics: async (timeframe = 'all') => {
    try {
      if (orderService.getAdminAnalytics) {
        const data = await orderService.getAdminAnalytics(timeframe);
        set({ adminAnalytics: data });
        return data;
      }
      return null;
    } catch (err: any) {
      console.error('Failed to fetch admin analytics:', err);
      return null;
    }
  },

  fetchOrderById: async (orderId: string, silent = false) => {
    try {
      if (!silent) set({ isLoading: true });
      const order = await orderService.getOrderById(orderId);
      if (order) {
        set((state) => ({
          orders: [
            order,
            ...state.orders.filter(
              (o) => o.id !== order.id && o.orderNumber !== order.orderNumber
            ),
          ],
          isLoading: false,
          lastPolledAt: Date.now(),
        }));
      } else if (!silent) {
        set({ isLoading: false });
      }
      return order;
    } catch {
      if (!silent) set({ isLoading: false });
      return null;
    }
  },

  startKioskPolling: (kioskId: string, intervalMs = 3000) => {
    if (!isValidUUID(kioskId)) return () => {};

    // Initial load
    get().fetchKioskOrders(kioskId, false);

    const intervalId = setInterval(async () => {
      if (typeof document !== 'undefined' && document.hidden) return;

      const previousPendingIds = new Set(
        get()
          .orders.filter((o) => o.kioskId === kioskId && o.status === 'PENDING_KIOSK')
          .map((o) => o.id)
      );

      const latestOrders = await get().fetchKioskOrders(kioskId, true);

      // Trigger bell chime if new incoming orders arrived
      const hasNewIncoming = latestOrders.some(
        (o) => o.status === 'PENDING_KIOSK' && !previousPendingIds.has(o.id)
      );

      if (hasNewIncoming && previousPendingIds.size > 0) {
        playNewOrderChime();
      }
    }, intervalMs);

    return () => clearInterval(intervalId);
  },

  startStudentTrackingPolling: (orderId: string, intervalMs = 3000) => {
    if (!orderId) return () => {};

    get().fetchOrderById(orderId, false);

    const intervalId = setInterval(async () => {
      if (typeof document !== 'undefined' && document.hidden) return;

      const order = await get().fetchOrderById(orderId, true);
      if (
        order &&
        (order.status === 'COMPLETED' ||
          order.status === 'REJECTED' ||
          order.status === 'CANCELLED' ||
          order.status === 'NO_SHOW' ||
          order.status === 'EXPIRED')
      ) {
        clearInterval(intervalId);
      }
    }, intervalMs);

    return () => clearInterval(intervalId);
  },

  startStudentOrdersPolling: (studentId?: string, intervalMs = 6000) => {
    get().fetchStudentOrders(studentId, false);

    const intervalId = setInterval(async () => {
      if (typeof document !== 'undefined' && document.hidden) return;

      // Smart check: Only poll if student has active orders needing live tracking
      const hasActiveOrders = get().orders.some(
        (o) =>
          (!studentId || o.studentId === studentId) &&
          (o.status === 'PENDING_KIOSK' ||
            o.status === 'ACCEPTED' ||
            o.status === 'PREPARING' ||
            o.status === 'READY')
      );

      if (!hasActiveOrders) return;

      await get().fetchStudentOrders(studentId, true);
    }, intervalMs);

    // Re-fetch on window focus
    const onFocus = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        get().fetchStudentOrders(studentId, true);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus);
    }

    return () => {
      clearInterval(intervalId);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus);
      }
    };
  },

  placeOrder: async ({ kiosk, items, paymentMethod }) => {
    set({ isLoading: true, error: null });
    try {
      const newOrder = await (orderService as any).createOrder({
        kioskId: kiosk.id,
        items: items.map((ci) => ({
          menuItemId: ci.menuItem.id,
          quantity: ci.quantity,
          specialInstructions: ci.specialInstructions,
        })),
        paymentMethod: paymentMethod || 'cash',
      });

      set((state) => ({
        orders: [newOrder, ...state.orders.filter((o) => o.id !== newOrder.id)],
        isLoading: false,
      }));

      playOrderPlacedSuccessSound();

      return newOrder;
    } catch (err: any) {
      const msg = err.message || '';
      const friendlyMsg = msg.includes('الصلاحية المطلوبة')
        ? 'حسابك الحالي ليس حساب طالب (مسجل ككاشير أو أدمن). يرجى تسجيل الدخول بحساب طالب لتأكيد الأوردر.'
        : msg || 'فشل إنشاء الطلب';
      set({ isLoading: false, error: friendlyMsg });
      throw new Error(friendlyMsg);
    }
  },

  acceptOrder: async (orderId: string, customPrepTimeMins?: number) => {
    try {
      if (orderService instanceof ApiOrderService) {
        const updated = await orderService.acceptOrder(orderId, customPrepTimeMins);
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId ? updated : o)),
        }));
      } else {
        const updated = await orderService.updateOrderStatus(orderId, 'ACCEPTED');
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId ? updated : o)),
        }));
      }
    } catch (err: any) {
      set({ error: err.message || 'فشل قبول الطلب' });
      throw err;
    }
  },

  batchAcceptOrders: async (kioskId: string, orderIds: string[]) => {
    if (!orderIds.length) return;
    try {
      if (orderService.batchAcceptOrders) {
        await orderService.batchAcceptOrders(kioskId, orderIds);
      } else {
        await Promise.all(
          orderIds.map((id) => orderService.updateOrderStatus(id, 'ACCEPTED'))
        );
      }
      await get().fetchKioskOrders(kioskId, true);
    } catch (err: any) {
      set({ error: err.message || 'فشل قبول جميع الطلبات' });
      throw err;
    }
  },

  rejectOrder: async (orderId: string, reason?: string) => {
    try {
      const rejectionReason = reason || 'الكشك غير قادر على استلام طلبات جديدة حالياً';
      const updated = await orderService.updateOrderStatus(orderId, 'REJECTED', rejectionReason);
      set((state) => ({
        orders: state.orders.map((o) => (o.id === orderId ? updated : o)),
      }));
    } catch (err: any) {
      set({ error: err.message || 'فشل رفض الطلب' });
      throw err;
    }
  },

  cancelOrder: async (orderId: string, reason?: string) => {
    try {
      const updated = await orderService.updateOrderStatus(orderId, 'CANCELLED', reason);
      set((state) => ({
        orders: state.orders.map((o) => (o.id === orderId ? updated : o)),
      }));
    } catch (err: any) {
      set({ error: err.message || 'فشل إلغاء الطلب' });
      throw err;
    }
  },

  setOrderStatus: async (orderId: string, status: OrderStatus, reason?: string) => {
    try {
      const updated = await orderService.updateOrderStatus(orderId, status, reason);
      set((state) => ({
        orders: state.orders.map((o) => (o.id === orderId ? updated : o)),
      }));
    } catch (err: any) {
      set({ error: err.message || 'فشل تحديث حالة الطلب' });
      throw err;
    }
  },

  rateOrder: async (orderId: string, rating: number) => {
    try {
      const updated = await orderService.rateOrder(orderId, rating);
      set((state) => ({
        orders: state.orders.map((o) => (o.id === orderId ? updated : o)),
      }));
      // Invalidate and refresh kiosks list so new rating immediately reflects
      useKioskStore.getState().fetchKiosks();
    } catch (err: any) {
      set({ error: err.message || 'فشل إرسال التقييم' });
      throw err;
    }
  },

  getOrderById: (orderId: string) => {
    return get().orders.find(
      (o) => o.id === orderId || o.orderNumber === orderId || o.orderNumber === `#${orderId}`
    );
  },

  getStudentOrders: (studentId: string) => {
    return get().orders.filter((o) => !studentId || o.studentId === studentId);
  },

  getKioskIncomingOrders: (kioskId: string) => {
    return get().orders.filter(
      (o) => o.kioskId === kioskId && o.status === 'PENDING_KIOSK'
    );
  },

  getKioskActiveOrders: (kioskId: string) => {
    return get().orders.filter(
      (o) =>
        o.kioskId === kioskId &&
        (o.status === 'ACCEPTED' || o.status === 'PREPARING' || o.status === 'READY')
    );
  },

  getKioskFinishedOrders: (kioskId: string) => {
    const todayStr = new Date().toDateString();
    return get().orders.filter((o) => {
      if (o.kioskId !== kioskId) return false;
      const isFinished =
        o.status === 'COMPLETED' ||
        o.status === 'REJECTED' ||
        o.status === 'CANCELLED' ||
        o.status === 'NO_SHOW' ||
        o.status === 'EXPIRED';
      if (!isFinished) return false;
      if (o.createdAt) {
        return new Date(o.createdAt).toDateString() === todayStr;
      }
      return true;
    });
  },

  decrementTimers: () => {
    set((state) => ({
      orders: state.orders.map((o) => {
        if (
          o.status === 'PENDING_KIOSK' &&
          o.reviewTimeRemainingSeconds &&
          o.reviewTimeRemainingSeconds > 0
        ) {
          return {
            ...o,
            reviewTimeRemainingSeconds: o.reviewTimeRemainingSeconds - 1,
          };
        }
        return o;
      }),
    }));
  },
}));

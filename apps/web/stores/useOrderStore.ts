import { create } from 'zustand';
import { Order, OrderStatus, CartItem, Kiosk } from '@/types';
import { MOCK_ORDERS } from '@/lib/mock/orders';
import { generateOrderNumber } from '@/lib/utils';

interface OrderState {
  orders: Order[];
  placeOrder: (params: {
    studentId: string;
    studentName: string;
    studentCollege: string;
    kiosk: Kiosk;
    items: CartItem[];
  }) => Order;
  acceptOrder: (orderId: string) => void;
  rejectOrder: (orderId: string, reason?: string) => void;
  setOrderStatus: (orderId: string, status: OrderStatus) => void;
  getOrderById: (orderId: string) => Order | undefined;
  getStudentOrders: (studentId: string) => Order[];
  getKioskIncomingOrders: (kioskId: string) => Order[];
  getKioskActiveOrders: (kioskId: string) => Order[];
  decrementTimers: () => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [...MOCK_ORDERS],

  placeOrder: ({ studentId, studentName, studentCollege, kiosk, items }) => {
    const orderNumber = generateOrderNumber();
    const orderItems = items.map((ci, idx) => ({
      id: `oi-${Date.now()}-${idx}`,
      menuItemId: ci.menuItem.id,
      name: ci.menuItem.name,
      price: ci.menuItem.price,
      quantity: ci.quantity,
    }));

    const total = orderItems.reduce((acc, it) => acc + it.price * it.quantity, 0);

    const newOrder: Order = {
      id: `ord-${orderNumber}`,
      orderNumber,
      studentId,
      studentName,
      studentCollege,
      kioskId: kiosk.id,
      kioskName: kiosk.name,
      items: orderItems,
      subtotal: total,
      total,
      status: 'pending_review',
      estimatedWaitMins: kiosk.estimatedWaitMins || 15,
      approximateOrdersAhead: kiosk.ordersAheadCount || 2,
      reviewTimeRemainingSeconds: 240, // 4 mins initial review countdown
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      orders: [newOrder, ...state.orders],
    }));

    return newOrder;
  },

  acceptOrder: (orderId: string) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'preparing' as OrderStatus,
              updatedAt: new Date().toISOString(),
            }
          : o
      ),
    }));
  },

  rejectOrder: (orderId: string, reason?: string) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'rejected' as OrderStatus,
              rejectionReason: reason || 'الكشك غير قادر على استلام طلبات جديدة حالياً',
              updatedAt: new Date().toISOString(),
            }
          : o
      ),
    }));
  },

  setOrderStatus: (orderId: string, status: OrderStatus) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              updatedAt: new Date().toISOString(),
            }
          : o
      ),
    }));
  },

  getOrderById: (orderId: string) => {
    return get().orders.find(
      (o) => o.id === orderId || o.orderNumber === orderId
    );
  },

  getStudentOrders: (studentId: string) => {
    return get().orders.filter((o) => o.studentId === studentId);
  },

  getKioskIncomingOrders: (kioskId: string) => {
    return get().orders.filter(
      (o) => o.kioskId === kioskId && o.status === 'pending_review'
    );
  },

  getKioskActiveOrders: (kioskId: string) => {
    return get().orders.filter(
      (o) =>
        o.kioskId === kioskId &&
        (o.status === 'accepted' || o.status === 'preparing' || o.status === 'ready_for_pickup')
    );
  },

  decrementTimers: () => {
    set((state) => ({
      orders: state.orders.map((o) => {
        if (
          o.status === 'pending_review' &&
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

import { Order, OrderStatus } from "@/types";
import { MOCK_ORDERS } from "@/lib/mock/orders";

export interface CreateOrderPayload {
  kioskId: string;
  items: Array<{
    menuItemId?: string;
    name?: string;          // Mock-only fallback
    price?: number;         // Mock-only fallback (EGP)
    quantity: number;
    specialInstructions?: string;
  }>;
  studentId?: string;       // Mock-only: API derives from JWT
  studentName?: string;     // Mock-only: API derives from DB
  studentCollege?: string;  // Mock-only: API derives from DB
  kioskName?: string;       // Mock-only: API derives from DB
  subtotal?: number;        // Mock-only: API calculates server-side
  total?: number;           // Mock-only: API calculates server-side
  paymentMethod?: 'cash' | 'digital_wallet';
  idempotencyKey?: string;
}

export interface IOrderService {
  getOrdersByStudent(studentId?: string): Promise<Order[]>;
  getOrderById(orderId: string): Promise<Order | null>;
  getOrdersByKiosk(kioskId: string): Promise<Order[]>;
  getKioskFinishedOrders?(kioskId: string): Promise<Order[]>;
  createOrder(orderData: CreateOrderPayload): Promise<Order>;
  updateOrderStatus(orderId: string, status: OrderStatus, rejectionReason?: string): Promise<Order>;
  rateOrder(orderId: string, rating: number): Promise<Order>;
  batchAcceptOrders?(kioskId: string, orderIds: string[]): Promise<any>;
  getAdminCampusStats?(): Promise<any>;
  getAdminAnalytics?(timeframe?: string): Promise<any>;
}

export class MockOrderService implements IOrderService {
  private orders: Order[] = [...MOCK_ORDERS];

  async getOrdersByStudent(studentId?: string): Promise<Order[]> {
    return this.orders.filter((o) => !studentId || o.studentId === studentId);
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    const order = this.orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    return order || null;
  }

  async getOrdersByKiosk(kioskId: string): Promise<Order[]> {
    return this.orders.filter((o) => o.kioskId === kioskId);
  }

  async getKioskFinishedOrders(kioskId: string): Promise<Order[]> {
    return this.orders.filter(
      (o) =>
        o.kioskId === kioskId &&
        (o.status === 'COMPLETED' ||
          o.status === 'REJECTED' ||
          o.status === 'CANCELLED' ||
          o.status === 'NO_SHOW' ||
          o.status === 'EXPIRED')
    );
  }

  async createOrder(orderData: CreateOrderPayload): Promise<Order> {
    const orderNumber = `0${Math.floor(100 + Math.random() * 900)}`;
    const subtotal = orderData.items.reduce((sum, it) => sum + (it.price || 10) * it.quantity, 0);
    const fees = 1;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      studentId: orderData.studentId || 'std-001',
      studentName: orderData.studentName || 'طالب',
      studentCollege: orderData.studentCollege || 'الجامعة',
      kioskId: orderData.kioskId,
      kioskName: orderData.kioskName || 'الكشك',
      items: orderData.items.map((it, idx) => ({
        id: `oi-${Date.now()}-${idx}`,
        menuItemId: it.menuItemId,
        name: it.name || 'صنف',
        price: it.price || 10,
        quantity: it.quantity,
        specialInstructions: it.specialInstructions,
      })),
      subtotal,
      fees,
      total: subtotal + fees,
      status: 'PENDING_KIOSK',
      estimatedWaitMins: 15,
      approximateOrdersAhead: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.orders.unshift(newOrder);
    return newOrder;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, rejectionReason?: string): Promise<Order> {
    const index = this.orders.findIndex((o) => o.id === orderId);
    if (index === -1) {
      throw new Error(`Order ${orderId} not found`);
    }
    const updated = {
      ...this.orders[index],
      status,
      rejectionReason: rejectionReason || this.orders[index].rejectionReason,
      updatedAt: new Date().toISOString(),
    };
    this.orders[index] = updated;
    return updated;
  }

  async rateOrder(orderId: string, rating: number): Promise<Order> {
    const index = this.orders.findIndex((o) => o.id === orderId);
    if (index === -1) {
      throw new Error(`Order ${orderId} not found`);
    }
    const updated = {
      ...this.orders[index],
      rating,
      ratedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.orders[index] = updated;
    return updated;
  }

  async batchAcceptOrders(kioskId: string, orderIds: string[]): Promise<any> {
    const succeeded: string[] = [];
    for (const id of orderIds) {
      const idx = this.orders.findIndex((o) => o.id === id);
      if (idx !== -1) {
        this.orders[idx] = {
          ...this.orders[idx],
          status: 'ACCEPTED',
          updatedAt: new Date().toISOString(),
        };
        succeeded.push(id);
      }
    }
    return { successCount: succeeded.length, failureCount: orderIds.length - succeeded.length, succeeded, failed: [] };
  }

  async getAdminCampusStats(): Promise<any> {
    const completed = this.orders.filter((o) => o.status === 'COMPLETED');
    const totalFees = completed.reduce((sum, o) => sum + (o.fees || 1) * 100, 0);
    return {
      totalOrders: this.orders.length,
      todayOrdersCount: this.orders.length,
      todaySalesPiasters: completed.reduce((sum, o) => sum + o.total * 100, 0),
      activeKitchenCount: this.orders.filter((o) => ['PENDING_KIOSK', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status)).length,
      totalFeeRevenuePiasters: totalFees,
      todayFeeRevenuePiasters: totalFees,
    };
  }

  async getAdminAnalytics(timeframe = 'all'): Promise<any> {
    const completed = this.orders.filter((o) => o.status === 'COMPLETED');
    const totalFees = completed.reduce((sum, o) => sum + (o.fees || 1) * 100, 0);
    const totalSales = completed.reduce((sum, o) => sum + o.subtotal * 100, 0);
    const totalGross = completed.reduce((sum, o) => sum + o.total * 100, 0);

    return {
      timeframe,
      summary: {
        totalOrdersCount: this.orders.length,
        completedOrdersCount: completed.length,
        totalKioskSalesPiasters: totalSales,
        totalFeeRevenuePiasters: totalFees,
        totalGrossVolumePiasters: totalGross,
        avgFeePiasters: completed.length ? Math.round(totalFees / completed.length) : 0,
        avgOrderTotalPiasters: completed.length ? Math.round(totalGross / completed.length) : 0,
        todayCompletedCount: completed.length,
        todaySalesPiasters: totalSales,
        todayFeeRevenuePiasters: totalFees,
        monthFeeRevenuePiasters: totalFees,
      },
      statusDistribution: { COMPLETED: completed.length },
      kioskBreakdown: [],
      paymentBreakdown: [],
      dailyTimeline: [],
    };
  }
}

import { ApiOrderService } from "./api/apiOrderService";

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";
export const orderService: IOrderService = useMock ? new MockOrderService() : new ApiOrderService();

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
  createOrder(orderData: CreateOrderPayload): Promise<Order>;
  updateOrderStatus(orderId: string, status: OrderStatus, rejectionReason?: string): Promise<Order>;
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

  async createOrder(orderData: CreateOrderPayload): Promise<Order> {
    const orderNumber = `0${Math.floor(100 + Math.random() * 900)}`;
    const subtotal = orderData.items.reduce((sum, it) => sum + (it.price || 10) * it.quantity, 0);

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
      total: subtotal,
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
}

import { ApiOrderService } from "./api/apiOrderService";

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";
export const orderService: IOrderService = useMock ? new MockOrderService() : new ApiOrderService();

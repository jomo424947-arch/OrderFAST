import { Order, OrderStatus } from "@/types";
import { MOCK_ORDERS } from "@/lib/mock/orders";

export interface IOrderService {
  getOrdersByStudent(studentId: string): Promise<Order[]>;
  getOrderById(orderId: string): Promise<Order | null>;
  getOrdersByKiosk(kioskId: string): Promise<Order[]>;
  createOrder(orderData: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<Order>;
  updateOrderStatus(orderId: string, status: OrderStatus, rejectionReason?: string): Promise<Order>;
}

export class MockOrderService implements IOrderService {
  private orders: Order[] = [...MOCK_ORDERS];

  async getOrdersByStudent(studentId: string): Promise<Order[]> {
    return this.orders.filter((o) => o.studentId === studentId);
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    const order = this.orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    return order || null;
  }

  async getOrdersByKiosk(kioskId: string): Promise<Order[]> {
    return this.orders.filter((o) => o.kioskId === kioskId);
  }

  async createOrder(orderData: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<Order> {
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
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

export const orderService = new MockOrderService();

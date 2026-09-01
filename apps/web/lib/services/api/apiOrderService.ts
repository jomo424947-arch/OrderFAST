import { apiClient } from '@/lib/api/client';
import { Order, OrderStatus } from '@/types';
import { IOrderService, CreateOrderPayload } from '../orderService';
import { adaptOrderFromApi, ApiOrderRaw } from '@/lib/adapters/orderAdapter';
import { BatchActionResult } from '@/lib/api/types';
import { generateUUID } from '@/lib/utils';

export class ApiOrderService implements IOrderService {
  async createOrder(orderData: CreateOrderPayload): Promise<Order> {
    const rawOrder = await apiClient.post<ApiOrderRaw>(
      '/orders',
      {
        kioskId: orderData.kioskId,
        items: orderData.items.map((item) => ({
          menuItemId: item.menuItemId || '',
          quantity: item.quantity,
          specialInstructions: item.specialInstructions,
        })),
        paymentMethod: orderData.paymentMethod || 'cash',
      },
      {
        idempotencyKey: orderData.idempotencyKey || generateUUID(),
      }
    );

    return adaptOrderFromApi(rawOrder);
  }

  async getOrdersByStudent(_studentId?: string, page = 1, limit = 50): Promise<Order[]> {
    const result = await apiClient.get<ApiOrderRaw[]>('/orders/student/me', {
      params: { page, limit },
    });

    const items = Array.isArray(result) ? result : [];
    return items.map(adaptOrderFromApi);
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const raw = await apiClient.get<ApiOrderRaw>(`/orders/${orderId}`);
      return raw ? adaptOrderFromApi(raw) : null;
    } catch {
      return null;
    }
  }

  async getOrdersByKiosk(kioskId: string): Promise<Order[]> {
    // Combine incoming + active orders for kiosk
    const [incoming, active] = await Promise.all([
      this.getKioskIncomingOrders(kioskId),
      this.getKioskActiveOrders(kioskId),
    ]);
    return [...incoming, ...active];
  }

  async getKioskIncomingOrders(kioskId: string): Promise<Order[]> {
    const rawList = await apiClient.get<ApiOrderRaw[]>(`/orders/kiosks/${kioskId}/incoming`);
    return Array.isArray(rawList) ? rawList.map(adaptOrderFromApi) : [];
  }

  async getKioskActiveOrders(kioskId: string): Promise<Order[]> {
    const rawList = await apiClient.get<ApiOrderRaw[]>(`/orders/kiosks/${kioskId}/active`);
    return Array.isArray(rawList) ? rawList.map(adaptOrderFromApi) : [];
  }

  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    const raw = await apiClient.post<ApiOrderRaw>(`/orders/${orderId}/cancel`, {
      reason: reason || 'إلغاء من قبل الطالب',
    });
    return adaptOrderFromApi(raw);
  }

  async acceptOrder(orderId: string, customPrepTimeMins?: number): Promise<Order> {
    const body: Record<string, unknown> = {};
    if (customPrepTimeMins !== undefined) {
      body.customPrepTimeMins = customPrepTimeMins;
    }
    const raw = await apiClient.post<ApiOrderRaw>(`/orders/${orderId}/accept`, body);
    return adaptOrderFromApi(raw);
  }

  async rejectOrder(orderId: string, reason: string): Promise<Order> {
    const raw = await apiClient.post<ApiOrderRaw>(`/orders/${orderId}/reject`, {
      reason,
    });
    return adaptOrderFromApi(raw);
  }

  async startPreparing(orderId: string): Promise<Order> {
    const raw = await apiClient.post<ApiOrderRaw>(`/orders/${orderId}/start-preparing`);
    return adaptOrderFromApi(raw);
  }

  async markReady(orderId: string): Promise<Order> {
    const raw = await apiClient.post<ApiOrderRaw>(`/orders/${orderId}/mark-ready`);
    return adaptOrderFromApi(raw);
  }

  async completeOrder(orderId: string): Promise<Order> {
    const raw = await apiClient.post<ApiOrderRaw>(`/orders/${orderId}/complete`);
    return adaptOrderFromApi(raw);
  }

  async markNoShow(orderId: string): Promise<Order> {
    const raw = await apiClient.post<ApiOrderRaw>(`/orders/${orderId}/no-show`);
    return adaptOrderFromApi(raw);
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    rejectionReason?: string
  ): Promise<Order> {
    switch (status) {
      case 'ACCEPTED':
        return this.acceptOrder(orderId);
      case 'PREPARING':
        return this.startPreparing(orderId);
      case 'READY':
        return this.markReady(orderId);
      case 'COMPLETED':
        return this.completeOrder(orderId);
      case 'REJECTED':
        return this.rejectOrder(orderId, rejectionReason || 'تم الرفض');
      case 'CANCELLED':
        return this.cancelOrder(orderId, rejectionReason);
      case 'NO_SHOW':
        return this.markNoShow(orderId);
      default:
        throw new Error(`Unsupported status transition to ${status}`);
    }
  }

  async batchAcceptOrders(kioskId: string, orderIds: string[]): Promise<BatchActionResult> {
    return apiClient.post<BatchActionResult>(`/orders/kiosks/${kioskId}/batch/accept`, {
      orderIds,
    });
  }

  async batchMarkReady(kioskId: string, orderIds: string[]): Promise<BatchActionResult> {
    return apiClient.post<BatchActionResult>(`/orders/kiosks/${kioskId}/batch/mark-ready`, {
      orderIds,
    });
  }

  async getAdminRecentOrders(limit = 50, page = 1): Promise<Order[]> {
    const rawList = await apiClient.get<ApiOrderRaw[]>('/orders/admin/all', {
      params: { limit, page },
    });
    return Array.isArray(rawList) ? rawList.map(adaptOrderFromApi) : [];
  }

  async getAdminCampusStats(): Promise<{
    totalOrders: number;
    todayOrdersCount: number;
    todaySalesPiasters: number;
    activeKitchenCount: number;
  }> {
    return apiClient.get('/orders/admin/stats');
  }
}

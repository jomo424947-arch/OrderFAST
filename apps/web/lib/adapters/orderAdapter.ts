import { Order, OrderItem, OrderStatus } from '@/types';
import { piastersToEgp } from './priceAdapter';

export interface ApiOrderItemRaw {
  id?: string;
  orderId?: string;
  menuItemId?: string | null;
  nameSnapshot?: string;
  name?: string;
  unitPriceSnapshot?: number;
  unitPrice?: number;
  price?: number;
  quantity: number;
  lineTotal?: number;
  specialInstructions?: string | null;
}

export interface ApiOrderRaw {
  id: string;
  orderNumber: string;
  orderDate?: string;
  studentId: string;
  kioskId: string;
  status: OrderStatus;
  idempotencyKey?: string;
  subtotal: number;
  discount?: number;
  fees?: number;
  total: number;
  paymentMethod?: 'cash' | 'digital_wallet';
  paymentStatus?: 'pending_at_pickup' | 'paid' | 'waived';
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  ordersAheadSnapshot?: number;
  ordersAhead?: number;
  studentNameSnapshot?: string;
  studentName?: string;
  studentCollegeSnapshot?: string;
  studentCollege?: string;
  kioskNameSnapshot?: string;
  kioskName?: string;
  expiresAt?: string;
  estimatedReadyAt?: string | null;
  acceptedAt?: string | null;
  preparingAt?: string | null;
  readyAt?: string | null;
  completedAt?: string | null;
  rejectedAt?: string | null;
  cancelledAt?: string | null;
  expiredAt?: string | null;
  noShowAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  items?: ApiOrderItemRaw[];
}

export function adaptOrderItemFromApi(raw: ApiOrderItemRaw): OrderItem {
  const rawPrice = raw.unitPriceSnapshot ?? raw.unitPrice ?? raw.price ?? 0;
  return {
    id: raw.id || `item-${Date.now()}`,
    menuItemId: raw.menuItemId || undefined,
    name: raw.nameSnapshot || raw.name || 'صنف غير محدد',
    price: piastersToEgp(rawPrice),
    quantity: raw.quantity,
    specialInstructions: raw.specialInstructions || undefined,
  };
}

export function adaptOrderFromApi(raw: ApiOrderRaw): Order {
  // Calculate remaining review seconds if pending
  let reviewTimeRemainingSeconds: number | undefined = undefined;
  if (raw.status === 'PENDING_KIOSK' && raw.expiresAt) {
    const diffMs = new Date(raw.expiresAt).getTime() - Date.now();
    reviewTimeRemainingSeconds = Math.max(0, Math.floor(diffMs / 1000));
  }

  // Calculate estimated wait mins from estimatedReadyAt if present
  let estimatedWaitMins = 15;
  if (raw.estimatedReadyAt) {
    const diffMs = new Date(raw.estimatedReadyAt).getTime() - Date.now();
    estimatedWaitMins = Math.max(1, Math.ceil(diffMs / (60 * 1000)));
  }

  const items = Array.isArray(raw.items) ? raw.items.map(adaptOrderItemFromApi) : [];

  return {
    id: raw.id,
    orderNumber: raw.orderNumber.startsWith('#') ? raw.orderNumber : `#${raw.orderNumber}`,
    studentId: raw.studentId,
    studentName: raw.studentNameSnapshot || raw.studentName || 'طالب',
    studentCollege: raw.studentCollegeSnapshot || raw.studentCollege || 'الجامعة',
    kioskId: raw.kioskId,
    kioskName: raw.kioskNameSnapshot || raw.kioskName || 'الكشك',
    items,
    subtotal: piastersToEgp(raw.subtotal),
    discount: piastersToEgp(raw.discount ?? 0),
    fees: piastersToEgp(raw.fees ?? 0),
    total: piastersToEgp(raw.total),
    status: raw.status,
    paymentMethod: raw.paymentMethod || 'cash',
    paymentStatus: raw.paymentStatus || 'pending_at_pickup',
    estimatedWaitMins,
    approximateOrdersAhead: raw.ordersAhead ?? raw.ordersAheadSnapshot ?? 0,
    rejectionReason: raw.rejectionReason || undefined,
    cancellationReason: raw.cancellationReason || undefined,
    expiresAt: raw.expiresAt,
    estimatedReadyAt: raw.estimatedReadyAt || undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt || raw.createdAt,
    reviewTimeRemainingSeconds,
  };
}

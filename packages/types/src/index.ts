/**
 * @orderfast/types
 * Core Domain Types & Enumerations for OrderFAST
 * Built in accordance with Architecture Revision V2
 */

// ==========================================
// 1. Core Enumerations
// ==========================================

export type SystemRole = 'student' | 'staff' | 'admin';

export type AccountStatus = 'active' | 'warning' | 'restricted';

export type KioskRole = 'owner' | 'cashier';

export type OrderStatus =
  | 'PENDING_KIOSK'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type PaymentMethod = 'cash' | 'digital_wallet';

export type PaymentStatus = 'pending_at_pickup' | 'paid' | 'waived';

export type NotificationType = 'order_status' | 'kiosk_notice' | 'system' | 'warning';

export type OrderEventType =
  | 'ORDER_CREATED'
  | 'STATUS_CHANGED'
  | 'PREP_TIME_ADJUSTED'
  | 'ORDER_REJECTED'
  | 'ORDER_CANCELLED'
  | 'NO_SHOW_RECORDED';

export type ActorType = 'student' | 'staff' | 'admin' | 'system';

// ==========================================
// 2. User & Identity Entities
// ==========================================

export interface Profile {
  id: string; // UUID v7 / auth.users.id
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  systemRole: SystemRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile extends Profile {
  universityId: string;
  college: string;
  accountStatus: AccountStatus;
  noShowCount: number;
}

// ==========================================
// 3. Kiosk & Staff Entities
// ==========================================

export interface Kiosk {
  id: string;
  name: string;
  collegeLocation: string;
  campusZone?: string | null;
  category: string;
  isOpen: boolean;
  acceptsOnlineOrders: boolean;
  isRushMode: boolean;
  openingHours: string;
  phone?: string | null;
  rating: number;
  ratingCount?: number;
  defaultPrepTimeMins: number;
  acceptanceTimeoutSecs: number;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KioskStaff {
  id: string;
  kioskId: string;
  userId: string;
  role: KioskRole;
  isActive: boolean;
  createdAt: string;
  profile?: Profile;
}

export interface KioskDailyCounter {
  kioskId: string;
  counterDate: string; // YYYY-MM-DD
  lastNumber: number;
}

// ==========================================
// 4. Catalog & Menu Entities
// ==========================================

export interface MenuCategory {
  id: string;
  kioskId: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  kioskId: string;
  categoryId: string;
  name: string;
  description?: string | null;
  price: number; // Integer in Piasters (e.g. 2000 = 20.00 EGP)
  isAvailable: boolean;
  isUnderReview: boolean;
  preparationTimeMins: number;
  imageUrl?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 5. Order Entities & Items
// ==========================================

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId?: string | null;
  nameSnapshot: string;
  unitPriceSnapshot: number; // Integer in Piasters
  quantity: number;
  lineTotal: number; // Integer in Piasters (unitPriceSnapshot * quantity)
  specialInstructions?: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "#0042"
  orderDate: string; // YYYY-MM-DD
  studentId: string;
  kioskId: string;
  status: OrderStatus;
  idempotencyKey: string;

  // Financials in Piasters
  subtotal: number;
  discount: number;
  fees: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;

  // Operational & Queue Snapshots
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  ordersAheadSnapshot: number;
  studentNameSnapshot: string;
  studentCollegeSnapshot: string;
  kioskNameSnapshot: string;

  // Timeline Timestamps
  expiresAt: string;
  estimatedReadyAt?: string | null;
  acceptedAt?: string | null;
  preparingAt?: string | null;
  readyAt?: string | null;
  completedAt?: string | null;
  rejectedAt?: string | null;
  cancelledAt?: string | null;
  expiredAt?: string | null;
  noShowAt?: string | null;
  rating?: number | null;
  ratedAt?: string | null;
  createdAt: string;
  updatedAt: string;

  // Joined relations (optional in runtime responses)
  items?: OrderItem[];
  kiosk?: Kiosk;
  student?: Profile;
}

export interface OrderEvent {
  id: string;
  orderId: string;
  eventType: OrderEventType;
  fromStatus?: OrderStatus | null;
  toStatus?: OrderStatus | null;
  actorId?: string | null;
  actorType: ActorType;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ==========================================
// 6. Notification Entities
// ==========================================

export interface Notification {
  id: string;
  userId: string;
  orderId?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

// ==========================================
// 7. API DTOs & Batch Action Contracts
// ==========================================

export interface CreateOrderPayload {
  kioskId: string;
  items: {
    menuItemId: string;
    quantity: number;
    specialInstructions?: string;
  }[];
  paymentMethod?: PaymentMethod;
}

export interface BatchActionPayload {
  orderIds: string[];
}

export interface BatchActionResponse {
  successCount: number;
  failureCount: number;
  succeeded: string[];
  failed: {
    id: string;
    reason: string;
    code: string;
  }[];
}

export interface KioskDashboardStats {
  incomingCount: number;
  activeCount: number;
  todayCompletedCount: number;
  todaySalesPiasters: number;
  unavailableItemsCount: number;
  totalMenuItemsCount: number;
}

export interface AdminAnalyticsSummary {
  totalOrdersCount: number;
  completedOrdersCount: number;
  totalKioskSalesPiasters: number;
  totalFeeRevenuePiasters: number;
  totalGrossVolumePiasters: number;
  avgFeePiasters: number;
  avgOrderTotalPiasters: number;
  todayCompletedCount: number;
  todaySalesPiasters: number;
  todayFeeRevenuePiasters: number;
  monthFeeRevenuePiasters: number;
}

export interface AdminKioskAnalytics {
  kioskId: string;
  kioskName: string;
  kioskCategory: string;
  kioskRating: number;
  kioskRatingCount: number;
  completedOrdersCount: number;
  kioskSalesPiasters: number;
  feeRevenuePiasters: number;
  grossVolumePiasters: number;
}

export interface AdminPaymentAnalytics {
  paymentMethod: string;
  ordersCount: number;
  kioskSalesPiasters: number;
  feeRevenuePiasters: number;
  grossVolumePiasters: number;
}

export interface AdminDailyAnalytics {
  date: string;
  completedOrders: number;
  kioskSalesPiasters: number;
  feeRevenuePiasters: number;
  grossVolumePiasters: number;
}

export interface AdminAnalyticsResponse {
  timeframe: 'all' | 'today' | 'week' | 'month';
  summary: AdminAnalyticsSummary;
  statusDistribution: Record<string, number>;
  kioskBreakdown: AdminKioskAnalytics[];
  paymentBreakdown: AdminPaymentAnalytics[];
  dailyTimeline: AdminDailyAnalytics[];
}


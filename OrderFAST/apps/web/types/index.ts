export type UserRole = 'student' | 'cashier' | 'admin';

export type AccountStatus = 'active' | 'warning' | 'restricted';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  college?: string;
  phone?: string;
  createdAt: string;
}

export interface Student extends User {
  universityId: string;
  college: string;
  status: AccountStatus;
  noShowCount: number;
}

export interface Kiosk {
  id: string;
  name: string;
  collegeLocation: string;
  campusZone: string;
  category: string;
  isOpen: boolean;
  openingHours: string;
  estimatedWaitMins: number;
  ordersAheadCount: number;
  rating: number;
  ratingCount?: number;
  imageUrl?: string;
  acceptsOnlineOrders: boolean;
  isRushMode: boolean;
  defaultPrepTimeMins?: number;
  acceptanceTimeoutSecs?: number;
  phone?: string;
}

export interface MenuCategory {
  id: string;
  kioskId: string;
  name: string;
  displayOrder: number;
}

export interface MenuItem {
  id: string;
  kioskId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number; // in EGP
  originalPrice?: number; // in EGP (السعر قبل الخصم)
  offerTag?: string; // شارة مخصصة مثل "عرض خاص" أو "وفر 10 ج.م"
  isCombo?: boolean;
  comboItems?: { itemId: string; name: string; quantity: number }[];
  isAvailable: boolean;
  isUnderReview?: boolean; // For "قيد المراجعة" tag
  imageUrl?: string;
  preparationTimeMins?: number;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

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

export interface OrderItem {
  id: string;
  menuItemId?: string;
  name: string;
  price: number; // in EGP
  quantity: number;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "0247" or "#0248"
  studentId: string;
  studentName: string;
  studentCollege: string;
  kioskId: string;
  kioskName: string;
  items: OrderItem[];
  subtotal: number; // in EGP
  discount?: number; // in EGP
  fees?: number; // in EGP
  total: number; // in EGP
  status: OrderStatus;
  paymentMethod?: 'cash' | 'digital_wallet';
  paymentStatus?: 'pending_at_pickup' | 'paid' | 'waived';
  estimatedWaitMins: number;
  approximateOrdersAhead: number;
  rejectionReason?: string;
  cancellationReason?: string;
  expiresAt?: string;
  estimatedReadyAt?: string;
  createdAt: string;
  updatedAt: string;
  reviewTimeRemainingSeconds?: number;
  rating?: number | null;
  ratedAt?: string | null;
}

export type NotificationType = 'order_status' | 'kiosk_notice' | 'system' | 'warning';

export interface Notification {
  id: string;
  userId: string;
  userRole: UserRole;
  title: string;
  body: string;
  type: NotificationType;
  orderId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface KioskAssignment {
  id: string;
  kioskId: string;
  role: string;
  kioskName: string;
  kioskLocation: string;
  kioskIsOpen: boolean;
}

export interface Cashier extends User {
  kioskId: string;
  kioskName: string;
  staffAssignments?: KioskAssignment[];
}

export interface Admin extends User {
  permissions?: string[];
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


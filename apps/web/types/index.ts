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
  imageUrl?: string;
  acceptsOnlineOrders: boolean;
  isRushMode: boolean;
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
  | 'placed'
  | 'pending_review'
  | 'accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'rejected'
  | 'no_show'
  | 'expired';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
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
  subtotal: number;
  total: number;
  status: OrderStatus;
  estimatedWaitMins: number;
  approximateOrdersAhead: number;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  reviewTimeRemainingSeconds?: number;
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

export interface Cashier extends User {
  kioskId: string;
  kioskName: string;
}

export interface Admin extends User {
  permissions?: string[];
}

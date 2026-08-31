import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  date,
  pgEnum,
  jsonb,
  uniqueIndex,
  index,
  primaryKey,
  check,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';

// ==========================================
// 1. Enums Definition
// ==========================================

export const systemRoleEnum = pgEnum('system_role_enum', ['student', 'staff', 'admin']);
export const accountStatusEnum = pgEnum('account_status_enum', ['active', 'warning', 'restricted']);
export const kioskRoleEnum = pgEnum('kiosk_role_enum', ['owner', 'cashier']);
export const orderStatusEnum = pgEnum('order_status_enum', [
  'PENDING_KIOSK',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'COMPLETED',
  'REJECTED',
  'EXPIRED',
  'CANCELLED',
  'NO_SHOW',
]);
export const paymentMethodEnum = pgEnum('payment_method_enum', ['cash', 'digital_wallet']);
export const paymentStatusEnum = pgEnum('payment_status_enum', ['pending_at_pickup', 'paid', 'waived']);
export const notificationTypeEnum = pgEnum('notification_type_enum', ['order_status', 'kiosk_notice', 'system', 'warning']);
export const actorTypeEnum = pgEnum('actor_type_enum', ['student', 'staff', 'admin', 'system']);

// ==========================================
// 2. Profiles Table (1:1 with auth.users)
// ==========================================

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // maps to auth.users.id
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  systemRole: systemRoleEnum('system_role').notNull().default('student'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ==========================================
// 3. Students Table (Profile Extension)
// ==========================================

export const students = pgTable('students', {
  id: uuid('id').primaryKey().references(() => profiles.id, { onDelete: 'cascade' }),
  universityId: text('university_id').notNull().unique(),
  college: text('college').notNull(),
  accountStatus: accountStatusEnum('account_status').notNull().default('active'),
  noShowCount: integer('no_show_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  noShowCheck: check('no_show_positive_check', sql`${table.noShowCount} >= 0`),
}));

// ==========================================
// 4. Kiosks Table
// ==========================================

export const kiosks = pgTable('kiosks', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  collegeLocation: text('college_location').notNull(),
  campusZone: text('campus_zone'),
  category: text('category').notNull().default('عام'),
  isOpen: boolean('is_open').notNull().default(false),
  acceptsOnlineOrders: boolean('accepts_online_orders').notNull().default(true),
  isRushMode: boolean('is_rush_mode').notNull().default(false),
  openingHours: text('opening_hours').notNull().default('8:00 ص - 4:00 م'),
  phone: text('phone'),
  rating: numeric('rating', { precision: 3, scale: 2 }).notNull().default('5.00'),
  defaultPrepTimeMins: integer('default_prep_time_mins').notNull().default(15),
  acceptanceTimeoutSecs: integer('acceptance_timeout_secs').notNull().default(300),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  defaultPrepCheck: check('prep_time_check', sql`${table.defaultPrepTimeMins} > 0`),
  timeoutCheck: check('timeout_check', sql`${table.acceptanceTimeoutSecs} >= 60`),
  ratingCheck: check('rating_bounds_check', sql`${table.rating} >= 0 AND ${table.rating} <= 5`),
}));

// ==========================================
// 5. Kiosk Staff Table (M:N Staff Assignment)
// ==========================================

export const kioskStaff = pgTable('kiosk_staff', {
  id: uuid('id').primaryKey().defaultRandom(),
  kioskId: uuid('kiosk_id').notNull().references(() => kiosks.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  role: kioskRoleEnum('role').notNull().default('cashier'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  kioskUserUnique: uniqueIndex('idx_kiosk_staff_unique').on(table.kioskId, table.userId),
}));

// ==========================================
// 6. Kiosk Daily Counters (For Atomic Order Numbers)
// ==========================================

export const kioskDailyCounters = pgTable('kiosk_daily_counters', {
  kioskId: uuid('kiosk_id').notNull().references(() => kiosks.id, { onDelete: 'cascade' }),
  counterDate: date('counter_date').notNull().default(sql`CURRENT_DATE`),
  lastNumber: integer('last_number').notNull().default(0),
}, (table) => ({
  pk: primaryKey({ columns: [table.kioskId, table.counterDate] }),
}));

// ==========================================
// 7. Menu Categories Table
// ==========================================

export const menuCategories = pgTable('menu_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  kioskId: uuid('kiosk_id').notNull().references(() => kiosks.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  displayOrder: integer('display_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  kioskCategoryIndex: index('idx_menu_categories_kiosk').on(table.kioskId, table.displayOrder),
}));

// ==========================================
// 8. Menu Items Table
// ==========================================

export const menuItems = pgTable('menu_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  kioskId: uuid('kiosk_id').notNull().references(() => kiosks.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => menuCategories.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  price: integer('price').notNull(), // in Piasters (e.g. 2000 = 20 EGP)
  isAvailable: boolean('is_available').notNull().default(true),
  isUnderReview: boolean('is_under_review').notNull().default(true),
  preparationTimeMins: integer('preparation_time_mins').notNull().default(5),
  imageUrl: text('image_url'),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  priceCheck: check('item_price_check', sql`${table.price} > 0`),
  prepCheck: check('item_prep_time_check', sql`${table.preparationTimeMins} > 0`),
  studentBrowseIdx: index('idx_menu_items_student_browse')
    .on(table.kioskId, table.categoryId)
    .where(sql`${table.isDeleted} = false AND ${table.isAvailable} = true AND ${table.isUnderReview} = false`),
  underReviewIdx: index('idx_menu_items_under_review')
    .on(table.createdAt)
    .where(sql`${table.isUnderReview} = true AND ${table.isDeleted} = false`),
}));

// ==========================================
// 9. Orders Table
// ==========================================

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: text('order_number').notNull(),
  orderDate: date('order_date').notNull().default(sql`CURRENT_DATE`),
  studentId: uuid('student_id').notNull().references(() => profiles.id),
  kioskId: uuid('kiosk_id').notNull().references(() => kiosks.id),
  status: orderStatusEnum('status').notNull().default('PENDING_KIOSK'),
  idempotencyKey: uuid('idempotency_key').notNull().unique(),

  // Financials (Piasters)
  subtotal: integer('subtotal').notNull(),
  discount: integer('discount').notNull().default(0),
  fees: integer('fees').notNull().default(0),
  total: integer('total').notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull().default('cash'),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('pending_at_pickup'),

  // Operational & Queue Snapshots
  rejectionReason: text('rejection_reason'),
  cancellationReason: text('cancellation_reason'),
  ordersAheadSnapshot: integer('orders_ahead_snapshot').notNull().default(0),
  studentNameSnapshot: text('student_name_snapshot').notNull(),
  studentCollegeSnapshot: text('student_college_snapshot').notNull(),
  kioskNameSnapshot: text('kiosk_name_snapshot').notNull(),

  // Timeline Timestamps
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  estimatedReadyAt: timestamp('estimated_ready_at', { withTimezone: true }),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  preparingAt: timestamp('preparing_at', { withTimezone: true }),
  readyAt: timestamp('ready_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  rejectedAt: timestamp('rejected_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  expiredAt: timestamp('expired_at', { withTimezone: true }),
  noShowAt: timestamp('no_show_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  subtotalCheck: check('order_subtotal_check', sql`${table.subtotal} >= 0`),
  discountCheck: check('order_discount_check', sql`${table.discount} >= 0`),
  feesCheck: check('order_fees_check', sql`${table.fees} >= 0`),
  totalCheck: check('order_total_calc_check', sql`${table.total} = ${table.subtotal} - ${table.discount} + ${table.fees}`),
  kioskDailyOrderUnique: uniqueIndex('idx_orders_kiosk_daily_num').on(table.kioskId, table.orderDate, table.orderNumber),

  // Targeted Real-World Performance Indexes
  kioskActiveIdx: index('idx_orders_kiosk_active').on(table.kioskId, table.status, table.createdAt),
  kioskIncomingIdx: index('idx_orders_kiosk_incoming').on(table.kioskId, table.createdAt).where(sql`${table.status} = 'PENDING_KIOSK'`),
  studentHistoryIdx: index('idx_orders_student_history').on(table.studentId, table.createdAt),
  pendingExpiryIdx: index('idx_orders_pending_expiry').on(table.expiresAt).where(sql`${table.status} = 'PENDING_KIOSK'`),
  kioskActiveQueueIdx: index('idx_orders_kiosk_active_queue').on(table.kioskId, table.createdAt).where(sql`${table.status} IN ('ACCEPTED', 'PREPARING')`),
}));

// ==========================================
// 10. Order Items Table (Snapshots)
// ==========================================

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  menuItemId: uuid('menu_item_id').references(() => menuItems.id, { onDelete: 'set null' }),
  nameSnapshot: text('name_snapshot').notNull(),
  unitPriceSnapshot: integer('unit_price_snapshot').notNull(), // Piasters
  quantity: integer('quantity').notNull(),
  lineTotal: integer('line_total').notNull(), // Piasters
  specialInstructions: text('special_instructions'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  unitPriceCheck: check('order_item_price_check', sql`${table.unitPriceSnapshot} > 0`),
  quantityCheck: check('order_item_qty_check', sql`${table.quantity} > 0`),
  lineTotalCheck: check('order_item_line_total_check', sql`${table.lineTotal} = ${table.unitPriceSnapshot} * ${table.quantity}`),
  orderIndex: index('idx_order_items_order_id').on(table.orderId),
}));

// ==========================================
// 11. Order Events Table (Immutable Audit Log)
// ==========================================

export const orderEvents = pgTable('order_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  fromStatus: orderStatusEnum('from_status'),
  toStatus: orderStatusEnum('to_status'),
  actorId: uuid('actor_id').references(() => profiles.id),
  actorType: actorTypeEnum('actor_type').notNull(),
  metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  orderEventIdx: index('idx_order_events_order_id').on(table.orderId, table.createdAt),
}));

// ==========================================
// 12. Notifications Table (In-App Inbox)
// ==========================================

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userUnreadIdx: index('idx_notifications_user_unread').on(table.userId, table.createdAt).where(sql`${table.isRead} = false`),
}));

// ==========================================
// 13. Drizzle Relations Mapping
// ==========================================

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  student: one(students, {
    fields: [profiles.id],
    references: [students.id],
  }),
  kioskStaff: many(kioskStaff),
  orders: many(orders),
  notifications: many(notifications),
}));

export const kiosksRelations = relations(kiosks, ({ many }) => ({
  staff: many(kioskStaff),
  categories: many(menuCategories),
  items: many(menuItems),
  orders: many(orders),
}));

export const menuCategoriesRelations = relations(menuCategories, ({ one, many }) => ({
  kiosk: one(kiosks, {
    fields: [menuCategories.kioskId],
    references: [kiosks.id],
  }),
  items: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  kiosk: one(kiosks, {
    fields: [menuItems.kioskId],
    references: [kiosks.id],
  }),
  category: one(menuCategories, {
    fields: [menuItems.categoryId],
    references: [menuCategories.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  student: one(profiles, {
    fields: [orders.studentId],
    references: [profiles.id],
  }),
  kiosk: one(kiosks, {
    fields: [orders.kioskId],
    references: [kiosks.id],
  }),
  items: many(orderItems),
  events: many(orderEvents),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
}));

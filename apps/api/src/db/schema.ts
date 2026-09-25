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

export const universityEnum = pgEnum('university_enum', ['sphinx', 'assiut_ahleya']);
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
export const paymentStatusEnum = pgEnum('payment_status_enum', ['pending_at_pickup', 'pending_verification', 'paid', 'waived']);
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
  university: universityEnum('university').notNull().default('sphinx'),
  universityId: text('university_id').notNull().unique(),
  college: text('college').notNull(),
  accountStatus: accountStatusEnum('account_status').notNull().default('active'),
  noShowCount: integer('no_show_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  noShowCheck: check('no_show_positive_check', sql`${table.noShowCount} >= 0`),
  universityIdx: index('idx_students_university').on(table.university),
}));

// ==========================================
// 4. Kiosks Table
// ==========================================

export const kiosks = pgTable('kiosks', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  university: universityEnum('university').notNull().default('sphinx'),
  collegeLocation: text('college_location').notNull(),
  campusZone: text('campus_zone'),
  category: text('category').notNull().default('عام'),
  isOpen: boolean('is_open').notNull().default(false),
  isHidden: boolean('is_hidden').notNull().default(false),
  acceptsOnlineOrders: boolean('accepts_online_orders').notNull().default(true),
  acceptsCash: boolean('accepts_cash').notNull().default(true),
  acceptsOnline: boolean('accepts_online').notNull().default(false),
  paymentPolicy: text('payment_policy').notNull().default('both'),
  walletNumber: text('wallet_number'),
  instapayHandle: text('instapay_handle'),
  acceptsWallet: boolean('accepts_wallet').notNull().default(true),
  acceptsInstapay: boolean('accepts_instapay').notNull().default(true),
  isRushMode: boolean('is_rush_mode').notNull().default(false),
  openingHours: text('opening_hours').notNull().default('8:00 ص - 4:00 م'),
  phone: text('phone'),
  rating: numeric('rating', { precision: 3, scale: 2 }).notNull().default('0.00'),
  ratingCount: integer('rating_count').notNull().default(0),
  defaultPrepTimeMins: integer('default_prep_time_mins').notNull().default(15),
  acceptanceTimeoutSecs: integer('acceptance_timeout_secs').notNull().default(300),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  defaultPrepCheck: check('prep_time_check', sql`${table.defaultPrepTimeMins} > 0`),
  timeoutCheck: check('timeout_check', sql`${table.acceptanceTimeoutSecs} >= 60`),
  ratingCheck: check('rating_bounds_check', sql`${table.rating} >= 0 AND ${table.rating} <= 5`),
  universityIdx: index('idx_kiosks_university').on(table.university),
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
  originalPrice: integer('original_price'), // in Piasters (e.g. 3500 = 35 EGP) before discount
  offerTag: text('offer_tag'), // e.g. "عرض خاص", "وفر 10 ج.م"
  isCombo: boolean('is_combo').notNull().default(false),
  comboItems: jsonb('combo_items').$type<{ itemId: string; name: string; quantity: number }[]>(),
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
  orderNotes: text('order_notes'),
  onlinePaymentType: text('online_payment_type'),
  transferSenderPhone: text('transfer_sender_phone'),
  transferAmount: integer('transfer_amount'),
  transferImageUrl: text('transfer_image_url'),
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
  rating: integer('rating'),
  ratedAt: timestamp('rated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  subtotalCheck: check('order_subtotal_check', sql`${table.subtotal} >= 0`),
  discountCheck: check('order_discount_check', sql`${table.discount} >= 0`),
  feesCheck: check('order_fees_check', sql`${table.fees} >= 0`),
  totalCheck: check('order_total_calc_check', sql`${table.total} = ${table.subtotal} - ${table.discount} + ${table.fees}`),
  ratingBoundsCheck: check('order_rating_bounds_check', sql`${table.rating} IS NULL OR (${table.rating} >= 1 AND ${table.rating} <= 5)`),
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
// 12b. User Device Tokens Table (FCM Push)
// ==========================================

export const userDeviceTokens = pgTable('user_device_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  guestId: text('guest_id'),
  browserInfo: text('browser_info'),
  token: text('token').notNull(),
  platform: text('platform').notNull().default('android'),
  isActive: boolean('is_active').notNull().default(true),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userTokenIdx: index('idx_user_device_tokens_user_id').on(table.userId),
  tokenUniqueIdx: uniqueIndex('idx_user_device_tokens_token').on(table.token),
}));

// ==========================================
// 12c. Marketing Campaigns Table (Push Broadcasts)
// ==========================================

export const marketingCampaigns = pgTable('marketing_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  targetType: text('target_type').notNull().default('all'), // 'all' | 'single_user' | 'college' | 'university'
  targetValue: text('target_value'),
  actionUrl: text('action_url'),
  imageUrl: text('image_url'),
  sentCount: integer('sent_count').notNull().default(0),
  failedCount: integer('failed_count').notNull().default(0),
  createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  createdAtIdx: index('idx_marketing_campaigns_created_at').on(table.createdAt),
}));

// ==========================================
// 13. League Enums
// ==========================================

export const leagueSeasonStatusEnum = pgEnum('league_season_status_enum', ['upcoming', 'active', 'ended']);
export const leaguePointReasonEnum = pgEnum('league_point_reason_enum', ['tier_1', 'tier_2', 'tier_3', 'first_order', 'reversal']);

// ==========================================
// 14. League Seasons Table
// ==========================================

export const leagueSeasons = pgTable('league_seasons', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  status: leagueSeasonStatusEnum('status').notNull().default('upcoming'),
  // Configurable point tier thresholds (in piasters)
  tier1MaxPiasters: integer('tier1_max_piasters').notNull().default(10000),   // < 100 EGP → 1 point
  tier2MaxPiasters: integer('tier2_max_piasters').notNull().default(20000),   // 100-199 EGP → 2 points
  // >= tier2MaxPiasters → 3 points
  firstOrderPoints: integer('first_order_points').notNull().default(5),
  minOrdersForPrize: integer('min_orders_for_prize').notNull().default(5),
  maxPointsOrdersPerDay: integer('max_points_orders_per_day').notNull().default(3),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  statusIdx: index('idx_league_seasons_status').on(table.status),
  endsAtIdx: index('idx_league_seasons_ends_at').on(table.endsAt),
}));

// ==========================================
// 15. League Points Log Table (Auditable)
// ==========================================

export const leaguePointsLog = pgTable('league_points_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  seasonId: uuid('season_id').notNull().references(() => leagueSeasons.id, { onDelete: 'cascade' }),
  points: integer('points').notNull(),
  reason: leaguePointReasonEnum('reason').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  studentSeasonIdx: index('idx_league_points_student_season').on(table.studentId, table.seasonId),
  orderIdx: index('idx_league_points_order').on(table.orderId),
  seasonIdx: index('idx_league_points_season').on(table.seasonId),
}));

// ==========================================
// 16. League Standings Table (Incrementally Maintained)
// ==========================================

export const leagueStandings = pgTable('league_standings', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  seasonId: uuid('season_id').notNull().references(() => leagueSeasons.id, { onDelete: 'cascade' }),
  totalPoints: integer('total_points').notNull().default(0),
  ordersCount: integer('orders_count').notNull().default(0),
  lastPointAt: timestamp('last_point_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  studentSeasonUnique: uniqueIndex('idx_league_standings_student_season').on(table.studentId, table.seasonId),
  seasonRankIdx: index('idx_league_standings_season_rank').on(table.seasonId, table.totalPoints),
}));

// ==========================================
// 17. League Prizes Table
// ==========================================

export const leaguePrizes = pgTable('league_prizes', {
  id: uuid('id').primaryKey().defaultRandom(),
  seasonId: uuid('season_id').notNull().references(() => leagueSeasons.id, { onDelete: 'cascade' }),
  rank: integer('rank').notNull(),
  description: text('description').notNull(),
  sponsorKioskId: uuid('sponsor_kiosk_id').references(() => kiosks.id, { onDelete: 'set null' }),
  claimedBy: uuid('claimed_by').references(() => profiles.id, { onDelete: 'set null' }),
  claimedAt: timestamp('claimed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  seasonRankIdx: index('idx_league_prizes_season_rank').on(table.seasonId, table.rank),
}));

// ==========================================
// 18. Drizzle Relations Mapping
// ==========================================

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  student: one(students, {
    fields: [profiles.id],
    references: [students.id],
  }),
  kioskStaff: many(kioskStaff),
  orders: many(orders),
  notifications: many(notifications),
  deviceTokens: many(userDeviceTokens),
  leaguePointsLog: many(leaguePointsLog),
  leagueStandings: many(leagueStandings),
}));

export const userDeviceTokensRelations = relations(userDeviceTokens, ({ one }) => ({
  profile: one(profiles, {
    fields: [userDeviceTokens.userId],
    references: [profiles.id],
  }),
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

// ==========================================
// League Relations
// ==========================================

export const leagueSeasonsRelations = relations(leagueSeasons, ({ many }) => ({
  pointsLog: many(leaguePointsLog),
  standings: many(leagueStandings),
  prizes: many(leaguePrizes),
}));

export const leaguePointsLogRelations = relations(leaguePointsLog, ({ one }) => ({
  student: one(profiles, {
    fields: [leaguePointsLog.studentId],
    references: [profiles.id],
  }),
  order: one(orders, {
    fields: [leaguePointsLog.orderId],
    references: [orders.id],
  }),
  season: one(leagueSeasons, {
    fields: [leaguePointsLog.seasonId],
    references: [leagueSeasons.id],
  }),
}));

export const leagueStandingsRelations = relations(leagueStandings, ({ one }) => ({
  student: one(profiles, {
    fields: [leagueStandings.studentId],
    references: [profiles.id],
  }),
  season: one(leagueSeasons, {
    fields: [leagueStandings.seasonId],
    references: [leagueSeasons.id],
  }),
}));

export const leaguePrizesRelations = relations(leaguePrizes, ({ one }) => ({
  season: one(leagueSeasons, {
    fields: [leaguePrizes.seasonId],
    references: [leagueSeasons.id],
  }),
  sponsorKiosk: one(kiosks, {
    fields: [leaguePrizes.sponsorKioskId],
    references: [kiosks.id],
  }),
  winner: one(profiles, {
    fields: [leaguePrizes.claimedBy],
    references: [profiles.id],
  }),
}));


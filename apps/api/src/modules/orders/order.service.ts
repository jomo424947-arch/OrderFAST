import { eq, and, sql, desc, asc, inArray } from 'drizzle-orm';
import { db } from '../../db/client.js';
import {
  orders,
  orderItems,
  orderEvents,
  kiosks,
  menuItems,
  kioskDailyCounters,
  profiles,
  students,
  notifications,
  kioskStaff,
} from '../../db/schema.js';
import { AppError } from '../../shared/errors/index.js';
import { generateId } from '../../shared/id/index.js';
import type {
  CreateOrderInput,
  AcceptOrderInput,
  RejectOrderInput,
  CancelOrderInput,
  BatchActionInput,
} from '@orderfast/validation';
import type {
  OrderStatus,
  BatchActionResponse,
} from '@orderfast/types';
import type { AuthenticatedUser } from '../../shared/middleware/auth.js';

export class OrderService {
  /**
   * Helper: Verifies that the staff member belongs to the specific kiosk
   */
  private async verifyStaffKioskAccess(
    txOrDb: any,
    kioskId: string,
    user: AuthenticatedUser
  ) {
    if (user.systemRole === 'admin') return;

    if (user.systemRole !== 'staff') {
      throw AppError.forbidden('هذا الإجراء متاح فقط للعاملين بالأكشاك');
    }

    const [staff] = await txOrDb
      .select({ id: kioskStaff.id })
      .from(kioskStaff)
      .where(
        and(
          eq(kioskStaff.kioskId, kioskId),
          eq(kioskStaff.userId, user.id),
          eq(kioskStaff.isActive, true)
        )
      )
      .limit(1);

    if (!staff) {
      throw AppError.forbidden('ليس لديك صلاحية لإدارة طلبات هذا الكشك');
    }
  }

  /**
   * 1. CREATE ORDER (Atomic Transaction with FOR SHARE Row Locks)
   */
  async createOrder(
    studentId: string,
    input: CreateOrderInput,
    idempotencyKey: string
  ) {
    return await db.transaction(async (tx) => {
      // Step 1: Idempotency Check
      const [existingOrder] = await tx
        .select()
        .from(orders)
        .where(eq(orders.idempotencyKey, idempotencyKey))
        .limit(1);

      if (existingOrder) {
        const items = await tx
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, existingOrder.id));

        // Verify that existing order matches the request payload (Anti-Conflict Check)
        const isSameStudent = existingOrder.studentId === studentId;
        const isSameKiosk = existingOrder.kioskId === input.kioskId;
        const isSameItemCount = items.length === input.items.length;
        const isSameItems =
          isSameItemCount &&
          input.items.every((reqItem) => {
            const matched = items.find((i) => i.menuItemId === reqItem.menuItemId);
            return matched && matched.quantity === reqItem.quantity;
          });

        if (!isSameStudent || !isSameKiosk || !isSameItems) {
          throw AppError.conflict(
            'مفتاح عدم التكرار مستخدم مسبقاً مع بيانات طلب مختلفة',
            'IDEMPOTENCY_CONFLICT'
          );
        }

        return {
          isDuplicate: true,
          order: { ...existingOrder, items },
        };
      }

      // Step 2: Verify Student Profile & Active Status
      const [studentProfile] = await tx
        .select({
          id: profiles.id,
          fullName: profiles.fullName,
          college: students.college,
          accountStatus: students.accountStatus,
        })
        .from(profiles)
        .innerJoin(students, eq(profiles.id, students.id))
        .where(eq(profiles.id, studentId))
        .limit(1);

      if (!studentProfile) {
        throw AppError.notFound('بيانات الطالب غير موجودة');
      }

      if (studentProfile.accountStatus === 'restricted') {
        throw AppError.conflict(
          'حسابك مقيد مؤقتاً لعدم الحضور لاستلام طلبات سابقة',
          'ACCOUNT_RESTRICTED'
        );
      }

      // Step 3: Lock Kiosk Record (FOR SHARE)
      const [kiosk] = await tx
        .select()
        .from(kiosks)
        .where(
          and(
            eq(kiosks.id, input.kioskId),
            eq(kiosks.isOpen, true),
            eq(kiosks.acceptsOnlineOrders, true)
          )
        )
        .for('share');

      if (!kiosk) {
        throw AppError.conflict(
          'الكشك مغلق حالياً أو لا يستقبل طلبات جديدة',
          'KIOSK_CLOSED'
        );
      }

      // Step 4: Lock Menu Items (FOR SHARE) & Verify Availability
      const requestedItemIds = input.items.map((i) => i.menuItemId);
      const dbMenuItems = await tx
        .select()
        .from(menuItems)
        .where(
          and(
            inArray(menuItems.id, requestedItemIds),
            eq(menuItems.kioskId, input.kioskId)
          )
        )
        .for('share');

      if (dbMenuItems.length !== requestedItemIds.length) {
        throw AppError.notFound('بعض الأصناف المطلوبة غير موجودة في هذا الكشك');
      }

      // Check if any item is unavailable, under review, or deleted
      const unavailableItems = dbMenuItems.filter(
        (item) => !item.isAvailable || item.isUnderReview || item.isDeleted
      );

      if (unavailableItems.length > 0) {
        const itemNames = unavailableItems.map((i) => i.name).join('، ');
        throw AppError.conflict(
          `عذراً، الأصناف التالية غير متاحة حالياً: ${itemNames}`,
          'ITEM_UNAVAILABLE',
          { unavailableItems: unavailableItems.map((i) => ({ id: i.id, name: i.name })) }
        );
      }

      // Step 5: Authoritative Price Calculation in Integer Piasters
      let subtotal = 0;
      const orderItemsToInsert: Array<{
        id: string;
        orderId: string;
        menuItemId: string;
        nameSnapshot: string;
        unitPriceSnapshot: number;
        quantity: number;
        lineTotal: number;
        specialInstructions: string | null;
      }> = [];

      const orderId = generateId();

      for (const reqItem of input.items) {
        const menuItem = dbMenuItems.find((m) => m.id === reqItem.menuItemId)!;
        const lineTotal = menuItem.price * reqItem.quantity;
        subtotal += lineTotal;

        orderItemsToInsert.push({
          id: generateId(),
          orderId,
          menuItemId: menuItem.id,
          nameSnapshot: menuItem.name,
          unitPriceSnapshot: menuItem.price,
          quantity: reqItem.quantity,
          lineTotal,
          specialInstructions: reqItem.specialInstructions || null,
        });
      }

      const discount = 0;
      const fees = 0;
      const total = subtotal - discount + fees;

      // Step 6: Atomic Order Number Generation (kiosk_daily_counters)
      const [counter] = await tx
        .insert(kioskDailyCounters)
        .values({
          kioskId: input.kioskId,
          counterDate: sql`CURRENT_DATE`,
          lastNumber: 1,
        })
        .onConflictDoUpdate({
          target: [kioskDailyCounters.kioskId, kioskDailyCounters.counterDate],
          set: {
            lastNumber: sql`${kioskDailyCounters.lastNumber} + 1`,
          },
        })
        .returning({ lastNumber: kioskDailyCounters.lastNumber });

      const paddedNumber = String(counter.lastNumber).padStart(4, '0');
      const orderNumber = `#${paddedNumber}`;

      // Step 7: Calculate Orders Ahead Snapshot & Timeout
      const [activeQueueCount] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(
          and(
            eq(orders.kioskId, input.kioskId),
            inArray(orders.status, ['ACCEPTED', 'PREPARING'])
          )
        );

      const expiresAt = new Date(
        Date.now() + kiosk.acceptanceTimeoutSecs * 1000
      );

      // Step 8: Insert Order Row
      const [newOrder] = await tx
        .insert(orders)
        .values({
          id: orderId,
          orderNumber,
          studentId,
          kioskId: input.kioskId,
          status: 'PENDING_KIOSK',
          idempotencyKey,
          subtotal,
          discount,
          fees,
          total,
          paymentMethod: input.paymentMethod || 'cash',
          paymentStatus: 'pending_at_pickup',
          ordersAheadSnapshot: activeQueueCount?.count || 0,
          studentNameSnapshot: studentProfile.fullName,
          studentCollegeSnapshot: studentProfile.college,
          kioskNameSnapshot: kiosk.name,
          expiresAt,
        })
        .returning();

      // Step 9: Insert Order Items
      await tx.insert(orderItems).values(orderItemsToInsert);

      // Step 10: Insert Order Created Event
      await tx.insert(orderEvents).values({
        id: generateId(),
        orderId,
        eventType: 'ORDER_CREATED',
        toStatus: 'PENDING_KIOSK',
        actorId: studentId,
        actorType: 'student',
        metadata: {
          itemsCount: orderItemsToInsert.length,
          totalPiasters: total,
          orderNumber,
        },
      });

      // Step 11: Notify Kiosk Staff (In-App Notifications)
      const staffMembers = await tx
        .select({ userId: kioskStaff.userId })
        .from(kioskStaff)
        .where(
          and(eq(kioskStaff.kioskId, input.kioskId), eq(kioskStaff.isActive, true))
        );

      if (staffMembers.length > 0) {
        await tx.insert(notifications).values(
          staffMembers.map((staff) => ({
            id: generateId(),
            userId: staff.userId,
            orderId,
            type: 'order_status' as const,
            title: 'أوردر جديد وارد! 🔔',
            body: `أوردر جديد رقم ${orderNumber} من الطالب ${studentProfile.fullName} (${studentProfile.college}).`,
          }))
        );
      }

      return {
        isDuplicate: false,
        order: {
          ...newOrder,
          items: orderItemsToInsert,
        },
      };
    });
  }

  /**
   * 2. GET ORDER BY ID (With Live Queue Position Calculation)
   */
  async getOrderById(orderId: string, requestingUser?: AuthenticatedUser) {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw AppError.notFound('الطلب غير موجود');
    }

    // Access Check: Student must own the order OR staff belongs to kiosk OR admin
    if (requestingUser) {
      if (requestingUser.systemRole === 'student' && order.studentId !== requestingUser.id) {
        throw AppError.forbidden('ليس لديك صلاحية لعرض هذا الطلب');
      }
      if (requestingUser.systemRole === 'staff') {
        await this.verifyStaffKioskAccess(db, order.kioskId, requestingUser);
      }
    }

    // Fetch items
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    // Calculate Live Approximate Queue Position
    let liveOrdersAhead = 0;
    if (order.status === 'ACCEPTED' || order.status === 'PREPARING') {
      const [queueCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(
          and(
            eq(orders.kioskId, order.kioskId),
            inArray(orders.status, ['ACCEPTED', 'PREPARING']),
            sql`${orders.createdAt} < ${order.createdAt}`
          )
        );
      liveOrdersAhead = queueCount?.count || 0;
    }

    return {
      ...order,
      items,
      liveOrdersAhead,
    };
  }

  /**
   * Helper: Batched Order Items Populator (Eliminates N+1 DB Queries)
   * Fetches all items for a list of orders in 1 single batched database query.
   */
  private async populateOrderItems<T extends { id: string }>(ordersList: T[]): Promise<Array<T & { items: any[] }>> {
    if (!ordersList || ordersList.length === 0) {
      return [];
    }

    const orderIds = ordersList.map((o) => o.id);
    const allItems = await db
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds));

    const itemsMap = new Map<string, typeof allItems>();
    for (const item of allItems) {
      const list = itemsMap.get(item.orderId) || [];
      list.push(item);
      itemsMap.set(item.orderId, list);
    }

    return ordersList.map((o) => ({
      ...o,
      items: itemsMap.get(o.id) || [],
    }));
  }

  /**
   * 3. GET STUDENT ORDER HISTORY (Paginated - Batched Single DB Query)
   */
  async getStudentOrders(studentId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const studentOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.studentId, studentId))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    return this.populateOrderItems(studentOrders);
  }

  /**
   * 4. GET KIOSK INCOMING ORDERS (Pending Review - Batched Single DB Query)
   */
  async getKioskIncomingOrders(kioskId: string) {
    const pendingOrders = await db
      .select()
      .from(orders)
      .where(
        and(eq(orders.kioskId, kioskId), eq(orders.status, 'PENDING_KIOSK'))
      )
      .orderBy(asc(orders.createdAt));

    return this.populateOrderItems(pendingOrders);
  }

  /**
   * 5. GET KIOSK ACTIVE KITCHEN ORDERS (Accepted, Preparing, Ready - Batched Single DB Query)
   */
  async getKioskActiveOrders(kioskId: string) {
    const activeOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.kioskId, kioskId),
          inArray(orders.status, ['ACCEPTED', 'PREPARING', 'READY'])
        )
      )
      .orderBy(asc(orders.createdAt));

    return this.populateOrderItems(activeOrders);
  }

  /**
   * 6. ACCEPT ORDER (Cashier Action)
   */
  async acceptOrder(
    orderId: string,
    requestingUser: AuthenticatedUser,
    input?: AcceptOrderInput
  ) {
    return await db.transaction(async (tx) => {
      // 1. Get Kiosk Info
      const [existingOrder] = await tx
        .select({
          id: orders.id,
          kioskId: orders.kioskId,
          studentId: orders.studentId,
          orderNumber: orders.orderNumber,
          expiresAt: orders.expiresAt,
          kioskName: orders.kioskNameSnapshot,
        })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!existingOrder) {
        throw AppError.notFound('الطلب غير موجود');
      }

      // Check Staff Kiosk Ownership
      await this.verifyStaffKioskAccess(tx, existingOrder.kioskId, requestingUser);

      // Verify timeout hasn't passed
      if (new Date() > new Date(existingOrder.expiresAt)) {
        throw AppError.conflict(
          'انتهت مهلة قبول هذا الطلب وأصبح منتهي الصلاحية',
          'ORDER_EXPIRED'
        );
      }

      const [kiosk] = await tx
        .select({
          defaultPrepTimeMins: kiosks.defaultPrepTimeMins,
          isRushMode: kiosks.isRushMode,
        })
        .from(kiosks)
        .where(eq(kiosks.id, existingOrder.kioskId))
        .limit(1);

      const prepMins =
        input?.customPrepTimeMins ||
        (kiosk ? kiosk.defaultPrepTimeMins + (kiosk.isRushMode ? 5 : 0) : 15);

      const estimatedReadyAt = new Date(Date.now() + prepMins * 60 * 1000);

      // 2. Atomic Conditional State Transition
      const [updatedOrder] = await tx
        .update(orders)
        .set({
          status: 'ACCEPTED',
          acceptedAt: new Date(),
          estimatedReadyAt,
          updatedAt: new Date(),
        })
        .where(
          and(eq(orders.id, orderId), eq(orders.status, 'PENDING_KIOSK'))
        )
        .returning();

      if (!updatedOrder) {
        throw AppError.conflict(
          'الطلب لم يعد في حالة انتظار القبول (ربما تم قبوله أو رفضه مسبقاً)',
          'INVALID_STATE_TRANSITION'
        );
      }

      // 3. Insert Audit Event
      await tx.insert(orderEvents).values({
        id: generateId(),
        orderId,
        eventType: 'STATUS_CHANGED',
        fromStatus: 'PENDING_KIOSK',
        toStatus: 'ACCEPTED',
        actorId: requestingUser.id,
        actorType: 'staff',
        metadata: {
          prepTimeMins: prepMins,
          estimatedReadyAt: estimatedReadyAt.toISOString(),
        },
      });

      // 4. Notify Student
      await tx.insert(notifications).values({
        id: generateId(),
        userId: existingOrder.studentId,
        orderId,
        type: 'order_status',
        title: 'تم قبول طلبك! ☕',
        body: `${existingOrder.kioskName} قبل طلبك رقم ${existingOrder.orderNumber}. الوقت المتوقع: ${prepMins} دقيقة.`,
      });

      return updatedOrder;
    });
  }

  /**
   * 7. REJECT ORDER (Cashier Action)
   */
  async rejectOrder(
    orderId: string,
    requestingUser: AuthenticatedUser,
    input: RejectOrderInput
  ) {
    return await db.transaction(async (tx) => {
      const [existingOrder] = await tx
        .select({ kioskId: orders.kioskId })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!existingOrder) {
        throw AppError.notFound('الطلب غير موجود');
      }

      await this.verifyStaffKioskAccess(tx, existingOrder.kioskId, requestingUser);

      const [updatedOrder] = await tx
        .update(orders)
        .set({
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason: input.reason,
          updatedAt: new Date(),
        })
        .where(
          and(eq(orders.id, orderId), eq(orders.status, 'PENDING_KIOSK'))
        )
        .returning();

      if (!updatedOrder) {
        throw AppError.conflict(
          'الطلب لم يعد في حالة انتظار القبول',
          'INVALID_STATE_TRANSITION'
        );
      }

      // Event
      await tx.insert(orderEvents).values({
        id: generateId(),
        orderId,
        eventType: 'ORDER_REJECTED',
        fromStatus: 'PENDING_KIOSK',
        toStatus: 'REJECTED',
        actorId: requestingUser.id,
        actorType: 'staff',
        metadata: { reason: input.reason },
      });

      // Notify Student
      await tx.insert(notifications).values({
        id: generateId(),
        userId: updatedOrder.studentId,
        orderId,
        type: 'order_status',
        title: 'نعتذر، تم رفض الطلب ❌',
        body: `اعتذر ${updatedOrder.kioskNameSnapshot} عن تنفيذ الطلب رقم ${updatedOrder.orderNumber}. السبب: ${input.reason}`,
      });

      return updatedOrder;
    });
  }

  /**
   * 8. START PREPARING (Cashier Action)
   */
  async startPreparing(orderId: string, requestingUser: AuthenticatedUser) {
    return await db.transaction(async (tx) => {
      const [existingOrder] = await tx
        .select({ kioskId: orders.kioskId })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!existingOrder) {
        throw AppError.notFound('الطلب غير موجود');
      }

      await this.verifyStaffKioskAccess(tx, existingOrder.kioskId, requestingUser);

      const [updatedOrder] = await tx
        .update(orders)
        .set({
          status: 'PREPARING',
          preparingAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(eq(orders.id, orderId), eq(orders.status, 'ACCEPTED'))
        )
        .returning();

      if (!updatedOrder) {
        throw AppError.conflict(
          'الطلب يجب أن يكون مقبولاً أولاً لبدء التحضير',
          'INVALID_STATE_TRANSITION'
        );
      }

      await tx.insert(orderEvents).values({
        id: generateId(),
        orderId,
        eventType: 'STATUS_CHANGED',
        fromStatus: 'ACCEPTED',
        toStatus: 'PREPARING',
        actorId: requestingUser.id,
        actorType: 'staff',
        metadata: {},
      });

      return updatedOrder;
    });
  }

  /**
   * 9. MARK READY FOR PICKUP (Cashier Action)
   */
  async markReady(orderId: string, requestingUser: AuthenticatedUser) {
    return await db.transaction(async (tx) => {
      const [existingOrder] = await tx
        .select({ kioskId: orders.kioskId })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!existingOrder) {
        throw AppError.notFound('الطلب غير موجود');
      }

      await this.verifyStaffKioskAccess(tx, existingOrder.kioskId, requestingUser);

      const [updatedOrder] = await tx
        .update(orders)
        .set({
          status: 'READY',
          readyAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(orders.id, orderId),
            inArray(orders.status, ['ACCEPTED', 'PREPARING'])
          )
        )
        .returning();

      if (!updatedOrder) {
        throw AppError.conflict(
          'الطلب ليس قيد التحضير',
          'INVALID_STATE_TRANSITION'
        );
      }

      await tx.insert(orderEvents).values({
        id: generateId(),
        orderId,
        eventType: 'STATUS_CHANGED',
        fromStatus: updatedOrder.preparingAt ? 'PREPARING' : 'ACCEPTED',
        toStatus: 'READY',
        actorId: requestingUser.id,
        actorType: 'staff',
        metadata: {},
      });

      // Notify Student
      await tx.insert(notifications).values({
        id: generateId(),
        userId: updatedOrder.studentId,
        orderId,
        type: 'order_status',
        title: 'أوردرك جاهز للاستلام! 🎉',
        body: `طلبك رقم ${updatedOrder.orderNumber} جاهز الآن في ${updatedOrder.kioskNameSnapshot}. اتفضل بالاستلام والدفع.`,
      });

      return updatedOrder;
    });
  }

  /**
   * 10. COMPLETE ORDER (Student picked up & paid)
   */
  async completeOrder(orderId: string, requestingUser: AuthenticatedUser) {
    return await db.transaction(async (tx) => {
      const [existingOrder] = await tx
        .select({ kioskId: orders.kioskId })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!existingOrder) {
        throw AppError.notFound('الطلب غير موجود');
      }

      await this.verifyStaffKioskAccess(tx, existingOrder.kioskId, requestingUser);

      const [updatedOrder] = await tx
        .update(orders)
        .set({
          status: 'COMPLETED',
          completedAt: new Date(),
          paymentStatus: 'paid',
          updatedAt: new Date(),
        })
        .where(
          and(eq(orders.id, orderId), eq(orders.status, 'READY'))
        )
        .returning();

      if (!updatedOrder) {
        throw AppError.conflict(
          'الطلب يجب أن يكون بحالة جاهز للاستلام لإتمام التسليم',
          'INVALID_STATE_TRANSITION'
        );
      }

      await tx.insert(orderEvents).values({
        id: generateId(),
        orderId,
        eventType: 'STATUS_CHANGED',
        fromStatus: 'READY',
        toStatus: 'COMPLETED',
        actorId: requestingUser.id,
        actorType: 'staff',
        metadata: { paymentStatus: 'paid' },
      });

      await tx.insert(notifications).values({
        id: generateId(),
        userId: updatedOrder.studentId,
        orderId,
        type: 'order_status',
        title: 'تم استلام الأوردر بنجاح',
        body: `شكراً لطلبك من ${updatedOrder.kioskNameSnapshot}. بالهنا والشفا!`,
      });

      return updatedOrder;
    });
  }

  /**
   * 11. MARK NO SHOW (Student failed to pick up)
   */
  async markNoShow(orderId: string, requestingUser: AuthenticatedUser) {
    return await db.transaction(async (tx) => {
      const [existingOrder] = await tx
        .select({ kioskId: orders.kioskId })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!existingOrder) {
        throw AppError.notFound('الطلب غير موجود');
      }

      await this.verifyStaffKioskAccess(tx, existingOrder.kioskId, requestingUser);

      const [updatedOrder] = await tx
        .update(orders)
        .set({
          status: 'NO_SHOW',
          noShowAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(eq(orders.id, orderId), eq(orders.status, 'READY'))
        )
        .returning();

      if (!updatedOrder) {
        throw AppError.conflict(
          'يمكن تسجيل عدم الحضور فقط للطلبات الجاهزة للاستلام',
          'INVALID_STATE_TRANSITION'
        );
      }

      // Increment student no-show count & adjust account status:
      // 1 No-Show -> 'warning'
      // 2 or more No-Shows -> 'restricted' (banned from ordering)
      const [student] = await tx
        .update(students)
        .set({
          noShowCount: sql`${students.noShowCount} + 1`,
          accountStatus: sql`CASE 
            WHEN ${students.noShowCount} + 1 >= 2 THEN 'restricted'::account_status_enum
            WHEN ${students.noShowCount} + 1 = 1 THEN 'warning'::account_status_enum
            ELSE 'active'::account_status_enum
          END`,
          updatedAt: new Date(),
        })
        .where(eq(students.id, updatedOrder.studentId))
        .returning();

      const isRestrictedNow = student?.accountStatus === 'restricted';

      await tx.insert(orderEvents).values({
        id: generateId(),
        orderId,
        eventType: 'NO_SHOW_RECORDED',
        fromStatus: 'READY',
        toStatus: 'NO_SHOW',
        actorId: requestingUser.id,
        actorType: 'staff',
        metadata: {
          newNoShowCount: student?.noShowCount,
          newStatus: student?.accountStatus,
        },
      });

      await tx.insert(notifications).values({
        id: generateId(),
        userId: updatedOrder.studentId,
        orderId,
        type: isRestrictedNow ? 'system' : 'warning',
        title: isRestrictedNow ? 'تم تقييد وحظر حسابك 🚫' : 'تحذير: عدم استلام الأوردر ⚠️',
        body: isRestrictedNow
          ? `نظراً لتكرار عدم الحضور لاستلام الطلبات (الطلب رقم #${updatedOrder.orderNumber})، تم تقييد حسابك وحظرك من إرسال طلبات جديدة. يرجى مراجعة إدارة النظام لفك الحظر.`
          : `تم تسجيل عدم الحضور لاستلام الأوردر رقم #${updatedOrder.orderNumber}. تم توجيه تحذير لحسابك، ونرجو الالتزام بالاستلام حيث سيتم حظر الحساب وتقييده مباشرة في حال عدم استلام الطلب القادم.`,
      });

      return updatedOrder;
    });
  }

  /**
   * 12. STUDENT CANCEL ORDER (Only while PENDING_KIOSK)
   */
  async cancelOrderByStudent(
    orderId: string,
    studentId: string,
    input?: CancelOrderInput
  ) {
    return await db.transaction(async (tx) => {
      const [updatedOrder] = await tx
        .update(orders)
        .set({
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: input?.reason || 'إلغاء من قِبل الطالب قبل المراجعة',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(orders.id, orderId),
            eq(orders.studentId, studentId),
            eq(orders.status, 'PENDING_KIOSK')
          )
        )
        .returning();

      if (!updatedOrder) {
        throw AppError.conflict(
          'لا يمكن إلغاء الطلب بعد قبوله أو بدء تحضيره من الكشك',
          'INVALID_STATE_TRANSITION'
        );
      }

      await tx.insert(orderEvents).values({
        id: generateId(),
        orderId,
        eventType: 'ORDER_CANCELLED',
        fromStatus: 'PENDING_KIOSK',
        toStatus: 'CANCELLED',
        actorId: studentId,
        actorType: 'student',
        metadata: { reason: input?.reason },
      });

      return updatedOrder;
    });
  }

  /**
   * 13. BATCH ACCEPT ORDERS (Single TX + Partial Success)
   */
  async batchAcceptOrders(
    kioskId: string,
    requestingUser: AuthenticatedUser,
    input: BatchActionInput
  ): Promise<BatchActionResponse> {
    return await db.transaction(async (tx) => {
      await this.verifyStaffKioskAccess(tx, kioskId, requestingUser);

      const succeeded: string[] = [];
      const failed: Array<{ id: string; reason: string; code: string }> = [];

      for (const orderId of input.orderIds) {
        const [existing] = await tx
          .select({ status: orders.status, expiresAt: orders.expiresAt })
          .from(orders)
          .where(and(eq(orders.id, orderId), eq(orders.kioskId, kioskId)))
          .limit(1);

        if (!existing) {
          failed.push({ id: orderId, reason: 'الطلب غير موجود بالكشك', code: 'NOT_FOUND' });
          continue;
        }

        if (existing.status !== 'PENDING_KIOSK') {
          failed.push({ id: orderId, reason: 'الطلب ليس في حالة انتظار المراجعة', code: 'INVALID_STATE' });
          continue;
        }

        if (new Date() > new Date(existing.expiresAt)) {
          failed.push({ id: orderId, reason: 'انتهت صلاحية وقت المراجعة', code: 'ORDER_EXPIRED' });
          continue;
        }

        // Transition
        const [updated] = await tx
          .update(orders)
          .set({
            status: 'ACCEPTED',
            acceptedAt: new Date(),
            estimatedReadyAt: new Date(Date.now() + 15 * 60 * 1000),
            updatedAt: new Date(),
          })
          .where(
            and(eq(orders.id, orderId), eq(orders.status, 'PENDING_KIOSK'))
          )
          .returning({ id: orders.id });

        if (updated) {
          succeeded.push(orderId);
          await tx.insert(orderEvents).values({
            id: generateId(),
            orderId,
            eventType: 'STATUS_CHANGED',
            fromStatus: 'PENDING_KIOSK',
            toStatus: 'ACCEPTED',
            actorId: requestingUser.id,
            actorType: 'staff',
            metadata: { batchAction: true },
          });
        }
      }

      return {
        successCount: succeeded.length,
        failureCount: failed.length,
        succeeded,
        failed,
      };
    });
  }

  /**
   * 14. BATCH MARK READY (Single TX + Partial Success)
   */
  async batchMarkReady(
    kioskId: string,
    requestingUser: AuthenticatedUser,
    input: BatchActionInput
  ): Promise<BatchActionResponse> {
    return await db.transaction(async (tx) => {
      await this.verifyStaffKioskAccess(tx, kioskId, requestingUser);

      const succeeded: string[] = [];
      const failed: Array<{ id: string; reason: string; code: string }> = [];

      for (const orderId of input.orderIds) {
        const [updated] = await tx
          .update(orders)
          .set({
            status: 'READY',
            readyAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(orders.id, orderId),
              eq(orders.kioskId, kioskId),
              inArray(orders.status, ['ACCEPTED', 'PREPARING'])
            )
          )
          .returning({ id: orders.id, studentId: orders.studentId, orderNumber: orders.orderNumber });

        if (updated) {
          succeeded.push(orderId);
          await tx.insert(orderEvents).values({
            id: generateId(),
            orderId,
            eventType: 'STATUS_CHANGED',
            toStatus: 'READY',
            actorId: requestingUser.id,
            actorType: 'staff',
            metadata: { batchAction: true },
          });
        } else {
          failed.push({ id: orderId, reason: 'الطلب ليس قيد التحضير', code: 'INVALID_STATE' });
        }
      }

      return {
        successCount: succeeded.length,
        failureCount: failed.length,
        succeeded,
        failed,
      };
    });
  }

  /**
   * 15. BACKGROUND WORKER: Expire Timed-out Orders
   */
  async expirePendingOrders(): Promise<number> {
    const expiredOrders = await db
      .update(orders)
      .set({
        status: 'EXPIRED',
        expiredAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(orders.status, 'PENDING_KIOSK'),
          sql`${orders.expiresAt} < now()`
        )
      )
      .returning({ id: orders.id, studentId: orders.studentId, orderNumber: orders.orderNumber });

    if (expiredOrders.length > 0) {
      // Log events for all expired orders
      await db.insert(orderEvents).values(
        expiredOrders.map((o) => ({
          id: generateId(),
          orderId: o.id,
          eventType: 'STATUS_CHANGED',
          fromStatus: 'PENDING_KIOSK' as const,
          toStatus: 'EXPIRED' as const,
          actorType: 'system' as const,
          metadata: { autoExpired: true },
        }))
      );

      // Notify Students
      await db.insert(notifications).values(
        expiredOrders.map((o) => ({
          id: generateId(),
          userId: o.studentId,
          orderId: o.id,
          type: 'order_status' as const,
          title: 'انتهت مهلة الطلب ⌛',
          body: `نعتذر، لم يستجب الكشك خلال المهلة المحددة للطلب رقم ${o.orderNumber}. يمكنك إعادة الطلب أو اختيار كشك آخر.`,
        }))
      );
    }

    return expiredOrders.length;
  }

  /**
   * 16. ADMIN: Get Recent Orders Across All Kiosks
   */
  async getAdminRecentOrders(limit = 50, page = 1) {
    const offset = (page - 1) * limit;

    const allOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    return this.populateOrderItems(allOrders);
  }

  /**
   * 17. ADMIN: Get Campus-wide Executive Statistics
   */
  async getAdminCampusStats() {
    // Total orders count
    const [ordersCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders);

    // Total orders today
    const [todayCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(sql`${orders.orderDate} = CURRENT_DATE`);

    // Total today completed / active sales (Piasters)
    const [salesSum] = await db
      .select({ totalSales: sql<number>`coalesce(sum(${orders.total}), 0)::int` })
      .from(orders)
      .where(
        and(
          sql`${orders.orderDate} = CURRENT_DATE`,
          inArray(orders.status, ['ACCEPTED', 'PREPARING', 'READY', 'COMPLETED'])
        )
      );

    // Total active orders in kitchen
    const [activeCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(inArray(orders.status, ['PENDING_KIOSK', 'ACCEPTED', 'PREPARING', 'READY']));

    return {
      totalOrders: ordersCount?.count || 0,
      todayOrdersCount: todayCount?.count || 0,
      todaySalesPiasters: salesSum?.totalSales || 0,
      activeKitchenCount: activeCount?.count || 0,
    };
  }
}

export const orderService = new OrderService();


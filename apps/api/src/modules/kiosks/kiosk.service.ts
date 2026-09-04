import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { kiosks, orders, menuItems, kioskStaff, profiles } from '../../db/schema.js';
import { cacheService } from '../../shared/cache/index.js';
import { AppError } from '../../shared/errors/index.js';
import { generateId } from '../../shared/id/index.js';
import { getSupabaseAdmin } from '../../shared/supabase/index.js';
import type { KioskDashboardStats } from '@orderfast/types';

export class KioskService {
  /**
   * Retrieves all kiosks with cached results and live approximate queue counts
   */
  async getAllKiosks() {
    const cacheKey = 'kiosks:all';
    const cached = await cacheService.get<any[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const kioskList = await db
      .select()
      .from(kiosks)
      .orderBy(desc(kiosks.isOpen), desc(kiosks.rating));

    // Calculate approximate active orders for all kiosks in 1 aggregated query
    const activeCounts = await db
      .select({
        kioskId: orders.kioskId,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(inArray(orders.status, ['ACCEPTED', 'PREPARING']))
      .groupBy(orders.kioskId);

    const countsMap = new Map<string, number>(
      activeCounts.map((c) => [c.kioskId, c.count])
    );

    const kiosksWithQueue = kioskList.map((kiosk) => {
      const activeOrdersCount = kiosk.isOpen ? countsMap.get(kiosk.id) || 0 : 0;
      const estimatedWaitMins =
        kiosk.defaultPrepTimeMins + (kiosk.isRushMode ? 5 : 0);

      return {
        ...kiosk,
        rating: Number(kiosk.rating),
        ratingCount: kiosk.ratingCount || 0,
        estimatedWaitMins,
        ordersAheadCount: activeOrdersCount,
      };
    });

    // Cache for 30 seconds
    await cacheService.set(cacheKey, kiosksWithQueue, 30);
    return kiosksWithQueue;
  }

  /**
   * Retrieves a single kiosk by ID with active status
   */
  async getKioskById(kioskId: string) {
    const cacheKey = `kiosk:${kioskId}`;
    const cached = await cacheService.get<any>(cacheKey);

    if (cached) {
      return cached;
    }

    const [kiosk] = await db
      .select()
      .from(kiosks)
      .where(eq(kiosks.id, kioskId))
      .limit(1);

    if (!kiosk) {
      throw AppError.notFound('الكشك المحدد غير موجود');
    }

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(
        and(
          eq(orders.kioskId, kiosk.id),
          inArray(orders.status, ['ACCEPTED', 'PREPARING'])
        )
      );

    const result = {
      ...kiosk,
      rating: Number(kiosk.rating),
      ratingCount: kiosk.ratingCount || 0,
      estimatedWaitMins: kiosk.defaultPrepTimeMins + (kiosk.isRushMode ? 5 : 0),
      ordersAheadCount: countResult?.count || 0,
    };

    await cacheService.set(cacheKey, result, 30);
    return result;
  }

  /**
   * Updates kiosk open/closed and rush mode states
   */
  async updateKioskStatus(kioskId: string, isOpen: boolean, isRushMode?: boolean) {
    const updateData: Record<string, any> = {
      isOpen,
      updatedAt: new Date(),
    };

    if (typeof isRushMode === 'boolean') {
      updateData.isRushMode = isRushMode;
    }

    const [updated] = await db
      .update(kiosks)
      .set(updateData)
      .where(eq(kiosks.id, kioskId))
      .returning();

    if (!updated) {
      throw AppError.notFound('الكشك غير موجود');
    }

    // Invalidate caches
    await cacheService.del('kiosks:all');
    await cacheService.del(`kiosk:${kioskId}`);

    return {
      ...updated,
      rating: Number(updated.rating),
    };
  }

  /**
   * Updates kiosk operational settings (wait time, hours, phone)
   */
  async updateKioskSettings(
    kioskId: string,
    settings: {
      openingHours?: string;
      defaultPrepTimeMins?: number;
      acceptanceTimeoutSecs?: number;
      phone?: string;
      acceptsOnlineOrders?: boolean;
    }
  ) {
    const [updated] = await db
      .update(kiosks)
      .set({
        ...settings,
        updatedAt: new Date(),
      })
      .where(eq(kiosks.id, kioskId))
      .returning();

    if (!updated) {
      throw AppError.notFound('الكشك غير موجود');
    }

    await cacheService.del('kiosks:all');
    await cacheService.del(`kiosk:${kioskId}`);

    return {
      ...updated,
      rating: Number(updated.rating),
    };
  }

  /**
   * Aggregates dashboard statistics for the cashier / owner overview
   */
  async getKioskDashboardStats(kioskId: string): Promise<KioskDashboardStats> {
    // 1. Incoming count (PENDING_KIOSK)
    const [incomingResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(
        and(eq(orders.kioskId, kioskId), eq(orders.status, 'PENDING_KIOSK'))
      );

    // 2. Active count (ACCEPTED, PREPARING, READY)
    const [activeResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(
        and(
          eq(orders.kioskId, kioskId),
          inArray(orders.status, ['ACCEPTED', 'PREPARING', 'READY'])
        )
      );

    // 3. Today's completed orders and sales in piasters
    const [todaySalesResult] = await db
      .select({
        completedCount: sql<number>`count(*)::int`,
        totalSales: sql<number>`COALESCE(sum(total), 0)::int`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.kioskId, kioskId),
          eq(orders.status, 'COMPLETED'),
          eq(orders.orderDate, sql`CURRENT_DATE`)
        )
      );

    // 4. Menu stats (unavailable items count vs total)
    const [menuStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        unavailable: sql<number>`count(*) FILTER (WHERE is_available = false)::int`,
      })
      .from(menuItems)
      .where(
        and(eq(menuItems.kioskId, kioskId), eq(menuItems.isDeleted, false))
      );

    return {
      incomingCount: incomingResult?.count || 0,
      activeCount: activeResult?.count || 0,
      todayCompletedCount: todaySalesResult?.completedCount || 0,
      todaySalesPiasters: todaySalesResult?.totalSales || 0,
      unavailableItemsCount: menuStats?.unavailable || 0,
      totalMenuItemsCount: menuStats?.total || 0,
    };
  }

  /**
   * Admin: Get all kiosks with assigned cashiers and menu item counts (Batch optimized - 3 queries total)
   */
  async getAdminKiosksWithStaff() {
    const kioskList = await db
      .select()
      .from(kiosks)
      .orderBy(desc(kiosks.createdAt));

    if (kioskList.length === 0) {
      return [];
    }

    const kioskIds = kioskList.map((k) => k.id);

    // 1. Fetch all active staff for all kiosks in one query
    const allStaff = await db
      .select({
        id: kioskStaff.id,
        kioskId: kioskStaff.kioskId,
        userId: kioskStaff.userId,
        name: profiles.fullName,
        phone: profiles.phone,
        role: kioskStaff.role,
        isActive: kioskStaff.isActive,
      })
      .from(kioskStaff)
      .innerJoin(profiles, eq(kioskStaff.userId, profiles.id))
      .where(and(inArray(kioskStaff.kioskId, kioskIds), eq(kioskStaff.isActive, true)));

    // 2. Fetch menu items count for all kiosks in one query
    const allItemCounts = await db
      .select({
        kioskId: menuItems.kioskId,
        count: sql<number>`count(*)::int`,
      })
      .from(menuItems)
      .where(and(inArray(menuItems.kioskId, kioskIds), eq(menuItems.isDeleted, false)))
      .groupBy(menuItems.kioskId);

    // 3. In-memory mappings
    const staffByKiosk = new Map<string, Array<{
      id: string;
      userId: string;
      name: string;
      phone: string | null;
      role: any;
      isActive: boolean;
    }>>();

    for (const member of allStaff) {
      const list = staffByKiosk.get(member.kioskId) || [];
      list.push({
        id: member.id,
        userId: member.userId,
        name: member.name,
        phone: member.phone,
        role: member.role,
        isActive: member.isActive,
      });
      staffByKiosk.set(member.kioskId, list);
    }

    const countsByKiosk = new Map<string, number>();
    for (const row of allItemCounts) {
      countsByKiosk.set(row.kioskId, row.count);
    }

    return kioskList.map((k) => ({
      ...k,
      rating: Number(k.rating),
      staff: staffByKiosk.get(k.id) || [],
      menuItemsCount: countsByKiosk.get(k.id) || 0,
    }));
  }

  /**
   * Admin: Create New Kiosk
   */
  async createKiosk(data: {
    name: string;
    collegeLocation: string;
    campusZone?: string;
    category?: string;
    phone?: string;
    openingHours?: string;
    defaultPrepTimeMins?: number;
    imageUrl?: string;
  }) {
    const kioskId = generateId();

    const [newKiosk] = await db
      .insert(kiosks)
      .values({
        id: kioskId,
        name: data.name,
        collegeLocation: data.collegeLocation,
        campusZone: data.campusZone || 'الساحة الرئيسية',
        category: data.category || 'عام',
        isOpen: true,
        acceptsOnlineOrders: true,
        isRushMode: false,
        openingHours: data.openingHours || '8:00 ص - 4:00 م',
        phone: data.phone,
        defaultPrepTimeMins: data.defaultPrepTimeMins || 15,
        acceptanceTimeoutSecs: 300,
        rating: '0.00',
        ratingCount: 0,
        imageUrl: data.imageUrl || null,
      })
      .returning();

    await cacheService.del('kiosks:all');
    return newKiosk;
  }

  /**
   * Admin: Get all staff users available to be assigned to kiosks
   */
  async getStaffList() {
    const staffProfiles = await db
      .select({
        id: profiles.id,
        fullName: profiles.fullName,
        phone: profiles.phone,
        isActive: profiles.isActive,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .where(eq(profiles.systemRole, 'staff'))
      .orderBy(desc(profiles.createdAt));

    const supabaseAdmin = getSupabaseAdmin();
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const userEmailMap = new Map((authUsers?.users || []).map((u) => [u.id, u.email]));

    // Fetch active assignments
    const assignments = await db
      .select({
        userId: kioskStaff.userId,
        kioskId: kioskStaff.kioskId,
        kioskName: kiosks.name,
        role: kioskStaff.role,
        isActive: kioskStaff.isActive,
      })
      .from(kioskStaff)
      .innerJoin(kiosks, eq(kioskStaff.kioskId, kiosks.id))
      .where(eq(kioskStaff.isActive, true));

    const assignmentMap = new Map(assignments.map((a) => [a.userId, a]));

    return staffProfiles.map((p) => ({
      ...p,
      email: userEmailMap.get(p.id) || '',
      assignment: assignmentMap.get(p.id) || null,
    }));
  }

  /**
   * Admin: Assign staff user to a specific kiosk
   */
  async assignStaffToKiosk(kioskId: string, userId: string, role: 'owner' | 'cashier' = 'cashier') {
    const [targetKiosk] = await db
      .select({ id: kiosks.id, name: kiosks.name })
      .from(kiosks)
      .where(eq(kiosks.id, kioskId))
      .limit(1);

    if (!targetKiosk) {
      throw AppError.notFound('الكشك غير موجود');
    }

    const [userProfile] = await db
      .select({ id: profiles.id, fullName: profiles.fullName, systemRole: profiles.systemRole })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!userProfile) {
      throw AppError.notFound('المستخدم غير موجود');
    }

    // Ensure system_role is staff
    if (userProfile.systemRole !== 'staff') {
      await db
        .update(profiles)
        .set({ systemRole: 'staff', updatedAt: new Date() })
        .where(eq(profiles.id, userId));
    }

    // Insert or update kiosk_staff
    const existing = await db
      .select({ id: kioskStaff.id })
      .from(kioskStaff)
      .where(and(eq(kioskStaff.kioskId, kioskId), eq(kioskStaff.userId, userId)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(kioskStaff)
        .set({ role, isActive: true })
        .where(eq(kioskStaff.id, existing[0].id));
    } else {
      await db.insert(kioskStaff).values({
        id: generateId(),
        kioskId,
        userId,
        role,
        isActive: true,
      });
    }

    await cacheService.del('kiosks:all');

    return {
      success: true,
      message: `تم تعيين الموظف "${userProfile.fullName}" لكشك "${targetKiosk.name}" بنجاح`,
      kioskId,
      userId,
      role,
    };
  }

  /**
   * Admin: Remove/Unassign staff user from a kiosk
   */
  async removeStaffFromKiosk(kioskId: string, userId: string) {
    await db
      .delete(kioskStaff)
      .where(and(eq(kioskStaff.kioskId, kioskId), eq(kioskStaff.userId, userId)));

    await cacheService.del('kiosks:all');

    return {
      success: true,
      message: 'تم إلغاء تعيين الموظف من الكشك بنجاح',
    };
  }
}

export const kioskService = new KioskService();


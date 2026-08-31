import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { kiosks, orders, menuItems } from '../../db/schema.js';
import { cacheService } from '../../shared/cache/index.js';
import { AppError } from '../../shared/errors/index.js';
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

    // Calculate approximate active orders for each open kiosk
    const kiosksWithQueue = await Promise.all(
      kioskList.map(async (kiosk) => {
        let activeOrdersCount = 0;
        if (kiosk.isOpen) {
          const [countResult] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(orders)
            .where(
              and(
                eq(orders.kioskId, kiosk.id),
                inArray(orders.status, ['ACCEPTED', 'PREPARING'])
              )
            );
          activeOrdersCount = countResult?.count || 0;
        }

        // Effective wait time calculation including rush mode
        const estimatedWaitMins =
          kiosk.defaultPrepTimeMins + (kiosk.isRushMode ? 5 : 0);

        return {
          ...kiosk,
          rating: Number(kiosk.rating),
          estimatedWaitMins,
          ordersAheadCount: activeOrdersCount,
        };
      })
    );

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
}

export const kioskService = new KioskService();

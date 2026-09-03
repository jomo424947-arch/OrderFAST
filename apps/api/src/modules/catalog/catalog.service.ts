import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { menuCategories, menuItems, kiosks, kioskStaff } from '../../db/schema.js';
import { cacheService } from '../../shared/cache/index.js';
import { AppError } from '../../shared/errors/index.js';
import type {
  CreateMenuItemInput,
  UpdateMenuItemInput,
} from '@orderfast/validation';
import type { AuthenticatedUser } from '../../shared/middleware/auth.js';

export class CatalogService {
  /**
   * Helper: Verifies that the staff member belongs to the specific kiosk
   */
  private async verifyStaffKioskAccess(
    kioskId: string,
    user: AuthenticatedUser
  ) {
    if (user.systemRole === 'admin') return;

    if (user.systemRole !== 'staff') {
      throw AppError.forbidden('هذا الإجراء متاح فقط للعاملين بالأكشاك');
    }

    const [staff] = await db
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
      throw AppError.forbidden('ليس لديك صلاحية لإدارة أصناف هذا الكشك');
    }
  }

  /**
   * Retrieves public menu for students (Categories + Approved, Non-deleted Items)
   */
  async getPublicMenu(kioskId: string) {
    const cacheKey = `kiosk:menu:${kioskId}`;
    const cached = await cacheService.get<any>(cacheKey);

    if (cached) {
      return cached;
    }

    // 1. Fetch active categories
    const categoriesList = await db
      .select()
      .from(menuCategories)
      .where(
        and(eq(menuCategories.kioskId, kioskId), eq(menuCategories.isActive, true))
      )
      .orderBy(asc(menuCategories.displayOrder));

    // 2. Fetch approved, available, non-deleted items
    const itemsList = await db
      .select()
      .from(menuItems)
      .where(
        and(
          eq(menuItems.kioskId, kioskId),
          eq(menuItems.isDeleted, false),
          eq(menuItems.isUnderReview, false),
          eq(menuItems.isAvailable, true)
        )
      )
      .orderBy(asc(menuItems.name));

    const result = {
      kioskId,
      categories: categoriesList,
      items: itemsList,
    };

    // Cache for 60 seconds
    await cacheService.set(cacheKey, result, 60);
    return result;
  }

  /**
   * Retrieves staff menu (Includes under-review and all categories)
   */
  async getStaffMenu(kioskId: string) {
    const categoriesList = await db
      .select()
      .from(menuCategories)
      .where(
        and(eq(menuCategories.kioskId, kioskId), eq(menuCategories.isActive, true))
      )
      .orderBy(asc(menuCategories.displayOrder));

    const itemsList = await db
      .select()
      .from(menuItems)
      .where(
        and(eq(menuItems.kioskId, kioskId), eq(menuItems.isDeleted, false))
      )
      .orderBy(asc(menuItems.name));

    return {
      kioskId,
      categories: categoriesList,
      items: itemsList,
    };
  }

  /**
   * Adds a new menu category
   */
  async createCategory(kioskId: string, name: string, displayOrder = 0) {
    const [category] = await db
      .insert(menuCategories)
      .values({
        kioskId,
        name,
        displayOrder,
        isActive: true,
      })
      .returning();

    await cacheService.del(`kiosk:menu:${kioskId}`);
    return category;
  }

  /**
   * Adds a new menu item (starts with is_under_review = true)
   */
  async createMenuItem(input: CreateMenuItemInput) {
    // Verify category belongs to kiosk
    const [category] = await db
      .select()
      .from(menuCategories)
      .where(
        and(
          eq(menuCategories.id, input.categoryId),
          eq(menuCategories.kioskId, input.kioskId)
        )
      )
      .limit(1);

    if (!category) {
      throw AppError.notFound('التصنيف المحدد غير تابع لهذا الكشك');
    }

    const [item] = await db
      .insert(menuItems)
      .values({
        kioskId: input.kioskId,
        categoryId: input.categoryId,
        name: input.name,
        description: input.description || null,
        price: input.price, // in piasters
        originalPrice: input.originalPrice || null,
        offerTag: input.offerTag || null,
        isCombo: !!input.isCombo,
        comboItems: input.comboItems || null,
        preparationTimeMins: input.preparationTimeMins || 5,
        imageUrl: input.imageUrl || null,
        isAvailable: true,
        isUnderReview: true, // Needs admin approval before visible to students
        isDeleted: false,
      })
      .returning();

    await cacheService.del(`kiosk:menu:${input.kioskId}`);
    return item;
  }

  /**
   * Updates menu item details
   */
  async updateMenuItem(
    itemId: string,
    requestingUser: AuthenticatedUser,
    input: UpdateMenuItemInput
  ) {
    const [existing] = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, itemId))
      .limit(1);

    if (!existing || existing.isDeleted) {
      throw AppError.notFound('الصنف المطلوب غير موجود');
    }

    await this.verifyStaffKioskAccess(existing.kioskId, requestingUser);

    const [updated] = await db
      .update(menuItems)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(menuItems.id, itemId))
      .returning();

    await cacheService.del(`kiosk:menu:${existing.kioskId}`);
    return updated;
  }

  /**
   * Toggles product availability
   */
  async toggleItemAvailability(
    itemId: string,
    requestingUser: AuthenticatedUser,
    isAvailable: boolean
  ) {
    const [existing] = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, itemId))
      .limit(1);

    if (!existing || existing.isDeleted) {
      throw AppError.notFound('الصنف غير موجود');
    }

    await this.verifyStaffKioskAccess(existing.kioskId, requestingUser);

    const [updated] = await db
      .update(menuItems)
      .set({
        isAvailable,
        updatedAt: new Date(),
      })
      .where(eq(menuItems.id, itemId))
      .returning();

    await cacheService.del(`kiosk:menu:${existing.kioskId}`);
    return updated;
  }

  /**
   * Soft-deletes a menu item (preserves historical order items relations)
   */
  async deleteMenuItem(itemId: string, requestingUser: AuthenticatedUser) {
    const [existing] = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, itemId))
      .limit(1);

    if (!existing || existing.isDeleted) {
      throw AppError.notFound('الصنف غير موجود');
    }

    await this.verifyStaffKioskAccess(existing.kioskId, requestingUser);

    await db
      .update(menuItems)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(eq(menuItems.id, itemId));

    await cacheService.del(`kiosk:menu:${existing.kioskId}`);
  }

  /**
   * Admin Menu Review: List items pending approval
   */
  async getUnderReviewItems() {
    return db
      .select({
        id: menuItems.id,
        name: menuItems.name,
        description: menuItems.description,
        price: menuItems.price,
        preparationTimeMins: menuItems.preparationTimeMins,
        isAvailable: menuItems.isAvailable,
        isUnderReview: menuItems.isUnderReview,
        categoryId: menuItems.categoryId,
        imageUrl: menuItems.imageUrl,
        kioskId: menuItems.kioskId,
        kioskName: kiosks.name,
        collegeLocation: kiosks.collegeLocation,
        categoryName: menuCategories.name,
        createdAt: menuItems.createdAt,
      })
      .from(menuItems)
      .innerJoin(kiosks, eq(menuItems.kioskId, kiosks.id))
      .innerJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
      .where(
        and(eq(menuItems.isUnderReview, true), eq(menuItems.isDeleted, false))
      )
      .orderBy(desc(menuItems.createdAt));
  }

  /**
   * Admin: Approve menu item
   */
  async approveMenuItem(itemId: string) {
    const [updated] = await db
      .update(menuItems)
      .set({
        isUnderReview: false,
        updatedAt: new Date(),
      })
      .where(eq(menuItems.id, itemId))
      .returning();

    if (!updated) {
      throw AppError.notFound('الصنف غير موجود');
    }

    await cacheService.del(`kiosk:menu:${updated.kioskId}`);
    return updated;
  }

  /**
   * Admin: Reject menu item
   */
  async rejectMenuItem(itemId: string) {
    const [updated] = await db
      .update(menuItems)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(eq(menuItems.id, itemId))
      .returning();

    if (!updated) {
      throw AppError.notFound('الصنف غير موجود');
    }

    await cacheService.del(`kiosk:menu:${updated.kioskId}`);
    return updated;
  }
}

export const catalogService = new CatalogService();

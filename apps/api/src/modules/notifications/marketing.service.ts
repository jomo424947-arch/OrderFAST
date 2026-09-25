import { eq, and, desc, sql, or, ilike, inArray } from 'drizzle-orm';
import { db } from '../../db/client.js';
import {
  marketingCampaigns,
  userDeviceTokens,
  profiles,
  students,
  notifications,
  appPrompts,
} from '../../db/schema.js';
import { pushService } from './push.service.js';
import { AppError } from '../../shared/errors/index.js';

export interface SendCampaignDto {
  title: string;
  body: string;
  targetType: 'all' | 'single_user' | 'college' | 'university';
  targetValue?: string;
  actionUrl?: string;
  imageUrl?: string;
}

export class MarketingService {
  /**
   * Returns real-time audience reach statistics for the admin dashboard
   */
  async getAudienceStats() {
    // 1. Device counts
    const [totalActiveDevices] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userDeviceTokens)
      .where(eq(userDeviceTokens.isActive, true));

    const [androidDevices] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userDeviceTokens)
      .where(
        and(
          eq(userDeviceTokens.isActive, true),
          eq(userDeviceTokens.platform, 'android')
        )
      );

    const [webDevices] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userDeviceTokens)
      .where(
        and(
          eq(userDeviceTokens.isActive, true),
          eq(userDeviceTokens.platform, 'web')
        )
      );

    const [guestDevices] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userDeviceTokens)
      .where(
        and(
          eq(userDeviceTokens.isActive, true),
          sql`${userDeviceTokens.userId} IS NULL`
        )
      );

    // 2. Registered Students
    const [totalStudents] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(students);

    // 3. Unique colleges list
    const collegesList = await db
      .selectDistinct({ college: students.college })
      .from(students)
      .where(sql`${students.college} IS NOT NULL AND ${students.college} != ''`);

    return {
      totalActiveDevices: totalActiveDevices?.count || 0,
      androidDevices: androidDevices?.count || 0,
      webDevices: webDevices?.count || 0,
      guestDevices: guestDevices?.count || 0,
      registeredStudents: totalStudents?.count || 0,
      colleges: collegesList.map((c) => c.college).filter(Boolean),
    };
  }

  /**
   * Paginated list of past marketing campaigns
   */
  async getCampaigns(page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const campaigns = await db
      .select({
        id: marketingCampaigns.id,
        title: marketingCampaigns.title,
        body: marketingCampaigns.body,
        targetType: marketingCampaigns.targetType,
        targetValue: marketingCampaigns.targetValue,
        actionUrl: marketingCampaigns.actionUrl,
        imageUrl: marketingCampaigns.imageUrl,
        sentCount: marketingCampaigns.sentCount,
        failedCount: marketingCampaigns.failedCount,
        createdBy: marketingCampaigns.createdBy,
        creatorName: profiles.fullName,
        createdAt: marketingCampaigns.createdAt,
      })
      .from(marketingCampaigns)
      .leftJoin(profiles, eq(marketingCampaigns.createdBy, profiles.id))
      .orderBy(desc(marketingCampaigns.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalRecord] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(marketingCampaigns);

    return {
      campaigns,
      total: totalRecord?.count || 0,
      page,
      limit,
    };
  }

  /**
   * Search for students by name, phone, or university ID to target an individual user
   */
  /**
   * Search for students by name, phone, or university ID to target an individual user
   */
  async searchStudents(query: string) {
    const q = query.trim();
    if (!q) return [];

    // Extract digits only to search even if user wrote 0727538 instead of U727538 or vice-versa
    const numericPart = q.replace(/\D/g, '');

    const orConditions = [
      ilike(profiles.fullName, `%${q}%`),
      ilike(profiles.phone, `%${q}%`),
      ilike(students.universityId, `%${q}%`),
      sql`${profiles.id}::text ILIKE ${'%' + q + '%'}`,
    ];

    if (numericPart && numericPart.length >= 3) {
      orConditions.push(ilike(students.universityId, `%${numericPart}%`));
      orConditions.push(ilike(profiles.phone, `%${numericPart}%`));
    }

    const results = await db
      .select({
        id: profiles.id,
        fullName: profiles.fullName,
        phone: profiles.phone,
        college: students.college,
        universityId: students.universityId,
        university: students.university,
      })
      .from(profiles)
      .leftJoin(students, eq(profiles.id, students.id))
      .where(or(...orConditions))
      .limit(15);

    return results;
  }

  /**
   * Broadcasts or sends a targeted marketing campaign push notification
   */
  async sendCampaign(dto: SendCampaignDto, adminUserId: string) {
    if (!dto.title?.trim() || !dto.body?.trim()) {
      throw AppError.badRequest('عنوان الإشعار ونص الرسالة مطلوبان');
    }

    let targetTokens: string[] = [];
    let targetUserIds: string[] = [];

    // 1. Resolve Target Devices & Users based on targetType
    if (dto.targetType === 'all') {
      // Broadcast to all active devices (including guests + registered)
      const devices = await db
        .select({ token: userDeviceTokens.token, userId: userDeviceTokens.userId })
        .from(userDeviceTokens)
        .where(eq(userDeviceTokens.isActive, true));

      targetTokens = devices.map((d) => d.token);
      targetUserIds = Array.from(new Set(devices.map((d) => d.userId).filter(Boolean) as string[]));
    } else if (dto.targetType === 'single_user') {
      if (!dto.targetValue) {
        throw AppError.badRequest('معرف المستخدم المستهدف مطلوب');
      }

      // targetValue can be userId UUID, university ID, phone, or name
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.targetValue);
      let targetUserId = dto.targetValue;

      if (!isUUID) {
        // Try matching universityId first (e.g. U727538 or 727538)
        const numericPart = dto.targetValue.replace(/\D/g, '');
        const studentMatches = await db
          .select({ id: students.id })
          .from(students)
          .where(
            or(
              ilike(students.universityId, dto.targetValue),
              numericPart ? ilike(students.universityId, `%${numericPart}%`) : undefined
            )
          )
          .limit(1);

        if (studentMatches.length > 0 && studentMatches[0]) {
          targetUserId = studentMatches[0].id;
        } else {
          const [foundProfile] = await db
            .select({ id: profiles.id })
            .from(profiles)
            .where(or(eq(profiles.phone, dto.targetValue), ilike(profiles.fullName, dto.targetValue)))
            .limit(1);

          if (!foundProfile) {
            throw AppError.notFound('المستخدم المستهدف غير موجود');
          }
          targetUserId = foundProfile.id;
        }
      }

      targetUserIds = [targetUserId];

      const devices = await db
        .select({ token: userDeviceTokens.token })
        .from(userDeviceTokens)
        .where(
          and(
            eq(userDeviceTokens.userId, targetUserId),
            eq(userDeviceTokens.isActive, true)
          )
        );

      targetTokens = devices.map((d) => d.token);
    } else if (dto.targetType === 'college') {
      if (!dto.targetValue) {
        throw AppError.badRequest('اسم الكلية المستهدفة مطلوب');
      }

      // Find all students in this college
      const targetStudents = await db
        .select({ id: students.id })
        .from(students)
        .where(eq(students.college, dto.targetValue));

      targetUserIds = targetStudents.map((s) => s.id);

      if (targetUserIds.length > 0) {
        const devices = await db
          .select({ token: userDeviceTokens.token })
          .from(userDeviceTokens)
          .where(
            and(
              inArray(userDeviceTokens.userId, targetUserIds),
              eq(userDeviceTokens.isActive, true)
            )
          );

        targetTokens = devices.map((d) => d.token);
      }
    } else if (dto.targetType === 'university') {
      const university = (dto.targetValue as any) || 'sphinx';
      const targetStudents = await db
        .select({ id: students.id })
        .from(students)
        .where(eq(students.university, university));

      targetUserIds = targetStudents.map((s) => s.id);

      if (targetUserIds.length > 0) {
        const devices = await db
          .select({ token: userDeviceTokens.token })
          .from(userDeviceTokens)
          .where(
            and(
              inArray(userDeviceTokens.userId, targetUserIds),
              eq(userDeviceTokens.isActive, true)
            )
          );

        targetTokens = devices.map((d) => d.token);
      }
    }

    // 2. Dispatch FCM Push Notifications
    let sentCount = 0;
    let failedCount = 0;

    if (targetTokens.length > 0) {
      const pushResult = await pushService.sendToTokens(targetTokens, {
        title: dto.title.trim(),
        body: dto.body.trim(),
        channelId: 'fastorder_status',
        priority: 'high',
        data: {
          actionUrl: dto.actionUrl || '/student',
          type: 'marketing',
        },
      });

      sentCount = pushResult.successCount;
      failedCount = pushResult.failureCount;
    }

    // 3. Insert in-app notifications for registered target users
    if (targetUserIds.length > 0) {
      const notificationRows = targetUserIds.map((uId) => ({
        userId: uId,
        type: 'system' as const,
        title: dto.title.trim(),
        body: dto.body.trim(),
        isRead: false,
      }));

      // Insert in chunks of 100
      for (let i = 0; i < notificationRows.length; i += 100) {
        const chunk = notificationRows.slice(i, i + 100);
        try {
          await db.insert(notifications).values(chunk);
        } catch (err) {
          console.warn('[MarketingService] Failed inserting in-app notification chunk:', err);
        }
      }
    }

    // 4. Save campaign history record in database
    const [campaignRecord] = await db
      .insert(marketingCampaigns)
      .values({
        title: dto.title.trim(),
        body: dto.body.trim(),
        targetType: dto.targetType,
        targetValue: dto.targetValue || null,
        actionUrl: dto.actionUrl || null,
        imageUrl: dto.imageUrl || null,
        sentCount,
        failedCount,
        createdBy: adminUserId,
      })
      .returning();

    return {
      success: true,
      campaign: campaignRecord,
      stats: {
        totalTargetTokens: targetTokens.length,
        sentCount,
        failedCount,
        targetUsersCount: targetUserIds.length,
      },
    };
  }

  /**
   * Get active In-App promotional prompt / motivational popup configuration
   */
  async getAppPrompt() {
    try {
      const [prompt] = await db
        .select()
        .from(appPrompts)
        .where(eq(appPrompts.id, 'default'))
        .limit(1);

      if (prompt) return prompt;
    } catch (err) {
      console.warn('[MarketingService] Failed to read appPrompts, returning defaults:', err);
    }

    return {
      id: 'default',
      isEnabled: true,
      mode: 'auto',
      title: 'جدد طاقتك الجامعية',
      message: 'يومك طويل في الكلية؟ اطلب مشروبك المفضل أو سناك خفيف بضغطة واحدة.',
      subtext: 'استلم بالرقم من الكشك مباشرة وادفع كاش أو بمحفظتك الإلكترونية.',
      icon: 'zap',
      imageUrl: null,
      badgeText: 'عرض خاص',
      layoutMode: 'smart_fit',
      actionText: 'تصفح الأكشاك واطلب الآن',
      actionUrl: '/student/kiosks',
      durationSeconds: 10,
      frequencyHours: 4,
    };
  }

  /**
   * Update active In-App promotional prompt / motivational popup configuration
   */
  async updateAppPrompt(input: {
    isEnabled?: boolean;
    mode?: string;
    title?: string;
    message?: string;
    subtext?: string;
    icon?: string;
    imageUrl?: string | null;
    badgeText?: string | null;
    layoutMode?: string;
    actionText?: string;
    actionUrl?: string;
    durationSeconds?: number;
    frequencyHours?: number;
  }) {
    const existing = await this.getAppPrompt();

    const updateData = {
      isEnabled: input.isEnabled !== undefined ? !!input.isEnabled : existing.isEnabled,
      mode: input.mode || existing.mode || 'auto',
      title: input.title !== undefined ? input.title.trim() : existing.title,
      message: input.message !== undefined ? input.message.trim() : existing.message,
      subtext: input.subtext !== undefined ? input.subtext.trim() : existing.subtext,
      icon: input.icon || existing.icon || 'zap',
      imageUrl: input.imageUrl !== undefined ? (input.imageUrl ? input.imageUrl.trim() : null) : existing.imageUrl,
      badgeText: input.badgeText !== undefined ? (input.badgeText ? input.badgeText.trim() : null) : existing.badgeText,
      layoutMode: input.layoutMode || (existing as any).layoutMode || 'smart_fit',
      actionText: input.actionText !== undefined ? input.actionText.trim() : existing.actionText,
      actionUrl: input.actionUrl !== undefined ? input.actionUrl.trim() : existing.actionUrl,
      durationSeconds: input.durationSeconds !== undefined ? Math.max(3, Math.min(60, Number(input.durationSeconds))) : existing.durationSeconds,
      frequencyHours: input.frequencyHours !== undefined ? Math.max(0, Math.min(72, Number(input.frequencyHours))) : existing.frequencyHours,
      updatedAt: new Date(),
    };

    try {
      const [updated] = await db
        .insert(appPrompts)
        .values({
          id: 'default',
          ...updateData,
        })
        .onConflictDoUpdate({
          target: appPrompts.id,
          set: updateData,
        })
        .returning();

      return updated || updateData;
    } catch (err) {
      console.error('[MarketingService] Failed to update appPrompts in DB:', err);
      return { id: 'default', ...updateData };
    }
  }
}

export const marketingService = new MarketingService();

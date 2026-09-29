import { eq, and, desc, sql, ilike, or } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { supportTickets, profiles, students } from '../../db/schema.js';
import { AppError } from '../../shared/errors/index.js';
import type {
  CreateSupportTicketInput,
  UpdateSupportTicketStatusInput,
} from '@orderfast/validation';
import type { SupportTicket, SupportTicketStats } from '@orderfast/types';

export class SupportService {
  /**
   * Generates a unique, readable ticket number (e.g. #TKT-824109)
   */
  private generateTicketNumber(): string {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    return `#TKT-${randomSuffix}`;
  }

  /**
   * Creates a new support ticket (for logged-in student or guest)
   */
  async createTicket(input: CreateSupportTicketInput, userId?: string): Promise<SupportTicket> {
    const ticketNumber = this.generateTicketNumber();

    let finalSenderName = input.senderName?.trim();
    let finalPhone = input.senderPhone?.trim();
    let finalUniversity = input.university || 'sphinx';
    let finalCollege = input.college?.trim() || null;
    let isGuest = !userId;

    if (userId) {
      // If user is logged in, optionally enrich with their profile if missing
      const [profile] = await db
        .select({
          fullName: profiles.fullName,
          phone: profiles.phone,
          university: students.university,
          college: students.college,
        })
        .from(profiles)
        .leftJoin(students, eq(profiles.id, students.id))
        .where(eq(profiles.id, userId))
        .limit(1);

      if (profile) {
        if (!finalSenderName) finalSenderName = profile.fullName;
        if (!finalPhone && profile.phone) finalPhone = profile.phone;
        if (profile.university) finalUniversity = profile.university;
        if (profile.college && !finalCollege) finalCollege = profile.college;
      }
    }

    if (!finalSenderName || finalSenderName.length < 2) {
      throw AppError.badRequest('الاسم مطلوب وبشكل صحيح');
    }

    if (!finalPhone || finalPhone.length < 10) {
      throw AppError.badRequest('رقم الهاتف مطلوب وبشكل صحيح');
    }

    const [ticket] = await db
      .insert(supportTickets)
      .values({
        ticketNumber,
        category: input.category,
        subject: input.subject.trim(),
        message: input.message.trim(),
        imageUrl: input.imageUrl?.trim() || null,
        userId: userId || null,
        isGuest,
        senderName: finalSenderName,
        senderPhone: finalPhone,
        senderEmail: input.senderEmail?.trim() || null,
        university: finalUniversity,
        college: finalCollege,
        orderId: input.orderId || null,
        orderNumber: input.orderNumber || null,
        kioskId: input.kioskId || null,
        kioskName: input.kioskName || null,
        status: 'pending',
        priority: 'normal',
      })
      .returning();

    return ticket as unknown as SupportTicket;
  }

  /**
   * Retrieves all tickets for the authenticated student
   */
  async getMyTickets(userId: string): Promise<SupportTicket[]> {
    const tickets = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.userId, userId))
      .orderBy(desc(supportTickets.createdAt))
      .limit(50);

    return tickets as unknown as SupportTicket[];
  }

  /**
   * Admin: Retrieves paginated support tickets with filters and search
   */
  async getAdminTickets(filters: {
    status?: string;
    category?: string;
    isGuest?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ tickets: SupportTicket[]; total: number }> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 30));
    const offset = (page - 1) * limit;

    const conditions = [];

    if (filters.status && filters.status !== 'all') {
      conditions.push(eq(supportTickets.status, filters.status));
    }

    if (filters.category && filters.category !== 'all') {
      conditions.push(eq(supportTickets.category, filters.category));
    }

    if (filters.isGuest !== undefined) {
      conditions.push(eq(supportTickets.isGuest, filters.isGuest));
    }

    if (filters.search && filters.search.trim().length > 0) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(supportTickets.ticketNumber, q),
          ilike(supportTickets.senderName, q),
          ilike(supportTickets.senderPhone, q),
          ilike(supportTickets.subject, q)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(supportTickets)
      .where(whereClause);

    const tickets = await db
      .select()
      .from(supportTickets)
      .where(whereClause)
      .orderBy(desc(supportTickets.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      tickets: tickets as unknown as SupportTicket[],
      total: countResult?.count || 0,
    };
  }

  /**
   * Admin: Retrieves summary statistics for the support dashboard
   */
  async getAdminStats(): Promise<SupportTicketStats> {
    const [counts] = await db
      .select({
        totalCount: sql<number>`count(*)::int`,
        pendingCount: sql<number>`count(*) filter (where ${supportTickets.status} = 'pending')::int`,
        inProgressCount: sql<number>`count(*) filter (where ${supportTickets.status} = 'in_progress')::int`,
        resolvedCount: sql<number>`count(*) filter (where ${supportTickets.status} = 'resolved')::int`,
      })
      .from(supportTickets);

    const categoryRows = await db
      .select({
        category: supportTickets.category,
        count: sql<number>`count(*)::int`,
      })
      .from(supportTickets)
      .groupBy(supportTickets.category);

    const categoryDistribution: Record<string, number> = {};
    for (const row of categoryRows) {
      categoryDistribution[row.category] = row.count;
    }

    return {
      totalCount: counts?.totalCount || 0,
      pendingCount: counts?.pendingCount || 0,
      inProgressCount: counts?.inProgressCount || 0,
      resolvedCount: counts?.resolvedCount || 0,
      categoryDistribution,
    };
  }

  /**
   * Admin: Updates ticket status, notes, and reply
   */
  async updateTicketStatus(
    id: string,
    input: UpdateSupportTicketStatusInput
  ): Promise<SupportTicket> {
    const updatePayload: Record<string, any> = {
      status: input.status,
      updatedAt: new Date(),
    };

    if (input.priority) {
      updatePayload.priority = input.priority;
    }

    if (input.adminNotes !== undefined) {
      updatePayload.adminNotes = input.adminNotes ? input.adminNotes.trim() : null;
    }

    if (input.adminReply !== undefined) {
      updatePayload.adminReply = input.adminReply ? input.adminReply.trim() : null;
    }

    if (input.status === 'resolved') {
      updatePayload.resolvedAt = new Date();
    } else if (input.status === 'pending' || input.status === 'in_progress') {
      updatePayload.resolvedAt = null;
    }

    const [updated] = await db
      .update(supportTickets)
      .set(updatePayload)
      .where(eq(supportTickets.id, id))
      .returning();

    if (!updated) {
      throw AppError.notFound('التذكرة غير موجودة');
    }

    return updated as unknown as SupportTicket;
  }
}

export const supportService = new SupportService();

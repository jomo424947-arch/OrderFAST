import { apiClient } from '@/lib/api/client';
import type { SupportTicket, SupportTicketStats } from '@orderfast/types';
import type { CreateSupportTicketInput, UpdateSupportTicketStatusInput } from '@orderfast/validation';

export interface AdminTicketsFilter {
  status?: string;
  category?: string;
  isGuest?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export const supportService = {
  /**
   * Submit a new support ticket or feedback (works for logged in or guest users)
   */
  async submitTicket(data: CreateSupportTicketInput): Promise<SupportTicket> {
    return apiClient.post<SupportTicket>('/support/tickets', data);
  },

  /**
   * Get all tickets submitted by the authenticated student
   */
  async getMyTickets(): Promise<SupportTicket[]> {
    return apiClient.get<SupportTicket[]>('/support/my-tickets');
  },

  /**
   * Admin: Get paginated tickets with filters and search
   */
  async getAdminTickets(filters: AdminTicketsFilter = {}): Promise<{ tickets: SupportTicket[]; total: number }> {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (filters.status && filters.status !== 'all') params.status = filters.status;
    if (filters.category && filters.category !== 'all') params.category = filters.category;
    if (filters.isGuest !== undefined) params.isGuest = filters.isGuest;
    if (filters.search) params.search = filters.search.trim();
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;

    return apiClient.get<{ tickets: SupportTicket[]; total: number }>('/support/admin', { params });
  },

  /**
   * Admin: Get support tickets KPIs & category distribution
   */
  async getAdminStats(): Promise<SupportTicketStats> {
    return apiClient.get<SupportTicketStats>('/support/admin/stats');
  },

  /**
   * Admin: Update ticket status, notes, or reply
   */
  async updateTicketStatus(id: string, data: UpdateSupportTicketStatusInput): Promise<SupportTicket> {
    return apiClient.patch<SupportTicket>(`/support/admin/${id}`, data);
  },
};

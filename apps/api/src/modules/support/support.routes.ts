import { FastifyInstance } from 'fastify';
import {
  createSupportTicketSchema,
  updateSupportTicketStatusSchema,
} from '@orderfast/validation';
import { supportService } from './support.service.js';
import { authenticate, requireSystemRole } from '../../shared/middleware/auth.js';
import { getSupabaseAdmin } from '../../shared/supabase/index.js';

export async function supportRoutes(app: FastifyInstance) {
  /**
   * 1. Public / Authenticated: Submit a support ticket or feedback
   * Rate limited: 5 requests per minute per IP
   */
  app.post(
    '/tickets',
    { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const input = createSupportTicketSchema.parse(request.body);

      // Attempt optional token extraction if provided
      let userId: string | undefined;
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.replace('Bearer ', '').trim();
          const supabaseAdmin = getSupabaseAdmin();
          const { data } = await supabaseAdmin.auth.getUser(token);
          if (data?.user?.id) {
            userId = data.user.id;
          }
        } catch {
          // Fall back gracefully to guest submission
          userId = undefined;
        }
      }

      const ticket = await supportService.createTicket(input, userId);
      return reply.status(201).send({
        success: true,
        message: 'تم إرسال تذكرتك بنجاح، وسيتواصل معك فريق الدعم قريباً',
        data: ticket,
      });
    }
  );

  /**
   * 2. Authenticated Student: Get past tickets
   */
  app.get('/my-tickets', { preHandler: [authenticate] }, async (request, reply) => {
    const tickets = await supportService.getMyTickets(request.user!.id);
    return reply.status(200).send({
      success: true,
      data: tickets,
    });
  });

  /**
   * 3. Admin: Get paginated tickets with filters and search
   */
  app.get(
    '/admin',
    { preHandler: [authenticate, requireSystemRole(['admin'])] },
    async (request, reply) => {
      const query = request.query as {
        status?: string;
        category?: string;
        isGuest?: string;
        search?: string;
        page?: string;
        limit?: string;
      };

      const result = await supportService.getAdminTickets({
        status: query.status,
        category: query.category,
        isGuest:
          query.isGuest !== undefined ? query.isGuest === 'true' : undefined,
        search: query.search,
        page: query.page ? parseInt(query.page, 10) : 1,
        limit: query.limit ? parseInt(query.limit, 10) : 30,
      });

      return reply.status(200).send({
        success: true,
        data: result,
      });
    }
  );

  /**
   * 4. Admin: Get statistics summary
   */
  app.get(
    '/admin/stats',
    { preHandler: [authenticate, requireSystemRole(['admin'])] },
    async (_request, reply) => {
      const stats = await supportService.getAdminStats();
      return reply.status(200).send({
        success: true,
        data: stats,
      });
    }
  );

  /**
   * 5. Admin: Update ticket status and notes
   */
  app.patch<{ Params: { id: string } }>(
    '/admin/:id',
    { preHandler: [authenticate, requireSystemRole(['admin'])] },
    async (request, reply) => {
      const input = updateSupportTicketStatusSchema.parse(request.body);
      const updated = await supportService.updateTicketStatus(
        request.params.id,
        input
      );

      return reply.status(200).send({
        success: true,
        message: 'تم تحديث حالة التذكرة بنجاح',
        data: updated,
      });
    }
  );
}

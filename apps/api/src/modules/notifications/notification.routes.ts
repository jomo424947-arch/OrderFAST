import { FastifyInstance } from 'fastify';
import { notificationService } from './notification.service.js';
import { authenticate } from '../../shared/middleware/auth.js';

export async function notificationRoutes(app: FastifyInstance) {
  // Get all user notifications
  app.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const query = request.query as { page?: string; limit?: string };
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const data = await notificationService.getUserNotifications(
      request.user!.id,
      page,
      limit
    );
    return reply.status(200).send({
      success: true,
      data,
    });
  });

  // Mark single notification as read
  app.patch<{ Params: { id: string } }>(
    '/:id/read',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const data = await notificationService.markAsRead(
        request.params.id,
        request.user!.id
      );
      return reply.status(200).send({
        success: true,
        data,
      });
    }
  );

  // Mark all as read
  app.patch(
    '/read-all',
    { preHandler: [authenticate] },
    async (request, reply) => {
      await notificationService.markAllAsRead(request.user!.id);
      return reply.status(200).send({
        success: true,
        message: 'تم تعيين جميع الإشعارات كمقروءة',
      });
    }
  );
}

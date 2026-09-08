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

  // Mark all as read (MUST be registered BEFORE /:id/read to avoid route shadowing)
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

  // Register device for FCM push notifications
  app.post<{ Body: { token: string; platform?: string } }>(
    '/devices',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { token, platform } = request.body || {};
      const result = await notificationService.registerDevice(
        request.user!.id,
        token,
        platform || 'android'
      );
      return reply.status(200).send({
        success: true,
        data: result,
      });
    }
  );

  // Unregister device token
  app.delete<{ Body: { token: string } }>(
    '/devices',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { token } = (request.body as any) || (request.query as any) || {};
      if (token) {
        await notificationService.unregisterDevice(request.user!.id, token);
      }
      return reply.status(200).send({
        success: true,
        message: 'تم إلغاء تسجيل الجهاز بنجاح',
      });
    }
  );

  app.post<{ Body: { token: string } }>(
    '/devices/unregister',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { token } = request.body || {};
      if (token) {
        await notificationService.unregisterDevice(request.user!.id, token);
      }
      return reply.status(200).send({
        success: true,
        message: 'تم إلغاء تسجيل الجهاز بنجاح',
      });
    }
  );
}

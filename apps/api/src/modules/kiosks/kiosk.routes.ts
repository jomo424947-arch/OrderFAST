import { FastifyInstance } from 'fastify';
import {
  updateKioskStatusSchema,
  updateKioskSettingsSchema,
} from '@orderfast/validation';
import { kioskService } from './kiosk.service.js';
import {
  authenticate,
  requireKioskStaff,
} from '../../shared/middleware/auth.js';

export async function kioskRoutes(app: FastifyInstance) {
  // Public: List all kiosks with wait times and queue status
  app.get('/', async (_request, reply) => {
    const data = await kioskService.getAllKiosks();
    return reply.status(200).send({
      success: true,
      data,
    });
  });

  // Public: Get single kiosk details
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const data = await kioskService.getKioskById(request.params.id);
    return reply.status(200).send({
      success: true,
      data,
    });
  });

  // Protected: Kiosk Dashboard Statistics (Cashier / Owner)
  app.get<{ Params: { id: string } }>(
    '/:id/stats',
    { preHandler: [authenticate, requireKioskStaff()] },
    async (request, reply) => {
      const stats = await kioskService.getKioskDashboardStats(request.params.id);
      return reply.status(200).send({
        success: true,
        data: stats,
      });
    }
  );

  // Protected: Toggle Kiosk Open/Closed & Rush Mode (Cashier / Owner)
  app.patch<{ Params: { id: string } }>(
    '/:id/status',
    { preHandler: [authenticate, requireKioskStaff()] },
    async (request, reply) => {
      const input = updateKioskStatusSchema.parse(request.body);
      const data = await kioskService.updateKioskStatus(
        request.params.id,
        input.isOpen,
        input.isRushMode
      );
      return reply.status(200).send({
        success: true,
        message: input.isOpen ? 'تم فتح الكشك لاستقبال الطلبات' : 'تم إغلاق الكشك مؤقتاً',
        data,
      });
    }
  );

  // Protected: Update Kiosk Settings (Owner or Admin Only)
  app.patch<{ Params: { id: string } }>(
    '/:id/settings',
    { preHandler: [authenticate, requireKioskStaff(['owner'])] },
    async (request, reply) => {
      const input = updateKioskSettingsSchema.parse(request.body);
      const data = await kioskService.updateKioskSettings(request.params.id, input);
      return reply.status(200).send({
        success: true,
        message: 'تم تحديث إعدادات الكشك بنجاح',
        data,
      });
    }
  );
}

import { FastifyInstance } from 'fastify';
import {
  updateKioskStatusSchema,
  updateKioskSettingsSchema,
  assignKioskStaffSchema,
} from '@orderfast/validation';
import { kioskService } from './kiosk.service.js';
import {
  authenticate,
  requireKioskStaff,
  requireSystemRole,
} from '../../shared/middleware/auth.js';

export async function kioskRoutes(app: FastifyInstance) {
  // Admin: Get all kiosks with assigned staff
  app.get(
    '/admin/with-staff',
    { preHandler: [authenticate, requireSystemRole(['admin'])] },
    async (_request, reply) => {
      const data = await kioskService.getAdminKiosksWithStaff();
      return reply.status(200).send({
        success: true,
        data,
      });
    }
  );

  // Admin: Get list of all staff members (for assignment dropdown)
  app.get(
    '/admin/staff-list',
    { preHandler: [authenticate, requireSystemRole(['admin'])] },
    async (_request, reply) => {
      const data = await kioskService.getStaffList();
      return reply.status(200).send({
        success: true,
        data,
      });
    }
  );

  // Admin: Assign staff to kiosk
  app.post<{ Params: { id: string } }>(
    '/:id/staff',
    { preHandler: [authenticate, requireSystemRole(['admin'])] },
    async (request, reply) => {
      const input = assignKioskStaffSchema.parse(request.body);
      const data = await kioskService.assignStaffToKiosk(
        request.params.id,
        input.userId,
        input.role
      );
      return reply.status(200).send({
        success: true,
        data,
      });
    }
  );

  // Admin: Remove staff from kiosk
  app.delete<{ Params: { id: string; userId: string } }>(
    '/:id/staff/:userId',
    { preHandler: [authenticate, requireSystemRole(['admin'])] },
    async (request, reply) => {
      const data = await kioskService.removeStaffFromKiosk(
        request.params.id,
        request.params.userId
      );
      return reply.status(200).send({
        success: true,
        data,
      });
    }
  );

  // Admin: Create New Kiosk
  app.post(
    '/',
    { preHandler: [authenticate, requireSystemRole(['admin'])] },
    async (request, reply) => {
      const body = request.body as any;
      const data = await kioskService.createKiosk(body);
      return reply.status(201).send({
        success: true,
        message: 'تم إنشاء الكشك بنجاح',
        data,
      });
    }
  );

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

  // Protected: Update Kiosk Settings (Owner or Cashier Staff)
  app.patch<{ Params: { id: string } }>(
    '/:id/settings',
    { preHandler: [authenticate, requireKioskStaff(['owner', 'cashier'])] },
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

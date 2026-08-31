import { FastifyInstance } from 'fastify';
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  toggleItemAvailabilitySchema,
  createMenuCategorySchema,
} from '@orderfast/validation';
import { catalogService } from './catalog.service.js';
import {
  authenticate,
  requireKioskStaff,
  requireSystemRole,
} from '../../shared/middleware/auth.js';

export async function catalogRoutes(app: FastifyInstance) {
  // Public / Student: Get approved menu for a kiosk
  app.get<{ Params: { kioskId: string } }>(
    '/kiosks/:kioskId/menu',
    async (request, reply) => {
      const data = await catalogService.getPublicMenu(request.params.kioskId);
      return reply.status(200).send({
        success: true,
        data,
      });
    }
  );

  // Protected: Staff view of full menu (including under-review items)
  app.get<{ Params: { kioskId: string } }>(
    '/kiosks/:kioskId/menu/staff',
    { preHandler: [authenticate, requireKioskStaff()] },
    async (request, reply) => {
      const data = await catalogService.getStaffMenu(request.params.kioskId);
      return reply.status(200).send({
        success: true,
        data,
      });
    }
  );

  // Protected: Create new category (Staff)
  app.post<{ Params: { kioskId: string } }>(
    '/kiosks/:kioskId/categories',
    { preHandler: [authenticate, requireKioskStaff()] },
    async (request, reply) => {
      const body = createMenuCategorySchema.parse({
        ...(request.body as Record<string, unknown>),
        kioskId: request.params.kioskId,
      });
      const data = await catalogService.createCategory(
        request.params.kioskId,
        body.name,
        body.displayOrder
      );
      return reply.status(201).send({
        success: true,
        message: 'تمت إضافة التصنيف بنجاح',
        data,
      });
    }
  );

  // Protected: Add menu item (Staff)
  app.post<{ Params: { kioskId: string } }>(
    '/kiosks/:kioskId/menu-items',
    { preHandler: [authenticate, requireKioskStaff()] },
    async (request, reply) => {
      const body = createMenuItemSchema.parse({
        ...(request.body as Record<string, unknown>),
        kioskId: request.params.kioskId,
      });
      const data = await catalogService.createMenuItem(body);
      return reply.status(201).send({
        success: true,
        message: 'تمت إضافة الصنف بنجاح وحالته الآن قيد المراجعة والاعتماد',
        data,
      });
    }
  );

  // Protected: Update menu item (Staff)
  app.patch<{ Params: { id: string } }>(
    '/menu-items/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const body = updateMenuItemSchema.parse(request.body);
      const data = await catalogService.updateMenuItem(
        request.params.id,
        request.user!,
        body
      );
      return reply.status(200).send({
        success: true,
        message: 'تم تحديث بيانات الصنف بنجاح',
        data,
      });
    }
  );

  // Protected: Toggle Item Availability (Staff)
  app.patch<{ Params: { id: string } }>(
    '/menu-items/:id/availability',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const body = toggleItemAvailabilitySchema.parse(request.body);
      const data = await catalogService.toggleItemAvailability(
        request.params.id,
        request.user!,
        body.isAvailable
      );
      return reply.status(200).send({
        success: true,
        message: body.isAvailable
          ? 'تم تفعيل توفر الصنف للطلب'
          : 'تم تعطيل توفر الصنف مؤقتاً',
        data,
      });
    }
  );

  // Protected: Soft Delete Menu Item (Staff)
  app.delete<{ Params: { id: string } }>(
    '/menu-items/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      await catalogService.deleteMenuItem(request.params.id, request.user!);
      return reply.status(200).send({
        success: true,
        message: 'تم حذف الصنف من المنيو بنجاح',
      });
    }
  );

  // Admin Only: Get Items Pending Review
  app.get(
    '/admin/menu-review',
    { preHandler: [authenticate, requireSystemRole(['admin'])] },
    async (_request, reply) => {
      const data = await catalogService.getUnderReviewItems();
      return reply.status(200).send({
        success: true,
        data,
      });
    }
  );

  // Admin Only: Approve Menu Item
  app.post<{ Params: { id: string } }>(
    '/admin/menu-items/:id/approve',
    { preHandler: [authenticate, requireSystemRole(['admin'])] },
    async (request, reply) => {
      const data = await catalogService.approveMenuItem(request.params.id);
      return reply.status(200).send({
        success: true,
        message: 'تم اعتماد الصنف بنجاح وأصبح متاحاً للطلاب',
        data,
      });
    }
  );

  // Admin Only: Reject Menu Item
  app.post<{ Params: { id: string } }>(
    '/admin/menu-items/:id/reject',
    { preHandler: [authenticate, requireSystemRole(['admin'])] },
    async (request, reply) => {
      const data = await catalogService.rejectMenuItem(request.params.id);
      return reply.status(200).send({
        success: true,
        message: 'تم رفض الصنف وإزالته من المنيو',
        data,
      });
    }
  );
}

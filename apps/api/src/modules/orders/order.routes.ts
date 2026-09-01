import { FastifyInstance } from 'fastify';
import {
  createOrderSchema,
  acceptOrderSchema,
  rejectOrderSchema,
  cancelOrderSchema,
  batchActionSchema,
} from '@orderfast/validation';
import { orderService } from './order.service.js';
import {
  authenticate,
  requireSystemRole,
  requireKioskStaff,
  requireStudentActive,
} from '../../shared/middleware/auth.js';
import { generateId } from '../../shared/id/index.js';

export async function orderRoutes(app: FastifyInstance) {
  // 1. Student: Submit Order (Atomic with Idempotency)
  app.post(
    '/',
    { preHandler: [authenticate, requireSystemRole(['student']), requireStudentActive] },
    async (request, reply) => {
      const idempotencyKey =
        (request.headers['idempotency-key'] as string) || generateId();

      const body = createOrderSchema.parse(request.body);
      const result = await orderService.createOrder(
        request.user!.id,
        body,
        idempotencyKey
      );

      return reply.status(result.isDuplicate ? 200 : 201).send({
        success: true,
        message: result.isDuplicate ? 'تم استرجاع الطلب المنفذ مسبقاً' : 'تم إرسال الأوردر للكشك بنجاح',
        data: result.order,
      });
    }
  );

  // 2. Student: My Order History (Paginated)
  app.get(
    '/student/me',
    { preHandler: [authenticate, requireSystemRole(['student'])] },
    async (request, reply) => {
      const query = request.query as { page?: string; limit?: string };
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 20;

      const data = await orderService.getStudentOrders(
        request.user!.id,
        page,
        limit
      );
      return reply.status(200).send({
        success: true,
        data,
      });
    }
  );

  // 3. Get Single Order Details (Student Owner / Kiosk Staff / Admin)
  app.get<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const data = await orderService.getOrderById(
        request.params.id,
        request.user
      );
      return reply.status(200).send({
        success: true,
        data,
      });
    }
  );

  // 4. Student: Cancel Order (Only PENDING_KIOSK)
  app.post<{ Params: { id: string } }>(
    '/:id/cancel',
    { preHandler: [authenticate, requireSystemRole(['student'])] },
    async (request, reply) => {
      const body = cancelOrderSchema.parse(request.body || {});
      const data = await orderService.cancelOrderByStudent(
        request.params.id,
        request.user!.id,
        body
      );
      return reply.status(200).send({
        success: true,
        message: 'تم إلغاء الطلب بنجاح',
        data,
      });
    }
  );

  // 5. Staff: Get Incoming Orders for Kiosk (PENDING_KIOSK)
  app.get<{ Params: { kioskId: string } }>(
    '/kiosks/:kioskId/incoming',
    { preHandler: [authenticate, requireKioskStaff()] },
    async (request, reply) => {
      const data = await orderService.getKioskIncomingOrders(
        request.params.kioskId
      );
      return reply.status(200).send({
        success: true,
        data,
      });
    }
  );

  // 6. Staff: Get Active Kitchen Orders for Kiosk (ACCEPTED, PREPARING, READY)
  app.get<{ Params: { kioskId: string } }>(
    '/kiosks/:kioskId/active',
    { preHandler: [authenticate, requireKioskStaff()] },
    async (request, reply) => {
      const data = await orderService.getKioskActiveOrders(
        request.params.kioskId
      );
      return reply.status(200).send({
        success: true,
        data,
      });
    }
  );

  // 7. Staff: Accept Order
  app.post<{ Params: { id: string } }>(
    '/:id/accept',
    { preHandler: [authenticate, requireSystemRole(['staff', 'admin'])] },
    async (request, reply) => {
      const body = acceptOrderSchema.parse(request.body || {});
      const data = await orderService.acceptOrder(
        request.params.id,
        request.user!,
        body
      );
      return reply.status(200).send({
        success: true,
        message: 'تم قبول الأوردر ونقله لقائمة التحضير',
        data,
      });
    }
  );

  // 8. Staff: Reject Order
  app.post<{ Params: { id: string } }>(
    '/:id/reject',
    { preHandler: [authenticate, requireSystemRole(['staff', 'admin'])] },
    async (request, reply) => {
      const body = rejectOrderSchema.parse(request.body);
      const data = await orderService.rejectOrder(
        request.params.id,
        request.user!,
        body
      );
      return reply.status(200).send({
        success: true,
        message: 'تم رفض الأوردر وإخطار الطالب',
        data,
      });
    }
  );

  // 9. Staff: Start Preparing
  app.post<{ Params: { id: string } }>(
    '/:id/start-preparing',
    { preHandler: [authenticate, requireSystemRole(['staff', 'admin'])] },
    async (request, reply) => {
      const data = await orderService.startPreparing(
        request.params.id,
        request.user!
      );
      return reply.status(200).send({
        success: true,
        message: 'بدأ تحضير الطلب',
        data,
      });
    }
  );

  // 10. Staff: Mark Ready For Pickup
  app.post<{ Params: { id: string } }>(
    '/:id/mark-ready',
    { preHandler: [authenticate, requireSystemRole(['staff', 'admin'])] },
    async (request, reply) => {
      const data = await orderService.markReady(
        request.params.id,
        request.user!
      );
      return reply.status(200).send({
        success: true,
        message: 'تم تحديث الطلب ليصبح جاهزاً للاستلام',
        data,
      });
    }
  );

  // 11. Staff: Complete Order (Picked up and paid)
  app.post<{ Params: { id: string } }>(
    '/:id/complete',
    { preHandler: [authenticate, requireSystemRole(['staff', 'admin'])] },
    async (request, reply) => {
      const data = await orderService.completeOrder(
        request.params.id,
        request.user!
      );
      return reply.status(200).send({
        success: true,
        message: 'تم تسليم الطلب وتأكيد استلام المبلغ',
        data,
      });
    }
  );

  // 12. Staff: Record No Show
  app.post<{ Params: { id: string } }>(
    '/:id/no-show',
    { preHandler: [authenticate, requireSystemRole(['staff', 'admin'])] },
    async (request, reply) => {
      const data = await orderService.markNoShow(
        request.params.id,
        request.user!
      );
      return reply.status(200).send({
        success: true,
        message: 'تم تسجيل عدم حضور الطالب بنجاح',
        data,
      });
    }
  );

  // 13. Staff: Batch Accept Orders
  app.post<{ Params: { kioskId: string } }>(
    '/kiosks/:kioskId/batch/accept',
    { preHandler: [authenticate, requireKioskStaff()] },
    async (request, reply) => {
      const body = batchActionSchema.parse(request.body);
      const result = await orderService.batchAcceptOrders(
        request.params.kioskId,
        request.user!,
        body
      );
      return reply.status(200).send({
        success: true,
        message: `تم قبول ${result.successCount} أوردر بنجاح`,
        data: result,
      });
    }
  );

  // 14. Staff: Batch Mark Ready
  app.post<{ Params: { kioskId: string } }>(
    '/kiosks/:kioskId/batch/mark-ready',
    { preHandler: [authenticate, requireKioskStaff()] },
    async (request, reply) => {
      const body = batchActionSchema.parse(request.body);
      const result = await orderService.batchMarkReady(
        request.params.kioskId,
        request.user!,
        body
      );
      return reply.status(200).send({
        success: true,
        message: `تم تحديث ${result.successCount} أوردر كجاهز للاستلام`,
        data: result,
      });
    }
  );

  // 15. Admin: Get All Campus Orders
  app.get(
    '/admin/all',
    { preHandler: [authenticate, requireSystemRole(['admin'])] },
    async (request, reply) => {
      const query = request.query as { limit?: string; page?: string };
      const limit = Number(query.limit) || 50;
      const page = Number(query.page) || 1;
      const data = await orderService.getAdminRecentOrders(limit, page);
      return reply.status(200).send({
        success: true,
        data,
      });
    }
  );

  // 16. Admin: Get Campus Executive Stats
  app.get(
    '/admin/stats',
    { preHandler: [authenticate, requireSystemRole(['admin'])] },
    async (_request, reply) => {
      const data = await orderService.getAdminCampusStats();
      return reply.status(200).send({
        success: true,
        data,
      });
    }
  );
}

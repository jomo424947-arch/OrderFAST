import { FastifyInstance } from 'fastify';
import { serviceFeeService } from './service-fee.service.js';
import { authenticate, requireSystemRole } from '../../shared/middleware/auth.js';

export async function serviceFeeRoutes(app: FastifyInstance) {
  // 1. Get Active Service Fee Configuration (Public / authenticated)
  app.get('/config', async (_request, reply) => {
    const config = await serviceFeeService.getConfig();
    return reply.status(200).send({
      success: true,
      data: config,
    });
  });

  // 2. Admin: Update Service Fee Configuration
  const updateConfigHandler = async (request: any, reply: any) => {
    const adminName = request.user?.fullName || 'مدير النظام';
    const updated = await serviceFeeService.updateConfig(request.body, adminName);
    return reply.status(200).send({
      success: true,
      data: updated,
      message: 'تم حفظ وتحديث إعدادات رسوم الخدمة بنجاح.',
    });
  };

  // Protected Admin Routes
  app.register(async (adminScope) => {
    adminScope.addHook('preHandler', authenticate);
    adminScope.addHook('preHandler', requireSystemRole(['admin']));

    adminScope.put('/admin/config', updateConfigHandler);
    adminScope.post('/admin/config', updateConfigHandler);

    // Reset to system defaults
    adminScope.post('/admin/reset', async (request: any, reply: any) => {
      const adminName = request.user?.fullName || 'مدير النظام';
      const defaultConfig = {
        isEnabled: true,
        tier1MaxEgp: 100,
        tier1FeeCash: 3,
        tier1FeeOnline: 2,
        tier2MaxEgp: 200,
        tier2FeeCash: 5,
        tier2FeeOnline: 4,
        tier3FeeCash: 10,
        tier3FeeOnline: 8,
        freeDaysOfWeek: [],
        specialFreeDate: null,
        freeDayBannerText: '🎉 اليوم طلبك بدون أي رسوم خدمة في الحرم الجامعي!',
        firstOrderFree: true,
        minFeeCap: 0,
        maxFeeCap: 15,
        promoDiscountPercent: 0,
        promoDiscountActive: false,
        promoDiscountEndsAt: null,
        promoBannerText: '🔥 خصم خاص على رسوم الخدمة لفترة محدودة!',
      };

      const updated = await serviceFeeService.updateConfig(defaultConfig, adminName);
      return reply.status(200).send({
        success: true,
        data: updated,
        message: 'تمت استعادة الإعدادات الافتراضية لرسوم الخدمة بنجاح.',
      });
    });
  });
}

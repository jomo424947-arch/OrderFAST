import { FastifyInstance } from 'fastify';
import { marketingService } from './marketing.service.js';
import { authenticate, requireSystemRole } from '../../shared/middleware/auth.js';

export async function marketingRoutes(app: FastifyInstance) {
  // All marketing endpoints are strictly admin-only
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requireSystemRole(['admin']));

  // 1. Get Audience Reach Statistics
  app.get('/stats', async (_request, reply) => {
    const stats = await marketingService.getAudienceStats();
    return reply.status(200).send({
      success: true,
      data: stats,
    });
  });

  // 2. Get Campaigns History
  app.get('/campaigns', async (request, reply) => {
    const query = request.query as { page?: string; limit?: string };
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const result = await marketingService.getCampaigns(page, limit);
    return reply.status(200).send({
      success: true,
      data: result,
    });
  });

  // 3. Search Students for Individual Targeting
  app.get('/students/search', async (request, reply) => {
    const query = (request.query as { q?: string }).q || '';
    const results = await marketingService.searchStudents(query);
    return reply.status(200).send({
      success: true,
      data: results,
    });
  });

  // 4. Send Marketing Push Notification
  app.post<{
    Body: {
      title: string;
      body: string;
      targetType: 'all' | 'single_user' | 'college' | 'university';
      targetValue?: string;
      actionUrl?: string;
      imageUrl?: string;
    };
  }>('/send', async (request, reply) => {
    const adminUserId = request.user!.id;
    const result = await marketingService.sendCampaign(request.body, adminUserId);

    return reply.status(200).send({
      success: true,
      data: result,
      message: `تم إرسال الإشعار بنجاح إلى ${result.stats.sentCount} جهاز.`,
    });
  });

  // 5. Get In-App Promotional Prompt / Motivational Popup Config (Admin)
  app.get('/prompt', async (_request, reply) => {
    const prompt = await marketingService.getAppPrompt();
    return reply.status(200).send({
      success: true,
      data: prompt,
    });
  });

  // 6. Update In-App Promotional Prompt / Motivational Popup Config (Admin)
  const updatePromptHandler = async (request: any, reply: any) => {
    const updated = await marketingService.updateAppPrompt(request.body);
    return reply.status(200).send({
      success: true,
      data: updated,
      message: 'تم تحديث إعدادات إعلان التطبيق المنبثق بنجاح.',
    });
  };

  app.put('/prompt', updatePromptHandler);
  app.post('/prompt', updatePromptHandler);
}

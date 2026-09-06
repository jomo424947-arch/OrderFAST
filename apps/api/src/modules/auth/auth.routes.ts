import { FastifyInstance } from 'fastify';
import {
  registerStudentSchema,
  registerStaffSchema,
  loginSchema,
  updateStudentStatusSchema,
} from '@orderfast/validation';
import { authService } from './auth.service.js';
import { authenticate, requireSystemRole } from '../../shared/middleware/auth.js';

export async function authRoutes(app: FastifyInstance) {
  // Register Student
  app.post('/register-student', async (request, reply) => {
    const input = registerStudentSchema.parse(request.body);
    const result = await authService.registerStudent(input);
    return reply.status(201).send({
      success: true,
      message: 'تم تسجيل حساب الطالب بنجاح',
      data: result,
    });
  });

  // Register Kiosk Staff
  app.post('/register-staff', async (request, reply) => {
    const input = registerStaffSchema.parse(request.body);
    const result = await authService.registerStaff(input);
    return reply.status(201).send({
      success: true,
      message: 'تم تسجيل العامل بالكشك بنجاح',
      data: result,
    });
  });

  // Login
  app.post('/login', async (request, reply) => {
    const input = loginSchema.parse(request.body);
    const result = await authService.login(input);
    return reply.status(200).send({
      success: true,
      data: result,
    });
  });

  // Refresh Session
  app.post('/refresh', async (request, reply) => {
    const body = (request.body as { refreshToken?: string }) || {};
    const result = await authService.refreshSession(body.refreshToken || '');
    return reply.status(200).send({
      success: true,
      data: result,
    });
  });

  // Request Password Reset Link
  app.post('/forgot-password', async (request, reply) => {
    const body = (request.body as { email?: string; redirectTo?: string }) || {};
    if (!body.email) {
      return reply.status(400).send({
        success: false,
        error: { message: 'البريد الإلكتروني مطلوب' },
      });
    }
    const result = await authService.sendPasswordResetEmail(body.email, body.redirectTo);
    return reply.status(200).send({
      success: true,
      message: 'تم إرسال رابط استعادة كلمة المرور بنجاح',
      data: result,
    });
  });

  // Resend Email Confirmation Link
  app.post('/resend-confirmation', async (request, reply) => {
    const body = (request.body as { email?: string; redirectTo?: string }) || {};
    if (!body.email) {
      return reply.status(400).send({
        success: false,
        error: { message: 'البريد الإلكتروني مطلوب' },
      });
    }
    const result = await authService.resendConfirmationEmail(body.email, body.redirectTo);
    return reply.status(200).send({
      success: true,
      message: 'تم إرسال رابط التفعيل إلى بريدك الإلكتروني بنجاح',
      data: result,
    });
  });

  // OAuth Profile Synchronization (Google Auth)
  app.post('/oauth-sync', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        error: { message: 'رمز الدخول غير متوفر' },
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const { getSupabaseAdmin } = await import('../../shared/supabase/index.js');
    const supabaseAdmin = getSupabaseAdmin();
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !userData.user) {
      return reply.status(401).send({
        success: false,
        error: { message: 'رمز الدخول غير صالح أو منتهي الصلاحية' },
      });
    }

    const user = userData.user;
    const body = (request.body as { college?: string }) || {};
    const metadata = {
      fullName: (user.user_metadata?.full_name || user.user_metadata?.name) as string | undefined,
      avatarUrl: (user.user_metadata?.avatar_url || user.user_metadata?.picture) as string | undefined,
    };

    const syncResult = await authService.syncOAuthUser(
      user.id,
      user.email || '',
      metadata,
      body.college
    );

    return reply.status(200).send({
      success: true,
      data: syncResult,
    });
  });

  // Update Student College
  app.patch('/student/college', { preHandler: [authenticate] }, async (request, reply) => {
    const body = (request.body as { college?: string }) || {};
    if (!body.college) {
      return reply.status(400).send({
        success: false,
        error: { message: 'اسم الكلية مطلوب' },
      });
    }

    const updated = await authService.updateStudentCollege(request.user!.id, body.college);
    return reply.status(200).send({
      success: true,
      message: 'تم تحديث الكلية بنجاح',
      data: updated,
    });
  });

  // Get Current Authenticated Profile
  app.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const profile = await authService.getProfileById(request.user!.id);
    return reply.status(200).send({
      success: true,
      data: profile,
    });
  });

  // Admin Only: Get All Students
  app.get(
    '/students',
    { preHandler: [authenticate, requireSystemRole(['admin'])] },
    async (_request, reply) => {
      const data = await authService.getAllStudents();
      return reply.status(200).send({
        success: true,
        data,
      });
    }
  );

  // Admin Only: Update Student Status
  app.patch<{ Params: { id: string } }>(
    '/students/:id/status',
    { preHandler: [authenticate, requireSystemRole(['admin'])] },
    async (request, reply) => {
      const input = updateStudentStatusSchema.parse(request.body);
      const data = await authService.updateStudentStatus(request.params.id, input.accountStatus);
      return reply.status(200).send({
        success: true,
        message: 'تم تحديث حالة حساب الطالب بنجاح',
        data,
      });
    }
  );
}

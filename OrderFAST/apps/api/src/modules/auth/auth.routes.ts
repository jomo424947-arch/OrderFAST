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

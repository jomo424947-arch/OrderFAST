import { FastifyInstance } from 'fastify';
import {
  registerStudentSchema,
  registerStaffSchema,
  loginSchema,
} from '@orderfast/validation';
import { authService } from './auth.service.js';
import { authenticate } from '../../shared/middleware/auth.js';

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

  // Get Current Authenticated Profile
  app.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const profile = await authService.getProfileById(request.user!.id);
    return reply.status(200).send({
      success: true,
      data: profile,
    });
  });
}

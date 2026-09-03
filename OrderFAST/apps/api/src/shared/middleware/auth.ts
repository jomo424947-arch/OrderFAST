import { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { getSupabaseAdmin } from '../supabase/index.js';
import { AppError } from '../errors/index.js';
import { generateId } from '../id/index.js';
import { db } from '../../db/client.js';
import { profiles, kioskStaff, students } from '../../db/schema.js';
import type { SystemRole, KioskRole, AccountStatus } from '@orderfast/types';

export interface AuthenticatedUser {
  id: string;
  email: string;
  systemRole: SystemRole;
  fullName: string;
  isActive: boolean;
  studentStatus?: AccountStatus;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

import { createHash } from 'crypto';
import { cacheService } from '../cache/index.js';

/**
 * Parses JWT payload without blocking network calls
 */
function parseJwtPayload(token: string): { sub?: string; email?: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}

/**
 * Authentication Pre-handler
 * Fast-path: In-memory token cache (0.1ms) -> Local JWT decode + DB (1ms) -> Supabase Admin fallback
 */
export async function authenticate(request: FastifyRequest, _reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw AppError.unauthorized('رمز الدخول غير متوفر');
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const cacheKey = `auth:session:${tokenHash}`;

  // 1. Fast Cache Hit (0.1ms response time)
  const cachedUser = await cacheService.get<AuthenticatedUser>(cacheKey);
  if (cachedUser) {
    if (!cachedUser.isActive) {
      throw AppError.forbidden('الحساب غير موجود أو تم تعطيله');
    }
    request.user = cachedUser;
    return;
  }

  // 2. Local JWT inspection
  const payload = parseJwtPayload(token);
  const isTokenExpired = payload?.exp ? Date.now() >= payload.exp * 1000 : false;

  if (isTokenExpired) {
    throw AppError.unauthorized('رمز الدخول غير صالح أو منتهي الصلاحية');
  }

  let userId = payload?.sub;
  let userEmail = payload?.email || '';

  // 3. If local payload missing or needs verification, fallback to Supabase Admin
  if (!userId) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      throw AppError.unauthorized('رمز الدخول غير صالح أو منتهي الصلاحية');
    }
    userId = data.user.id;
    userEmail = data.user.email || '';
  }

  // 4. Retrieve user profile and student status in a single DB query
  const [userRecord] = await db
    .select({
      id: profiles.id,
      systemRole: profiles.systemRole,
      fullName: profiles.fullName,
      isActive: profiles.isActive,
      studentStatus: students.accountStatus,
    })
    .from(profiles)
    .leftJoin(students, eq(profiles.id, students.id))
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!userRecord || !userRecord.isActive) {
    throw AppError.forbidden('الحساب غير موجود أو تم تعطيله');
  }

  const authenticatedUser: AuthenticatedUser = {
    id: userRecord.id,
    email: userEmail,
    systemRole: userRecord.systemRole,
    fullName: userRecord.fullName,
    isActive: userRecord.isActive,
    studentStatus: userRecord.studentStatus || undefined,
  };

  request.user = authenticatedUser;

  // Cache authenticated session for 120 seconds (2 minutes)
  await cacheService.set(cacheKey, authenticatedUser, 120);
}

/**
 * Role-Based Access Control Guard for System Roles
 */
export function requireSystemRole(allowedRoles: SystemRole[]) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    if (!request.user) {
      throw AppError.unauthorized();
    }

    if (!allowedRoles.includes(request.user.systemRole)) {
      throw AppError.forbidden('ليس لديك الصلاحية المطلوبة للوصول لهذا المورد');
    }
  };
}

/**
 * Kiosk-Scoped Operational Access Guard
 * Verifies that authenticated user is active staff at the target kiosk (or global admin)
 */
export function requireKioskStaff(allowedKioskRoles?: KioskRole[]) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    if (!request.user) {
      throw AppError.unauthorized();
    }

    // Platform admins have universal access
    if (request.user.systemRole === 'admin') {
      return;
    }

    // Must have staff system role
    if (request.user.systemRole !== 'staff') {
      throw AppError.forbidden('هذا الإجراء متاح فقط للعاملين بالأكشاك');
    }

    // Extract kioskId from params or body
    const params = request.params as Record<string, string> | undefined;
    const body = request.body as Record<string, any> | undefined;
    const kioskId = params?.kioskId || params?.id || body?.kioskId;

    if (!kioskId) {
      throw AppError.badRequest('معرف الكشك غير محدد');
    }

    // Check staff assignment in database
    const [assignment] = await db
      .select()
      .from(kioskStaff)
      .where(
        and(
          eq(kioskStaff.kioskId, kioskId),
          eq(kioskStaff.userId, request.user.id),
          eq(kioskStaff.isActive, true)
        )
      )
      .limit(1);

    if (!assignment) {
      throw AppError.forbidden('ليس لديك صلاحية إدارة هذا الكشك');
    }

    if (allowedKioskRoles && !allowedKioskRoles.includes(assignment.role)) {
      throw AppError.forbidden('ليس لديك الصلاحية الكافية لهذا الإجراء في هذا الكشك');
    }
  };
}

/**
 * Student Active Status Guard
 * Ensures student is not restricted due to past no-shows
 */
export async function requireStudentActive(request: FastifyRequest, _reply: FastifyReply) {
  if (!request.user) {
    throw AppError.unauthorized();
  }

  if (request.user.systemRole === 'student' && request.user.studentStatus === 'restricted') {
    throw AppError.conflict(
      'حسابك مقيد مؤقتاً بسبب عدم الحضور لاستلام طلبات سابقة. يرجى التواصل مع الإدارة',
      'ACCOUNT_RESTRICTED'
    );
  }
}

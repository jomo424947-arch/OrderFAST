import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { profiles, students, kioskStaff, kiosks } from '../../db/schema.js';
import { getSupabaseAdmin, getSupabase } from '../../shared/supabase/index.js';
import { AppError } from '../../shared/errors/index.js';
import type {
  RegisterStudentInput,
  RegisterStaffInput,
  LoginInput,
} from '@orderfast/validation';

export class AuthService {
  /**
   * Registers a new university student
   */
  async registerStudent(input: RegisterStudentInput) {
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Create auth user in Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        full_name: input.fullName,
        system_role: 'student',
      },
    });

    if (authError || !authData.user) {
      if (authError?.message.includes('already registered')) {
        throw AppError.conflict('البريد الإلكتروني مسجل مسبقاً');
      }
      throw AppError.badRequest(authError?.message || 'فشل في إنشاء حساب المستخدم');
    }

    const userId = authData.user.id;

    // 2. Insert into profiles & students inside a transaction
    try {
      await db.transaction(async (tx) => {
        // Insert profile
        await tx.insert(profiles).values({
          id: userId,
          fullName: input.fullName,
          phone: input.phone || null,
          systemRole: 'student',
          isActive: true,
        });

        // Insert student extension
        await tx.insert(students).values({
          id: userId,
          universityId: input.universityId,
          college: input.college,
          accountStatus: 'active',
          noShowCount: 0,
        });
      });

      return {
        id: userId,
        email: input.email,
        fullName: input.fullName,
        systemRole: 'student' as const,
        universityId: input.universityId,
        college: input.college,
        accountStatus: 'active' as const,
      };
    } catch (error: any) {
      // Rollback Supabase user if database transaction fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error?.code === '23505') {
        throw AppError.conflict('الرقم الجامعي مسجل مسبقاً بحساب آخر');
      }
      throw AppError.internal('حدث خطأ أثناء حفظ بيانات الطالب');
    }
  }

  /**
   * Registers a new kiosk staff member (cashier or owner)
   */
  async registerStaff(input: RegisterStaffInput) {
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Verify target kiosk exists
    const [targetKiosk] = await db
      .select({ id: kiosks.id, name: kiosks.name })
      .from(kiosks)
      .where(eq(kiosks.id, input.kioskId))
      .limit(1);

    if (!targetKiosk) {
      throw AppError.notFound('الكشك المحدد غير موجود');
    }

    // 2. Create auth user in Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        full_name: input.fullName,
        system_role: 'staff',
      },
    });

    if (authError || !authData.user) {
      if (authError?.message.includes('already registered')) {
        throw AppError.conflict('البريد الإلكتروني مسجل مسبقاً');
      }
      throw AppError.badRequest(authError?.message || 'فشل في إنشاء الحساب');
    }

    const userId = authData.user.id;

    // 3. Insert profile & kiosk_staff inside transaction
    try {
      await db.transaction(async (tx) => {
        await tx.insert(profiles).values({
          id: userId,
          fullName: input.fullName,
          phone: input.phone || null,
          systemRole: 'staff',
          isActive: true,
        });

        await tx.insert(kioskStaff).values({
          kioskId: input.kioskId,
          userId,
          role: input.role,
          isActive: true,
        });
      });

      return {
        id: userId,
        email: input.email,
        fullName: input.fullName,
        systemRole: 'staff' as const,
        kioskId: input.kioskId,
        kioskName: targetKiosk.name,
        kioskRole: input.role,
      };
    } catch (error) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw AppError.internal('حدث خطأ أثناء حفظ بيانات العامل بالكشك');
    }
  }

  /**
   * Authenticates user via Supabase and returns profile details with session token
   */
  async login(input: LoginInput) {
    const supabase = getSupabase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error || !data.user || !data.session) {
      throw AppError.unauthorized('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    const userId = data.user.id;

    // Fetch complete user profile from database
    const profileData = await this.getProfileById(userId);

    return {
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
      },
      user: profileData,
    };
  }

  /**
   * Retrieves full profile with role-specific relationships
   */
  async getProfileById(userId: string) {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!profile) {
      throw AppError.notFound('الملف الشخصي غير موجود');
    }

    if (!profile.isActive) {
      throw AppError.forbidden('تم تعطيل هذا الحساب. يرجى التواصل مع إدارة المنصة');
    }

    // If student, attach student details
    if (profile.systemRole === 'student') {
      const [studentData] = await db
        .select()
        .from(students)
        .where(eq(students.id, userId))
        .limit(1);

      return {
        ...profile,
        student: studentData || null,
      };
    }

    // If staff, attach kiosk staff assignments
    if (profile.systemRole === 'staff') {
      const staffAssignments = await db
        .select({
          id: kioskStaff.id,
          kioskId: kioskStaff.kioskId,
          role: kioskStaff.role,
          isActive: kioskStaff.isActive,
          kioskName: kiosks.name,
          kioskLocation: kiosks.collegeLocation,
          kioskIsOpen: kiosks.isOpen,
        })
        .from(kioskStaff)
        .innerJoin(kiosks, eq(kioskStaff.kioskId, kiosks.id))
        .where(eq(kioskStaff.userId, userId));

      return {
        ...profile,
        staffAssignments,
      };
    }

    // Admin profile
    return profile;
  }
}

export const authService = new AuthService();

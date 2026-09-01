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
        phone: input.phone || undefined,
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
        phone: input.phone || null,
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

    let targetKiosk: { id: string; name: string } | undefined;
    if (input.kioskId) {
      const [kiosk] = await db
        .select({ id: kiosks.id, name: kiosks.name })
        .from(kiosks)
        .where(eq(kiosks.id, input.kioskId))
        .limit(1);

      if (!kiosk) {
        throw AppError.notFound('الكشك المحدد غير موجود');
      }
      targetKiosk = kiosk;
    }

    // 2. Create auth user in Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        full_name: input.fullName,
        phone: input.phone || undefined,
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

    // 3. Insert profile & kiosk_staff (if kioskId provided) inside transaction
    try {
      await db.transaction(async (tx) => {
        await tx.insert(profiles).values({
          id: userId,
          fullName: input.fullName,
          phone: input.phone || null,
          systemRole: 'staff',
          isActive: true,
        });

        if (input.kioskId) {
          await tx.insert(kioskStaff).values({
            kioskId: input.kioskId,
            userId,
            role: input.role || 'cashier',
            isActive: true,
          });
        }
      });

      return {
        id: userId,
        email: input.email,
        fullName: input.fullName,
        phone: input.phone || null,
        systemRole: 'staff' as const,
        kioskId: input.kioskId || null,
        kioskName: targetKiosk?.name || null,
        kioskRole: input.role || 'cashier',
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
   * Refreshes user session using a valid refresh token
   */
  async refreshSession(refreshToken: string) {
    if (!refreshToken) {
      throw AppError.unauthorized('رمز التجديد غير متوفر');
    }

    const supabase = getSupabase();
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.user || !data.session) {
      throw AppError.unauthorized('رمز التجديد غير صالح أو منتهي الصلاحية');
    }

    const profileData = await this.getProfileById(data.user.id);

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

  /**
   * Admin Only: Retrieves all registered students with their profile and status
   */
  async getAllStudents() {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const userEmailMap = new Map(authUsers?.users?.map((u) => [u.id, u.email]) || []);

    const studentList = await db
      .select({
        id: profiles.id,
        name: profiles.fullName,
        phone: profiles.phone,
        avatarUrl: profiles.avatarUrl,
        isActive: profiles.isActive,
        createdAt: profiles.createdAt,
        universityId: students.universityId,
        college: students.college,
        status: students.accountStatus,
        noShowCount: students.noShowCount,
      })
      .from(profiles)
      .innerJoin(students, eq(profiles.id, students.id))
      .where(eq(profiles.systemRole, 'student'));

    return studentList.map((std) => ({
      ...std,
      email: userEmailMap.get(std.id) || '',
      role: 'student' as const,
    }));
  }

  /**
   * Admin Only: Updates student account status (active | warning | restricted)
   */
  async updateStudentStatus(studentId: string, accountStatus: 'active' | 'warning' | 'restricted') {
    const [updated] = await db
      .update(students)
      .set({
        accountStatus,
        updatedAt: new Date(),
      })
      .where(eq(students.id, studentId))
      .returning();

    if (!updated) {
      throw AppError.notFound('الطالب غير موجود');
    }

    return updated;
  }
}

export const authService = new AuthService();


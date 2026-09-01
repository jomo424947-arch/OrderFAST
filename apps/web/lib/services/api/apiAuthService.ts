import { apiClient, tokenStorage } from '@/lib/api/client';
import { User, Student, Cashier, Admin, UserRole } from '@/types';
import { IAuthService, RegisterPayload } from '../authService';

export interface ApiAuthResponse {
  session: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  user: {
    id: string;
    fullName: string;
    phone?: string | null;
    avatarUrl?: string | null;
    systemRole: 'student' | 'staff' | 'admin';
    isActive: boolean;
    createdAt?: string;
    student?: {
      universityId: string;
      college: string;
      accountStatus: 'active' | 'warning' | 'restricted';
      noShowCount: number;
    } | null;
    staffAssignments?: Array<{
      id: string;
      kioskId: string;
      role: 'owner' | 'cashier';
      isActive: boolean;
      kioskName: string;
      kioskLocation: string;
      kioskIsOpen: boolean;
    }> | null;
  };
}

function mapApiUserToFrontendUser(user: ApiAuthResponse['user'], email: string): User {
  const role: UserRole =
    user.systemRole === 'staff'
      ? 'cashier'
      : user.systemRole === 'admin'
      ? 'admin'
      : 'student';

  const baseUser: User = {
    id: user.id,
    name: user.fullName,
    email: email,
    role,
    avatar: user.avatarUrl || undefined,
    phone: user.phone || undefined,
    createdAt: user.createdAt || new Date().toISOString(),
  };

  if (role === 'student' && user.student) {
    const student: Student = {
      ...baseUser,
      universityId: user.student.universityId,
      college: user.student.college,
      status: user.student.accountStatus,
      noShowCount: user.student.noShowCount,
    };
    return student;
  }

  if (role === 'cashier') {
    const assignments = user.staffAssignments || [];
    const primaryAssignment = assignments.length > 0 ? assignments[0] : null;
    const cashier: Cashier = {
      ...baseUser,
      kioskId: primaryAssignment?.kioskId || '',
      kioskName: primaryAssignment?.kioskName || 'الكشك المخصص',
      college: primaryAssignment?.kioskLocation || 'الجامعة',
      staffAssignments: assignments,
    };
    return cashier;
  }

  if (role === 'admin') {
    const admin: Admin = {
      ...baseUser,
      permissions: ['all'],
    };
    return admin;
  }

  return baseUser;
}

export class ApiAuthService implements IAuthService {
  async login(email: string, password: string, _role?: UserRole): Promise<User> {
    const data = await apiClient.post<ApiAuthResponse>(
      '/auth/login',
      {
        email,
        password,
      },
      { skipAuth: true }
    );

    tokenStorage.setTokens(data.session.accessToken, data.session.refreshToken);

    return mapApiUserToFrontendUser(data.user, email);
  }

  async register(data: RegisterPayload, role: UserRole): Promise<User> {
    if (role === 'student') {
      await apiClient.post<any>(
        '/auth/register-student',
        {
          email: data.email,
          password: data.password,
          fullName: data.name,
          phone: data.phone || undefined,
          universityId: data.universityId || `U${Date.now().toString().slice(-6)}`,
          college: data.college || 'كلية الهندسة',
        },
        { skipAuth: true }
      );

      // Automatically log in after registration
      return this.login(data.email, data.password, 'student');
    }

    if (role === 'cashier') {
      await apiClient.post<any>(
        '/auth/register-staff',
        {
          email: data.email,
          password: data.password,
          fullName: data.name,
          phone: data.phone || undefined,
          role: 'cashier',
        },
        { skipAuth: true }
      );

      return this.login(data.email, data.password, 'cashier');
    }

    throw new Error('تسجيل حساب المسؤول غير متاح ذاتياً');
  }

  async getCurrentUser(role: UserRole = 'student'): Promise<User> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new Error('لا يوجد جلسة مسجلة');
    }

    const profile = await apiClient.get<ApiAuthResponse['user']>('/auth/me');
    return mapApiUserToFrontendUser(profile, '');
  }

  async logout(): Promise<void> {
    tokenStorage.clearTokens();
  }
}

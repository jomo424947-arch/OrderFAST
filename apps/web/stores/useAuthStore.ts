'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole, AccountStatus, Student, Cashier, Admin } from '@/types';
import { authService, RegisterPayload } from '@/lib/services/authService';

interface AuthState {
  role: UserRole | null;
  isAuthenticated: boolean;
  student: Student | null;
  cashier: Cashier | null;
  admin: Admin | null;
  studentStatus: AccountStatus;

  login: (
    email: string,
    password: string,
    role: UserRole
  ) => Promise<{ success: boolean; error?: string }>;

  register: (
    data: RegisterPayload,
    role: UserRole
  ) => Promise<{ success: boolean; error?: string }>;

  logout: () => void;
  setStudentStatus: (status: AccountStatus) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      role: null,
      isAuthenticated: false,
      student: null,
      cashier: null,
      admin: null,
      studentStatus: 'active',

      login: async (email, password, role) => {
        try {
          const user = await authService.login(email, password, role);

          if (role === 'student') {
            const s = user as Student;
            set({
              role: 'student',
              isAuthenticated: true,
              student: s,
              cashier: null,
              admin: null,
              studentStatus: s.status ?? 'active',
            });
          } else if (role === 'cashier') {
            set({
              role: 'cashier',
              isAuthenticated: true,
              student: null,
              cashier: user as Cashier,
              admin: null,
            });
          } else {
            set({
              role: 'admin',
              isAuthenticated: true,
              student: null,
              cashier: null,
              admin: user as Admin,
            });
          }

          return { success: true };
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
          return { success: false, error: message };
        }
      },

      register: async (data, role) => {
        try {
          const user = await authService.register(data, role);

          if (role === 'student') {
            const s = user as Student;
            set({
              role: 'student',
              isAuthenticated: true,
              student: s,
              cashier: null,
              admin: null,
              studentStatus: s.status ?? 'active',
            });
          } else if (role === 'cashier') {
            set({
              role: 'cashier',
              isAuthenticated: true,
              student: null,
              cashier: user as Cashier,
              admin: null,
            });
          } else {
            set({
              role: 'admin',
              isAuthenticated: true,
              student: null,
              cashier: null,
              admin: user as Admin,
            });
          }

          return { success: true };
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
          return { success: false, error: message };
        }
      },

      logout: () =>
        set({
          role: null,
          isAuthenticated: false,
          student: null,
          cashier: null,
          admin: null,
          studentStatus: 'active',
        }),

      setStudentStatus: (status) => set({ studentStatus: status }),
    }),
    {
      name: 'orderfast-auth',
    }
  )
);

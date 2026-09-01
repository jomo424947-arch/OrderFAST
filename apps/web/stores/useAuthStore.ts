'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole, AccountStatus, Student, Cashier, Admin } from '@/types';
import { authService, RegisterPayload } from '@/lib/services/authService';
import { tokenStorage } from '@/lib/api/client';
import { useKioskStore } from './useKioskStore';

interface AuthState {
  role: UserRole | null;
  isAuthenticated: boolean;
  isAuthInitialized: boolean;
  student: Student | null;
  cashier: Cashier | null;
  admin: Admin | null;
  studentStatus: AccountStatus;
  isLoading: boolean;

  login: (
    email: string,
    password: string,
    role: UserRole
  ) => Promise<{ success: boolean; error?: string }>;

  register: (
    data: RegisterPayload,
    role: UserRole
  ) => Promise<{ success: boolean; error?: string }>;

  initializeAuth: () => Promise<void>;
  logout: () => void;
  setStudentStatus: (status: AccountStatus) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      role: null,
      isAuthenticated: false,
      isAuthInitialized: false,
      student: null,
      cashier: null,
      admin: null,
      studentStatus: 'active',
      isLoading: false,

      initializeAuth: async () => {
        const token = tokenStorage.getToken();
        if (!token) {
          set({
            isAuthenticated: false,
            role: null,
            student: null,
            cashier: null,
            admin: null,
            isAuthInitialized: true,
            isLoading: false,
          });
          return;
        }

        try {
          set({ isLoading: true });
          const user = await authService.getCurrentUser();
          if (user.role === 'student') {
            const s = user as Student;
            set({
              role: 'student',
              isAuthenticated: true,
              isAuthInitialized: true,
              student: s,
              cashier: null,
              admin: null,
              studentStatus: s.status ?? 'active',
              isLoading: false,
            });
          } else if (user.role === 'cashier') {
            const cashier = user as Cashier;
            set({
              role: 'cashier',
              isAuthenticated: true,
              isAuthInitialized: true,
              student: null,
              cashier,
              admin: null,
              isLoading: false,
            });
            if (cashier.kioskId) {
              useKioskStore.getState().setActiveKioskId(cashier.kioskId);
            }
          } else {
            set({
              role: 'admin',
              isAuthenticated: true,
              isAuthInitialized: true,
              student: null,
              cashier: null,
              admin: user as Admin,
              isLoading: false,
            });
          }
        } catch {
          tokenStorage.clearTokens();
          set({
            role: null,
            isAuthenticated: false,
            isAuthInitialized: true,
            student: null,
            cashier: null,
            admin: null,
            isLoading: false,
          });
        }
      },

      login: async (email, password, role) => {
        try {
          set({ isLoading: true });
          const user = await authService.login(email, password, role);

          if (user.role === 'student') {
            const s = user as Student;
            set({
              role: 'student',
              isAuthenticated: true,
              isAuthInitialized: true,
              student: s,
              cashier: null,
              admin: null,
              studentStatus: s.status ?? 'active',
              isLoading: false,
            });
          } else if (user.role === 'cashier') {
            const cashier = user as Cashier;
            set({
              role: 'cashier',
              isAuthenticated: true,
              isAuthInitialized: true,
              student: null,
              cashier,
              admin: null,
              isLoading: false,
            });
            if (cashier.kioskId) {
              useKioskStore.getState().setActiveKioskId(cashier.kioskId);
            }
          } else {
            set({
              role: 'admin',
              isAuthenticated: true,
              isAuthInitialized: true,
              student: null,
              cashier: null,
              admin: user as Admin,
              isLoading: false,
            });
          }

          return { success: true };
        } catch (err: unknown) {
          set({ isLoading: false });
          const message =
            err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
          return { success: false, error: message };
        }
      },

      register: async (data, role) => {
        try {
          set({ isLoading: true });
          const user = await authService.register(data, role);

          if (user.role === 'student') {
            const s = user as Student;
            set({
              role: 'student',
              isAuthenticated: true,
              isAuthInitialized: true,
              student: s,
              cashier: null,
              admin: null,
              studentStatus: s.status ?? 'active',
              isLoading: false,
            });
          } else if (user.role === 'cashier') {
            set({
              role: 'cashier',
              isAuthenticated: true,
              isAuthInitialized: true,
              student: null,
              cashier: user as Cashier,
              admin: null,
              isLoading: false,
            });
          } else {
            set({
              role: 'admin',
              isAuthenticated: true,
              isAuthInitialized: true,
              student: null,
              cashier: null,
              admin: user as Admin,
              isLoading: false,
            });
          }

          return { success: true };
        } catch (err: unknown) {
          set({ isLoading: false });
          const message =
            err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
          return { success: false, error: message };
        }
      },

      logout: () => {
        authService.logout();
        set({
          role: null,
          isAuthenticated: false,
          student: null,
          cashier: null,
          admin: null,
          studentStatus: 'active',
          isLoading: false,
        });
      },

      setStudentStatus: (status) => set({ studentStatus: status }),
    }),
    {
      name: 'orderfast-auth',
    }
  )
);

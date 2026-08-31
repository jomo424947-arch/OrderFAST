import { create } from 'zustand';
import { UserRole, AccountStatus, Student, Cashier } from '@/types';
import { MOCK_STUDENT } from '@/lib/mock/students';

interface AuthState {
  role: UserRole;
  isLoggedIn: boolean;
  student: Student;
  cashier: Cashier;
  studentStatus: AccountStatus;
  setRole: (role: UserRole) => void;
  setStudentStatus: (status: AccountStatus) => void;
  login: (role: UserRole) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  role: 'student',
  isLoggedIn: true,
  student: { ...MOCK_STUDENT },
  cashier: {
    id: "cashier-01",
    name: "كاشير كشك الحرية",
    email: "cashier.alhorria@kiosks.sphinx.edu.eg",
    role: "cashier",
    kioskId: "kiosk-01",
    kioskName: "كشك الحرية",
    createdAt: "2024-09-01T08:00:00Z"
  },
  studentStatus: 'active',

  setRole: (role: UserRole) => set({ role }),
  setStudentStatus: (status: AccountStatus) => set({ studentStatus: status }),
  login: (role: UserRole) => set({ role, isLoggedIn: true }),
  logout: () => set({ isLoggedIn: false }),
}));

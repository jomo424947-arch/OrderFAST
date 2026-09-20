import { create } from 'zustand';
import { Student, AccountStatus } from '@/types';
import { apiClient } from '@/lib/api/client';

interface StudentStoreState {
  students: Student[];
  isLoading: boolean;
  error: string | null;

  fetchStudents: (university?: string) => Promise<Student[]>;
  updateStudentStatus: (studentId: string, status: AccountStatus) => Promise<void>;
}

export const useStudentStore = create<StudentStoreState>((set, get) => ({
  students: [],
  isLoading: false,
  error: null,

  fetchStudents: async (university?: string) => {
    try {
      set({ isLoading: true, error: null });
      const endpoint = university
        ? `/auth/students?university=${encodeURIComponent(university)}`
        : '/auth/students';
      const data = await apiClient.get<Student[]>(endpoint);
      const list = Array.isArray(data) ? data : [];
      set({ students: list, isLoading: false });
      return list;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'فشل جلب بيانات الطلاب' });
      return get().students;
    }
  },

  updateStudentStatus: async (studentId: string, status: AccountStatus) => {
    // Optimistic UI update
    set((state) => ({
      students: state.students.map((s) =>
        s.id === studentId ? { ...s, status } : s
      ),
    }));

    try {
      await apiClient.patch(`/auth/students/${studentId}/status`, {
        accountStatus: status,
      });
    } catch (err: any) {
      console.error('Failed to update student status on backend:', err);
    }
  },
}));


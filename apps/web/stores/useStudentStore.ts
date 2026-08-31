import { create } from 'zustand';
import { Student, AccountStatus } from '@/types';
import { MOCK_STUDENTS } from '@/lib/mock/students';

interface StudentStoreState {
  students: Student[];
  updateStudentStatus: (studentId: string, status: AccountStatus) => void;
}

export const useStudentStore = create<StudentStoreState>((set) => ({
  students: [...MOCK_STUDENTS],

  updateStudentStatus: (studentId: string, status: AccountStatus) => {
    set((state) => ({
      students: state.students.map((s) =>
        s.id === studentId ? { ...s, status } : s
      ),
    }));
  },
}));

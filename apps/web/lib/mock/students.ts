import { Student } from "@/types";

export const MOCK_STUDENTS: Student[] = [
  {
    id: "std-001",
    name: "أحمد كريم",
    email: "ahmed.karim@sphinx.edu.eg",
    role: "student",
    universityId: "20220914",
    college: "كلية الحاسبات والمعلومات",
    status: "active",
    noShowCount: 0,
    phone: "01012345678",
    createdAt: "2024-09-01T08:00:00Z",
  },
  {
    id: "std-002",
    name: "سارة حسن",
    email: "sara.hassan@sphinx.edu.eg",
    role: "student",
    universityId: "20210342",
    college: "كلية الهندسة",
    status: "warning",
    noShowCount: 1,
    phone: "01198765432",
    createdAt: "2024-09-05T10:30:00Z",
  },
  {
    id: "std-003",
    name: "محمد عادل",
    email: "mohamed.adel@sphinx.edu.eg",
    role: "student",
    universityId: "20230155",
    college: "كلية التجارة وإدارة الأعمال",
    status: "restricted",
    noShowCount: 3,
    phone: "01055443322",
    createdAt: "2024-10-12T14:00:00Z",
  },
  {
    id: "std-004",
    name: "نور الهدى",
    email: "nour.elhoda@sphinx.edu.eg",
    role: "student",
    universityId: "20240087",
    college: "كلية الصيدلة",
    status: "active",
    noShowCount: 0,
    phone: "01277889900",
    createdAt: "2024-11-20T09:15:00Z",
  },
];

/** Backward compatibility — same object as MOCK_STUDENTS[0] */
export const MOCK_STUDENT: Student = MOCK_STUDENTS[0];

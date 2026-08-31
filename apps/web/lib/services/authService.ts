import { User, Student, Cashier, Admin, UserRole } from "@/types";
import { MOCK_STUDENTS } from "@/lib/mock/students";
import { MOCK_CASHIERS } from "@/lib/mock/cashiers";
import { MOCK_ADMIN } from "@/lib/mock/admin";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  /** Student-only */
  college?: string;
  universityId?: string;
  /** Cashier-only */
  kioskName?: string;
  collegeLocation?: string;
}

export interface IAuthService {
  getCurrentUser(role?: UserRole): Promise<User>;
  login(email: string, password: string, role: UserRole): Promise<User>;
  register(data: RegisterPayload, role: UserRole): Promise<User>;
  logout(): Promise<void>;
}

export class MockAuthService implements IAuthService {
  private students: Student[] = [...MOCK_STUDENTS];
  private cashiers: Cashier[] = [...MOCK_CASHIERS];
  private admins: Admin[] = [{ ...MOCK_ADMIN }];

  async getCurrentUser(role: UserRole = "student"): Promise<User> {
    if (role === "cashier") return this.cashiers[0];
    if (role === "admin") return this.admins[0];
    return this.students[0];
  }

  async login(email: string, _password: string, role: UserRole): Promise<User> {
    let user: User | undefined;

    if (role === "student") {
      user = this.students.find((s) => s.email === email);
    } else if (role === "cashier") {
      user = this.cashiers.find((c) => c.email === email);
    } else if (role === "admin") {
      user = this.admins.find((a) => a.email === email);
    }

    if (!user) {
      throw new Error("بيانات الدخول غير صحيحة");
    }

    return user;
  }

  async register(data: RegisterPayload, role: UserRole): Promise<User> {
    const id = `${role}-${Date.now()}`;
    const base: User = {
      id,
      name: data.name,
      email: data.email,
      role,
      createdAt: new Date().toISOString(),
    };

    if (role === "student") {
      const student: Student = {
        ...base,
        universityId: data.universityId || `U${Date.now()}`,
        college: data.college || "كلية الحاسبات والمعلومات",
        status: "active",
        noShowCount: 0,
      };
      this.students.push(student);
      return student;
    }

    if (role === "cashier") {
      const kioskId = `kiosk-${Date.now()}`;
      const cashier: Cashier = {
        ...base,
        kioskId,
        kioskName: data.kioskName || "كشك جديد",
      };
      this.cashiers.push(cashier);
      return cashier;
    }

    // admin
    const admin: Admin = {
      ...base,
      permissions: [],
    };
    this.admins.push(admin);
    return admin;
  }

  async logout(): Promise<void> {
    // Mock logout — nothing to clean server-side
  }

  /** Helper used by register cashier flow to get new kiosk data */
  getNewKioskData(cashier: Cashier, collegeLocation: string) {
    return {
      id: cashier.kioskId,
      name: cashier.kioskName,
      collegeLocation,
      campusZone: "",
      category: "عامة",
      isOpen: false,
      openingHours: "غير محدد",
      estimatedWaitMins: 15,
      ordersAheadCount: 0,
      rating: 0,
      acceptsOnlineOrders: true,
      isRushMode: false,
    };
  }
}

export const authService = new MockAuthService();

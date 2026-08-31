import { User, Student, Cashier, UserRole } from "@/types";
import { MOCK_STUDENT } from "@/lib/mock/students";

export interface IAuthService {
  getCurrentUser(): Promise<User>;
  login(email: string, role: UserRole): Promise<User>;
  logout(): Promise<void>;
}

export class MockAuthService implements IAuthService {
  private currentStudent: Student = { ...MOCK_STUDENT };
  private currentCashier: Cashier = {
    id: "cashier-01",
    name: "كاشير كشك الحرية",
    email: "cashier.alhorria@kiosks.sphinx.edu.eg",
    role: "cashier",
    kioskId: "kiosk-01",
    kioskName: "كشك الحرية",
    createdAt: "2024-09-01T08:00:00Z"
  };

  async getCurrentUser(role: UserRole = "student"): Promise<User> {
    return role === "cashier" ? this.currentCashier : this.currentStudent;
  }

  async login(email: string, role: UserRole): Promise<User> {
    if (role === "cashier") {
      return this.currentCashier;
    }
    return this.currentStudent;
  }

  async logout(): Promise<void> {
    // Mock logout
  }
}

export const authService = new MockAuthService();

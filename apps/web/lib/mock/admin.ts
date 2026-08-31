import { Admin } from "@/types";

export const MOCK_ADMIN: Admin = {
  id: "admin-01",
  name: "مدير النظام",
  email: "admin@sphinx.edu.eg",
  role: "admin",
  permissions: ["manage_kiosks", "manage_students", "approve_menu"],
  createdAt: "2024-01-01T00:00:00Z",
};

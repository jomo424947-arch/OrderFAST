import { Kiosk } from "@/types";
import { MOCK_KIOSKS } from "@/lib/mock/kiosks";

export interface IKioskService {
  getAllKiosks(): Promise<Kiosk[]>;
  getKioskById(id: string): Promise<Kiosk | null>;
  searchKiosks(query: string, category?: string): Promise<Kiosk[]>;
  updateKioskStatus(kioskId: string, isOpen: boolean, isRushMode?: boolean): Promise<Kiosk>;
  updateEstimatedWaitTime(kioskId: string, mins: number): Promise<Kiosk>;
  getKioskStats?(kioskId: string): Promise<any>;
}

export class MockKioskService implements IKioskService {
  private kiosks: Kiosk[] = [...MOCK_KIOSKS];

  async getAllKiosks(): Promise<Kiosk[]> {
    return this.kiosks;
  }

  async getKioskById(id: string): Promise<Kiosk | null> {
    const kiosk = this.kiosks.find((k) => k.id === id);
    return kiosk || null;
  }

  async searchKiosks(query: string, category?: string): Promise<Kiosk[]> {
    const q = query.trim().toLowerCase();
    return this.kiosks.filter((kiosk) => {
      const matchQuery =
        !q ||
        kiosk.name.toLowerCase().includes(q) ||
        kiosk.collegeLocation.toLowerCase().includes(q) ||
        kiosk.category.toLowerCase().includes(q);

      const matchCategory =
        !category ||
        category === "all" ||
        (category === "my_college" && kiosk.collegeLocation.includes("الحاسبات")) ||
        (category === "drinks" && kiosk.category.includes("مشروبات")) ||
        (category === "sandwiches" && (kiosk.category.includes("ساندوتشات") || kiosk.category.includes("سناكس")));

      return matchQuery && matchCategory;
    });
  }

  async updateKioskStatus(kioskId: string, isOpen: boolean): Promise<Kiosk> {
    const index = this.kiosks.findIndex((k) => k.id === kioskId);
    if (index === -1) throw new Error("Kiosk not found");
    this.kiosks[index] = { ...this.kiosks[index], isOpen };
    return this.kiosks[index];
  }

  async updateEstimatedWaitTime(kioskId: string, mins: number): Promise<Kiosk> {
    const index = this.kiosks.findIndex((k) => k.id === kioskId);
    if (index === -1) throw new Error("Kiosk not found");
    this.kiosks[index] = { ...this.kiosks[index], estimatedWaitMins: mins };
    return this.kiosks[index];
  }
}

import { ApiKioskService } from "./api/apiKioskService";

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";
export const kioskService: IKioskService = useMock ? new MockKioskService() : new ApiKioskService();

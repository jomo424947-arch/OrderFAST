import { apiClient } from '@/lib/api/client';
import { Kiosk } from '@/types';
import { IKioskService } from '../kioskService';
import { adaptKioskFromApi, ApiKioskRaw } from '@/lib/adapters/kioskAdapter';

export class ApiKioskService implements IKioskService {
  async getAllKiosks(): Promise<Kiosk[]> {
    const rawKiosks = await apiClient.get<ApiKioskRaw[]>('/kiosks', { skipAuth: true });
    return Array.isArray(rawKiosks) ? rawKiosks.map(adaptKioskFromApi) : [];
  }

  async getKioskById(id: string): Promise<Kiosk | null> {
    try {
      const rawKiosk = await apiClient.get<ApiKioskRaw>(`/kiosks/${id}`, { skipAuth: true });
      return rawKiosk ? adaptKioskFromApi(rawKiosk) : null;
    } catch {
      return null;
    }
  }

  async searchKiosks(query: string, category?: string): Promise<Kiosk[]> {
    const all = await this.getAllKiosks();
    const q = query.trim().toLowerCase();

    return all.filter((kiosk) => {
      const matchQuery =
        !q ||
        kiosk.name.toLowerCase().includes(q) ||
        kiosk.collegeLocation.toLowerCase().includes(q) ||
        kiosk.category.toLowerCase().includes(q);

      const matchCategory =
        !category ||
        category === 'all' ||
        (category === 'my_college' && kiosk.collegeLocation.includes('الحاسبات')) ||
        (category === 'drinks' && kiosk.category.includes('مشروبات')) ||
        (category === 'sandwiches' &&
          (kiosk.category.includes('ساندوتشات') || kiosk.category.includes('سناكس')));

      return matchQuery && matchCategory;
    });
  }

  async updateKioskStatus(kioskId: string, isOpen: boolean, isRushMode?: boolean): Promise<Kiosk> {
    const rawUpdated = await apiClient.patch<ApiKioskRaw>(`/kiosks/${kioskId}/status`, {
      isOpen,
      isRushMode: isRushMode ?? false,
    });
    return adaptKioskFromApi(rawUpdated);
  }

  async updateEstimatedWaitTime(kioskId: string, mins: number): Promise<Kiosk> {
    const rawUpdated = await apiClient.patch<ApiKioskRaw>(`/kiosks/${kioskId}/settings`, {
      defaultPrepTimeMins: mins,
    });
    return adaptKioskFromApi(rawUpdated);
  }

  async getKioskStats(kioskId: string): Promise<any> {
    return apiClient.get<any>(`/kiosks/${kioskId}/stats`);
  }

  async getAdminKiosksWithStaff(): Promise<any[]> {
    const rawList = await apiClient.get<any[]>('/kiosks/admin/with-staff');
    return Array.isArray(rawList)
      ? rawList.map((k) => ({
          ...adaptKioskFromApi(k),
          staff: k.staff || [],
          menuItemsCount: k.menuItemsCount || 0,
        }))
      : [];
  }

  async createKiosk(data: {
    name: string;
    collegeLocation: string;
    campusZone?: string;
    category?: string;
    phone?: string;
    openingHours?: string;
  }): Promise<Kiosk> {
    const raw = await apiClient.post<ApiKioskRaw>('/kiosks', data);
    return adaptKioskFromApi(raw);
  }

  async getStaffList(): Promise<any[]> {
    const list = await apiClient.get<any[]>('/kiosks/admin/staff-list');
    return Array.isArray(list) ? list : [];
  }

  async assignStaff(kioskId: string, userId: string, role: string = 'cashier'): Promise<any> {
    return apiClient.post(`/kiosks/${kioskId}/staff`, { userId, role });
  }

  async removeStaff(kioskId: string, userId: string): Promise<any> {
    return apiClient.delete(`/kiosks/${kioskId}/staff/${userId}`);
  }
}

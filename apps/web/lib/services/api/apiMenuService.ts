import { apiClient } from '@/lib/api/client';
import { MenuCategory, MenuItem } from '@/types';
import { IMenuService } from '../menuService';
import {
  adaptMenuItemFromApi,
  adaptMenuCategoryFromApi,
  ApiMenuItemRaw,
  ApiMenuCategoryRaw,
} from '@/lib/adapters/kioskAdapter';
import { egpToPiasters } from '@/lib/adapters/priceAdapter';

export interface ApiMenuResponse {
  categories: ApiMenuCategoryRaw[];
  items: ApiMenuItemRaw[];
}

export class ApiMenuService implements IMenuService {
  async getMenu(kioskId: string, isStaff = false): Promise<{ categories: MenuCategory[]; items: MenuItem[] }> {
    const endpoint = isStaff
      ? `/kiosks/${kioskId}/menu/staff`
      : `/kiosks/${kioskId}/menu`;

    const data = await apiClient.get<ApiMenuResponse>(endpoint, { skipAuth: !isStaff });

    const categories = Array.isArray(data?.categories)
      ? data.categories.map(adaptMenuCategoryFromApi)
      : [];
    const items = Array.isArray(data?.items)
      ? data.items.map(adaptMenuItemFromApi)
      : [];

    return { categories, items };
  }

  async getCategories(kioskId: string): Promise<MenuCategory[]> {
    const { categories } = await this.getMenu(kioskId);
    return categories;
  }

  async createCategory(kioskId: string, name: string): Promise<MenuCategory> {
    const raw = await apiClient.post<ApiMenuCategoryRaw>(
      `/kiosks/${kioskId}/categories`,
      { name, displayOrder: 0 }
    );
    return adaptMenuCategoryFromApi(raw);
  }

  async getMenuItems(kioskId: string): Promise<MenuItem[]> {
    const { items } = await this.getMenu(kioskId);
    return items;
  }

  async toggleItemAvailability(itemId: string, isAvailable: boolean): Promise<MenuItem> {
    const updated = await apiClient.patch<ApiMenuItemRaw>(
      `/menu-items/${itemId}/availability`,
      { isAvailable }
    );
    return adaptMenuItemFromApi(updated);
  }

  async addMenuItem(itemData: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    const created = await apiClient.post<ApiMenuItemRaw>(
      `/kiosks/${itemData.kioskId}/menu-items`,
      {
        categoryId: itemData.categoryId,
        name: itemData.name,
        description: itemData.description,
        price: egpToPiasters(itemData.price),
        preparationTimeMins: itemData.preparationTimeMins || 5,
        imageUrl: itemData.imageUrl,
      }
    );
    return adaptMenuItemFromApi(created);
  }

  async updateMenuItem(item: MenuItem): Promise<MenuItem> {
    const updated = await apiClient.patch<ApiMenuItemRaw>(
      `/menu-items/${item.id}`,
      {
        name: item.name,
        description: item.description,
        price: egpToPiasters(item.price),
        categoryId: item.categoryId,
        preparationTimeMins: item.preparationTimeMins,
        imageUrl: item.imageUrl,
      }
    );
    return adaptMenuItemFromApi(updated);
  }

  async deleteMenuItem(itemId: string): Promise<void> {
    await apiClient.delete(`/menu-items/${itemId}`);
  }

  // Admin methods
  async getUnderReviewItems(): Promise<MenuItem[]> {
    const items = await apiClient.get<ApiMenuItemRaw[]>('/admin/menu-review');
    return Array.isArray(items) ? items.map(adaptMenuItemFromApi) : [];
  }

  async approveMenuItem(itemId: string): Promise<MenuItem> {
    const approved = await apiClient.post<ApiMenuItemRaw>(`/admin/menu-items/${itemId}/approve`);
    return adaptMenuItemFromApi(approved);
  }

  async rejectMenuItem(itemId: string): Promise<void> {
    await apiClient.post(`/admin/menu-items/${itemId}/reject`);
  }
}

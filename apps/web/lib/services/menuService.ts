import { MenuCategory, MenuItem } from "@/types";
import { MOCK_CATEGORIES, MOCK_MENU_ITEMS } from "@/lib/mock/menu";

export interface IMenuService {
  getCategories(kioskId: string): Promise<MenuCategory[]>;
  getMenuItems(kioskId: string): Promise<MenuItem[]>;
  toggleItemAvailability(itemId: string, isAvailable: boolean): Promise<MenuItem>;
  addMenuItem(itemData: Omit<MenuItem, "id">): Promise<MenuItem>;
  updateMenuItem(item: MenuItem): Promise<MenuItem>;
  deleteMenuItem(itemId: string): Promise<void>;
}

export class MockMenuService implements IMenuService {
  private categories: MenuCategory[] = [...MOCK_CATEGORIES];
  private items: MenuItem[] = [...MOCK_MENU_ITEMS];

  async getCategories(kioskId: string): Promise<MenuCategory[]> {
    return this.categories.filter((c) => c.kioskId === kioskId || !c.kioskId);
  }

  async getMenuItems(kioskId: string): Promise<MenuItem[]> {
    return this.items.filter((i) => i.kioskId === kioskId || !i.kioskId);
  }

  async toggleItemAvailability(itemId: string, isAvailable: boolean): Promise<MenuItem> {
    const index = this.items.findIndex((i) => i.id === itemId);
    if (index === -1) throw new Error("Item not found");
    this.items[index] = { ...this.items[index], isAvailable };
    return this.items[index];
  }

  async addMenuItem(itemData: Omit<MenuItem, "id">): Promise<MenuItem> {
    const newItem: MenuItem = {
      ...itemData,
      id: `item-${Date.now()}`,
      isUnderReview: true, // New items are under review by default
    };
    this.items.push(newItem);
    return newItem;
  }

  async updateMenuItem(item: MenuItem): Promise<MenuItem> {
    const index = this.items.findIndex((i) => i.id === item.id);
    if (index === -1) throw new Error("Item not found");
    this.items[index] = item;
    return this.items[index];
  }

  async deleteMenuItem(itemId: string): Promise<void> {
    this.items = this.items.filter((i) => i.id !== itemId);
  }
}

export const menuService = new MockMenuService();

import { Kiosk, MenuItem, MenuCategory } from '@/types';
import { piastersToEgp } from './priceAdapter';

export interface ApiKioskRaw {
  id: string;
  name: string;
  collegeLocation: string;
  campusZone?: string | null;
  category?: string | null;
  isOpen: boolean;
  openingHours?: string | null;
  phone?: string | null;
  rating?: string | number | null;
  ratingCount?: number | null;
  imageUrl?: string | null;
  acceptsOnlineOrders?: boolean;
  isRushMode?: boolean;
  defaultPrepTimeMins?: number;
  acceptanceTimeoutSecs?: number;
  ordersAheadCount?: number;
  estimatedWaitMins?: number;
}

export interface ApiMenuItemRaw {
  id: string;
  kioskId: string;
  categoryId: string;
  name: string;
  description?: string | null;
  price: number; // in Piasters
  originalPrice?: number | null; // in Piasters
  offerTag?: string | null;
  isCombo?: boolean;
  comboItems?: { itemId: string; name: string; quantity: number }[] | null;
  isAvailable: boolean;
  isUnderReview?: boolean;
  preparationTimeMins?: number;
  imageUrl?: string | null;
  kioskName?: string;
  collegeLocation?: string;
  categoryName?: string;
}

export interface ApiMenuCategoryRaw {
  id: string;
  kioskId: string;
  name: string;
  displayOrder?: number;
  isActive?: boolean;
}

export function adaptKioskFromApi(raw: ApiKioskRaw): Kiosk {
  const ratingNum = typeof raw.rating === 'string' ? parseFloat(raw.rating) : (raw.rating ?? 0.0);
  
  return {
    id: raw.id,
    name: raw.name,
    collegeLocation: raw.collegeLocation,
    campusZone: raw.campusZone || '',
    category: raw.category || 'عام',
    isOpen: !!raw.isOpen,
    openingHours: raw.openingHours || '8:00 ص - 4:00 م',
    estimatedWaitMins: raw.estimatedWaitMins ?? (raw.defaultPrepTimeMins || 15),
    ordersAheadCount: raw.ordersAheadCount ?? 0,
    rating: isNaN(ratingNum) ? 0.0 : ratingNum,
    ratingCount: raw.ratingCount ?? 0,
    imageUrl: raw.imageUrl || undefined,
    acceptsOnlineOrders: raw.acceptsOnlineOrders !== undefined ? raw.acceptsOnlineOrders : true,
    isRushMode: !!raw.isRushMode,
    defaultPrepTimeMins: raw.defaultPrepTimeMins || 15,
    acceptanceTimeoutSecs: raw.acceptanceTimeoutSecs || 300,
    phone: raw.phone || undefined,
  };
}

export function adaptMenuItemFromApi(raw: ApiMenuItemRaw): MenuItem & { kioskName?: string; collegeLocation?: string; categoryName?: string } {
  return {
    id: raw.id,
    kioskId: raw.kioskId,
    categoryId: raw.categoryId,
    name: raw.name,
    description: raw.description || undefined,
    price: piastersToEgp(raw.price),
    originalPrice: raw.originalPrice ? piastersToEgp(raw.originalPrice) : undefined,
    offerTag: raw.offerTag || undefined,
    isCombo: !!raw.isCombo,
    comboItems: Array.isArray(raw.comboItems) ? raw.comboItems : undefined,
    isAvailable: !!raw.isAvailable,
    isUnderReview: raw.isUnderReview !== undefined ? !!raw.isUnderReview : false,
    preparationTimeMins: raw.preparationTimeMins || 5,
    imageUrl: raw.imageUrl || undefined,
    kioskName: raw.kioskName,
    collegeLocation: raw.collegeLocation,
    categoryName: raw.categoryName,
  };
}

export function adaptMenuCategoryFromApi(raw: ApiMenuCategoryRaw): MenuCategory {
  return {
    id: raw.id,
    kioskId: raw.kioskId,
    name: raw.name,
    displayOrder: raw.displayOrder ?? 0,
  };
}

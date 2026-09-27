import { create } from 'zustand';
import { apiClient } from '@/lib/api/client';

export interface ServiceFeeConfig {
  id: string;
  isEnabled: boolean;
  tier1MaxEgp: number;
  tier1FeeCash: number;
  tier1FeeOnline: number;
  tier2MaxEgp: number;
  tier2FeeCash: number;
  tier2FeeOnline: number;
  tier3FeeCash: number;
  tier3FeeOnline: number;
  freeDaysOfWeek: number[]; // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  specialFreeDate: string | null;
  freeDayBannerText: string;
  firstOrderFree: boolean;
  minFeeCap: number;
  maxFeeCap: number;
  promoDiscountPercent: number;
  promoDiscountActive: boolean;
  promoDiscountEndsAt: string | null;
  promoBannerText: string;
  updatedAt?: string;
  updatedBy?: string;
}

export type PresetKey = 'standard' | 'online_boost' | 'promo_fest' | 'flat_economy' | 'free_weekends';

export const DEFAULT_FEE_CONFIG: ServiceFeeConfig = {
  id: 'default',
  isEnabled: true,
  tier1MaxEgp: 100,
  tier1FeeCash: 3,
  tier1FeeOnline: 2,
  tier2MaxEgp: 200,
  tier2FeeCash: 5,
  tier2FeeOnline: 4,
  tier3FeeCash: 10,
  tier3FeeOnline: 8,
  freeDaysOfWeek: [],
  specialFreeDate: null,
  freeDayBannerText: '🎉 اليوم طلبك بدون أي رسوم خدمة في الحرم الجامعي!',
  firstOrderFree: true,
  minFeeCap: 0,
  maxFeeCap: 15,
  promoDiscountPercent: 0,
  promoDiscountActive: false,
  promoDiscountEndsAt: null,
  promoBannerText: '🔥 خصم خاص على رسوم الخدمة لفترة محدودة!',
  updatedBy: 'مدير النظام',
};

const STORAGE_KEY = 'fastorder_service_fee_config';

function loadStoredConfig(): ServiceFeeConfig {
  if (typeof window === 'undefined') return DEFAULT_FEE_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_FEE_CONFIG, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('[useServiceFeeStore] Error reading localStorage:', err);
  }
  return DEFAULT_FEE_CONFIG;
}

function persistConfig(config: ServiceFeeConfig) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn('[useServiceFeeStore] Error saving to localStorage:', err);
  }
}

export interface CalculatedFeeResult {
  feeEGP: number;
  feePiasters: number;
  rawTierFeeEGP: number;
  discountAmountEGP: number;
  appliedTier: 1 | 2 | 3;
  isFree: boolean;
  isFreeDay: boolean;
  isFirstOrderFree: boolean;
  isPromoDiscount: boolean;
  reason: string;
}

interface ServiceFeeState {
  config: ServiceFeeConfig;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastFetchedAt: number | null;

  fetchConfig: (force?: boolean) => Promise<ServiceFeeConfig>;
  updateConfig: (partial: Partial<ServiceFeeConfig>) => Promise<boolean>;
  resetToDefaults: () => Promise<boolean>;
  applyPreset: (preset: PresetKey) => Promise<boolean>;
  calculateServiceFee: (params: {
    subtotalEGP: number;
    paymentMethod?: 'cash' | 'digital_wallet';
    isFirstOrder?: boolean;
    date?: Date;
  }) => CalculatedFeeResult;
}

export const useServiceFeeStore = create<ServiceFeeState>((set, get) => ({
  config: loadStoredConfig(),
  isLoading: false,
  isSaving: false,
  error: null,
  lastFetchedAt: null,

  fetchConfig: async (force = false) => {
    const now = Date.now();
    if (!force && get().lastFetchedAt && now - get().lastFetchedAt! < 60_000) {
      return get().config;
    }

    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get<any>('/service-fee/config');
      const data = res?.data ?? res;
      if (data && typeof data === 'object') {
        const merged: ServiceFeeConfig = {
          ...DEFAULT_FEE_CONFIG,
          ...data,
          freeDaysOfWeek: Array.isArray(data.freeDaysOfWeek) ? data.freeDaysOfWeek : [],
        };
        persistConfig(merged);
        set({ config: merged, isLoading: false, lastFetchedAt: now });
        return merged;
      }
    } catch (err: any) {
      console.warn('[useServiceFeeStore] Failed to fetch server config, using local cached:', err);
    }

    set({ isLoading: false });
    return get().config;
  },

  updateConfig: async (partial) => {
    set({ isSaving: true, error: null });
    const current = get().config;
    const merged: ServiceFeeConfig = {
      ...current,
      ...partial,
      updatedAt: new Date().toISOString(),
    };

    // Update UI immediately (optimistic update)
    set({ config: merged });
    persistConfig(merged);

    try {
      await apiClient.put('/service-fee/admin/config', merged);
      set({ isSaving: false });
      return true;
    } catch (err: any) {
      console.warn('[useServiceFeeStore] Server save failed, saved locally:', err);
      set({ isSaving: false });
      return true; // Still returns true because local state is preserved
    }
  },

  resetToDefaults: async () => {
    set({ isSaving: true, error: null });
    try {
      await apiClient.post('/service-fee/admin/reset', {});
    } catch (err) {
      console.warn('[useServiceFeeStore] Server reset failed, resetting locally:', err);
    }
    const fresh = { ...DEFAULT_FEE_CONFIG, updatedAt: new Date().toISOString() };
    persistConfig(fresh);
    set({ config: fresh, isSaving: false });
    return true;
  },

  applyPreset: async (preset: PresetKey) => {
    let presetChanges: Partial<ServiceFeeConfig> = {};

    switch (preset) {
      case 'standard':
        presetChanges = {
          isEnabled: true,
          tier1MaxEgp: 100,
          tier1FeeCash: 3,
          tier1FeeOnline: 2,
          tier2MaxEgp: 200,
          tier2FeeCash: 5,
          tier2FeeOnline: 4,
          tier3FeeCash: 10,
          tier3FeeOnline: 8,
          firstOrderFree: true,
          promoDiscountActive: false,
          promoDiscountPercent: 0,
          minFeeCap: 0,
          maxFeeCap: 15,
        };
        break;

      case 'online_boost':
        // Strong incentive to pay online: Cash is standard/higher, Digital wallet is 50% cheaper
        presetChanges = {
          isEnabled: true,
          tier1MaxEgp: 100,
          tier1FeeCash: 4,
          tier1FeeOnline: 2,
          tier2MaxEgp: 200,
          tier2FeeCash: 7,
          tier2FeeOnline: 3,
          tier3FeeCash: 12,
          tier3FeeOnline: 5,
          firstOrderFree: true,
          promoDiscountActive: false,
        };
        break;

      case 'promo_fest':
        // 50% off on all fees with active promo banner
        presetChanges = {
          isEnabled: true,
          promoDiscountActive: true,
          promoDiscountPercent: 50,
          promoBannerText: '🔥 عرض خاص: خصم 50% على جميع رسوم الخدمة في الحرم الجامعي!',
        };
        break;

      case 'flat_economy':
        // Flat 3 EGP for everything
        presetChanges = {
          isEnabled: true,
          tier1MaxEgp: 100,
          tier1FeeCash: 3,
          tier1FeeOnline: 2,
          tier2MaxEgp: 200,
          tier2FeeCash: 3,
          tier2FeeOnline: 2,
          tier3FeeCash: 3,
          tier3FeeOnline: 2,
          promoDiscountActive: false,
        };
        break;

      case 'free_weekends':
        // Friday (5) and Saturday (6) free
        presetChanges = {
          isEnabled: true,
          freeDaysOfWeek: [5, 6],
          freeDayBannerText: '🎉 نهاية الأسبوع الجامعي: أوردراتك بدون أي رسوم خدمة!',
        };
        break;
    }

    return get().updateConfig(presetChanges);
  },

  calculateServiceFee: ({ subtotalEGP, paymentMethod = 'cash', isFirstOrder = false, date }) => {
    const config = get().config;

    // 1. Master toggle check
    if (!config.isEnabled) {
      return {
        feeEGP: 0,
        feePiasters: 0,
        rawTierFeeEGP: 0,
        discountAmountEGP: 0,
        appliedTier: 1,
        isFree: true,
        isFreeDay: false,
        isFirstOrderFree: false,
        isPromoDiscount: false,
        reason: 'رسوم الخدمة مجانية (معطلة في المنصة)',
      };
    }

    const targetDate = date || new Date();
    const dayOfWeek = targetDate.getDay();
    const todayYmd = targetDate.toISOString().slice(0, 10);

    // 2. Free Day check
    const isFreeDay =
      (Array.isArray(config.freeDaysOfWeek) && config.freeDaysOfWeek.includes(dayOfWeek)) ||
      (Boolean(config.specialFreeDate) && config.specialFreeDate === todayYmd);

    if (isFreeDay) {
      return {
        feeEGP: 0,
        feePiasters: 0,
        rawTierFeeEGP: 0,
        discountAmountEGP: 0,
        appliedTier: 1,
        isFree: true,
        isFreeDay: true,
        isFirstOrderFree: false,
        isPromoDiscount: false,
        reason: config.freeDayBannerText || 'اليوم مجاني بالكامل 🎉',
      };
    }

    // 3. First Order Free check
    if (config.firstOrderFree && isFirstOrder) {
      return {
        feeEGP: 0,
        feePiasters: 0,
        rawTierFeeEGP: 0,
        discountAmountEGP: 0,
        appliedTier: 1,
        isFree: true,
        isFreeDay: false,
        isFirstOrderFree: true,
        isPromoDiscount: false,
        reason: 'إعفاء أول أوردر لك مجاناً بالكامل 🎉',
      };
    }

    // 4. Tier & Payment Method resolution
    const isOnline = paymentMethod === 'digital_wallet';
    let appliedTier: 1 | 2 | 3 = 1;
    let baseFee = 0;

    if (subtotalEGP < config.tier1MaxEgp) {
      appliedTier = 1;
      baseFee = isOnline ? config.tier1FeeOnline : config.tier1FeeCash;
    } else if (subtotalEGP <= config.tier2MaxEgp) {
      appliedTier = 2;
      baseFee = isOnline ? config.tier2FeeOnline : config.tier2FeeCash;
    } else {
      appliedTier = 3;
      baseFee = isOnline ? config.tier3FeeOnline : config.tier3FeeCash;
    }

    // 5. Promo Percentage Discount
    let feeAfterDiscount = baseFee;
    let discountAmount = 0;
    let isPromoDiscount = false;

    if (config.promoDiscountActive && config.promoDiscountPercent > 0) {
      const isExpired =
        config.promoDiscountEndsAt &&
        new Date(config.promoDiscountEndsAt).getTime() < targetDate.getTime();

      if (!isExpired) {
        const fraction = Math.min(100, Math.max(0, config.promoDiscountPercent)) / 100;
        discountAmount = Math.round(baseFee * fraction * 100) / 100;
        feeAfterDiscount = Math.max(0, baseFee - discountAmount);
        isPromoDiscount = true;
      }
    }

    // 6. Safety Caps (Min / Max)
    let finalFee = feeAfterDiscount;
    if (config.minFeeCap > 0 && finalFee < config.minFeeCap) {
      finalFee = config.minFeeCap;
    }
    if (config.maxFeeCap > 0 && finalFee > config.maxFeeCap) {
      finalFee = config.maxFeeCap;
    }

    return {
      feeEGP: finalFee,
      feePiasters: Math.round(finalFee * 100),
      rawTierFeeEGP: baseFee,
      discountAmountEGP: discountAmount,
      appliedTier,
      isFree: finalFee === 0,
      isFreeDay: false,
      isFirstOrderFree: false,
      isPromoDiscount,
      reason: isOnline ? 'رسم الدفع الإلكتروني' : 'رسم الدفع كاش',
    };
  },
}));

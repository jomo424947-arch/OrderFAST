import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { serviceFeeConfigs, orders } from '../../db/schema.js';

export interface ServiceFeeConfigData {
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
  freeDaysOfWeek: number[];
  specialFreeDate: string | null;
  freeDayBannerText: string;
  firstOrderFree: boolean;
  minFeeCap: number;
  maxFeeCap: number;
  promoDiscountPercent: number;
  promoDiscountActive: boolean;
  promoDiscountEndsAt: string | null;
  promoBannerText: string | null;
  updatedAt?: string | Date;
  updatedBy?: string | null;
}

const DEFAULT_CONFIG: ServiceFeeConfigData = {
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
  freeDayBannerText: 'اليوم طلبك بدون أي رسوم خدمة في الحرم الجامعي!',
  firstOrderFree: true,
  minFeeCap: 0,
  maxFeeCap: 15,
  promoDiscountPercent: 0,
  promoDiscountActive: false,
  promoDiscountEndsAt: null,
  promoBannerText: 'خصم خاص على رسوم الخدمة لفترة محدودة!',
  updatedBy: 'مدير النظام',
};

class ServiceFeeService {
  private cachedConfig: ServiceFeeConfigData | null = null;
  private cacheExpiresAt = 0;

  /**
   * Get active service fee configuration (with in-memory cache)
   */
  async getConfig(): Promise<ServiceFeeConfigData> {
    const now = Date.now();
    if (this.cachedConfig && now < this.cacheExpiresAt) {
      return this.cachedConfig;
    }

    try {
      const [record] = await db
        .select()
        .from(serviceFeeConfigs)
        .where(eq(serviceFeeConfigs.id, 'default'))
        .limit(1);

      if (record) {
        this.cachedConfig = {
          id: record.id,
          isEnabled: record.isEnabled,
          tier1MaxEgp: record.tier1MaxEgp,
          tier1FeeCash: record.tier1FeeCash,
          tier1FeeOnline: record.tier1FeeOnline,
          tier2MaxEgp: record.tier2MaxEgp,
          tier2FeeCash: record.tier2FeeCash,
          tier2FeeOnline: record.tier2FeeOnline,
          tier3FeeCash: record.tier3FeeCash,
          tier3FeeOnline: record.tier3FeeOnline,
          freeDaysOfWeek: (record.freeDaysOfWeek as number[]) || [],
          specialFreeDate: record.specialFreeDate,
          freeDayBannerText: record.freeDayBannerText,
          firstOrderFree: record.firstOrderFree,
          minFeeCap: record.minFeeCap,
          maxFeeCap: record.maxFeeCap,
          promoDiscountPercent: record.promoDiscountPercent,
          promoDiscountActive: record.promoDiscountActive,
          promoDiscountEndsAt: record.promoDiscountEndsAt ? record.promoDiscountEndsAt.toISOString() : null,
          promoBannerText: record.promoBannerText,
          updatedAt: record.updatedAt,
          updatedBy: record.updatedBy,
        };
        this.cacheExpiresAt = now + 15_000; // 15 seconds cache
        return this.cachedConfig;
      }
    } catch (err) {
      console.warn('[ServiceFeeService] Failed to load config from db, using default:', err);
    }

    return DEFAULT_CONFIG;
  }

  /**
   * Update configuration (Admin only)
   */
  async updateConfig(input: Partial<ServiceFeeConfigData>, updatedBy = 'مدير النظام'): Promise<ServiceFeeConfigData> {
    const current = await this.getConfig();

    const updatedData = {
      isEnabled: input.isEnabled !== undefined ? Boolean(input.isEnabled) : current.isEnabled,
      tier1MaxEgp: input.tier1MaxEgp !== undefined ? Number(input.tier1MaxEgp) : current.tier1MaxEgp,
      tier1FeeCash: input.tier1FeeCash !== undefined ? Number(input.tier1FeeCash) : current.tier1FeeCash,
      tier1FeeOnline: input.tier1FeeOnline !== undefined ? Number(input.tier1FeeOnline) : current.tier1FeeOnline,
      tier2MaxEgp: input.tier2MaxEgp !== undefined ? Number(input.tier2MaxEgp) : current.tier2MaxEgp,
      tier2FeeCash: input.tier2FeeCash !== undefined ? Number(input.tier2FeeCash) : current.tier2FeeCash,
      tier2FeeOnline: input.tier2FeeOnline !== undefined ? Number(input.tier2FeeOnline) : current.tier2FeeOnline,
      tier3FeeCash: input.tier3FeeCash !== undefined ? Number(input.tier3FeeCash) : current.tier3FeeCash,
      tier3FeeOnline: input.tier3FeeOnline !== undefined ? Number(input.tier3FeeOnline) : current.tier3FeeOnline,
      freeDaysOfWeek: input.freeDaysOfWeek !== undefined ? input.freeDaysOfWeek : current.freeDaysOfWeek,
      specialFreeDate: input.specialFreeDate !== undefined ? input.specialFreeDate : current.specialFreeDate,
      freeDayBannerText: input.freeDayBannerText !== undefined ? input.freeDayBannerText : current.freeDayBannerText,
      firstOrderFree: input.firstOrderFree !== undefined ? Boolean(input.firstOrderFree) : current.firstOrderFree,
      minFeeCap: input.minFeeCap !== undefined ? Number(input.minFeeCap) : current.minFeeCap,
      maxFeeCap: input.maxFeeCap !== undefined ? Number(input.maxFeeCap) : current.maxFeeCap,
      promoDiscountPercent: input.promoDiscountPercent !== undefined ? Number(input.promoDiscountPercent) : current.promoDiscountPercent,
      promoDiscountActive: input.promoDiscountActive !== undefined ? Boolean(input.promoDiscountActive) : current.promoDiscountActive,
      promoDiscountEndsAt: input.promoDiscountEndsAt ? new Date(input.promoDiscountEndsAt) : null,
      promoBannerText: input.promoBannerText !== undefined ? input.promoBannerText : current.promoBannerText,
      updatedAt: new Date(),
      updatedBy,
    };

    await db
      .insert(serviceFeeConfigs)
      .values({
        id: 'default',
        ...updatedData,
      })
      .onConflictDoUpdate({
        target: [serviceFeeConfigs.id],
        set: updatedData,
      });

    // Invalidate cache
    this.cachedConfig = null;
    this.cacheExpiresAt = 0;

    return this.getConfig();
  }

  /**
   * Calculate service fee in integer piasters authoritative for an order
   */
  async calculateFeePiasters(params: {
    subtotalPiasters: number;
    paymentMethod: 'cash' | 'digital_wallet';
    studentId?: string;
  }): Promise<{
    feesPiasters: number;
    reason: string;
    isFreeDay: boolean;
    isFirstOrderFree: boolean;
  }> {
    const config = await this.getConfig();

    // 1. Master toggle check
    if (!config.isEnabled) {
      return {
        feesPiasters: 0,
        reason: 'رسوم الخدمة معطلة بالكامل في المنصة',
        isFreeDay: false,
        isFirstOrderFree: false,
      };
    }

    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
    const todayYmd = now.toISOString().slice(0, 10);

    // 2. Check if today is a free day of the week or special free date
    const isDayOfWeekFree = Array.isArray(config.freeDaysOfWeek) && config.freeDaysOfWeek.includes(currentDayOfWeek);
    const isSpecialDateFree = Boolean(config.specialFreeDate && config.specialFreeDate === todayYmd);

    if (isDayOfWeekFree || isSpecialDateFree) {
      return {
        feesPiasters: 0,
        reason: config.freeDayBannerText || 'اليوم مجاني',
        isFreeDay: true,
        isFirstOrderFree: false,
      };
    }

    // 3. Check first order free waiver
    if (config.firstOrderFree && params.studentId) {
      try {
        const [prevOrder] = await db
          .select({ id: orders.id })
          .from(orders)
          .where(eq(orders.studentId, params.studentId))
          .limit(1);

        if (!prevOrder) {
          return {
            feesPiasters: 0,
            reason: 'إعفاء أول أوردر للطالب مجاناً',
            isFreeDay: false,
            isFirstOrderFree: true,
          };
        }
      } catch (err) {
        console.warn('[ServiceFeeService] Failed to check first order count:', err);
      }
    }

    // 4. Calculate based on Subtotal & Payment Method
    const subtotalEGP = params.subtotalPiasters / 100;
    const isOnline = params.paymentMethod === 'digital_wallet';

    let baseFeeEGP = 0;
    if (subtotalEGP < config.tier1MaxEgp) {
      baseFeeEGP = isOnline ? config.tier1FeeOnline : config.tier1FeeCash;
    } else if (subtotalEGP <= config.tier2MaxEgp) {
      baseFeeEGP = isOnline ? config.tier2FeeOnline : config.tier2FeeCash;
    } else {
      baseFeeEGP = isOnline ? config.tier3FeeOnline : config.tier3FeeCash;
    }

    // 5. Apply Promo Percentage Discount if active
    let feeAfterDiscountEGP = baseFeeEGP;
    if (config.promoDiscountActive && config.promoDiscountPercent > 0) {
      const isExpired = config.promoDiscountEndsAt && new Date(config.promoDiscountEndsAt).getTime() < now.getTime();
      if (!isExpired) {
        const discountFraction = Math.min(100, Math.max(0, config.promoDiscountPercent)) / 100;
        feeAfterDiscountEGP = Math.max(0, Math.round((baseFeeEGP * (1 - discountFraction)) * 100) / 100);
      }
    }

    // 6. Apply Safety Caps (Min / Max)
    let finalFeeEGP = feeAfterDiscountEGP;
    if (config.minFeeCap > 0 && finalFeeEGP < config.minFeeCap) {
      finalFeeEGP = config.minFeeCap;
    }
    if (config.maxFeeCap > 0 && finalFeeEGP > config.maxFeeCap) {
      finalFeeEGP = config.maxFeeCap;
    }

    return {
      feesPiasters: Math.round(finalFeeEGP * 100),
      reason: isOnline ? 'رسم الدفع الإلكتروني' : 'رسم الدفع كاش',
      isFreeDay: false,
      isFirstOrderFree: false,
    };
  }
}

export const serviceFeeService = new ServiceFeeService();

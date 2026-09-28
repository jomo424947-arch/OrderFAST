import { OrderStatus, AccountStatus } from "@/types";

export const APP_NAME = "FastOrder";
export const APP_TAGLINE = "ORDER • WAIT • ENJOY";
export const APP_TAGLINE_AR = "اطلب • استنى • استمتع";

export type UniversityKey = 'sphinx' | 'assiut_ahleya';

export const UNIVERSITIES: { key: UniversityKey; label: string }[] = [
  { key: 'sphinx', label: 'جامعة سفنكس' },
  { key: 'assiut_ahleya', label: 'جامعة أسيوط الأهلية' },
];

export const COLLEGES_BY_UNIVERSITY: Record<UniversityKey, string[]> = {
  sphinx: [
    "كلية الطب البشري",
    "كلية طب الفم والأسنان",
    "كلية الصيدلة",
    "كلية الطب البيطري",
    "كلية العلاج الطبيعي",
    "كلية الهندسة",
    "كلية الحاسبات والذكاء الاصطناعي",
    "كلية تكنولوجيا العلوم الصحية",
    "كلية التمريض",
  ],
  assiut_ahleya: [
    "كلية الطب والجراحة",
    "كلية طب الفم والأسنان",
    "كلية الصيدلة والبحوث الدوائية",
    "كلية الهندسة والعلوم التطبيقية",
    "كلية الحاسبات والذكاء الاصطناعي",
    "كلية العلوم الإدارية والمالية",
    "كلية الألسن واللغات التطبيقية",
  ],
};

// Backward compatibility (default to Sphinx)
export const COLLEGES = COLLEGES_BY_UNIVERSITY.sphinx;

export const CATEGORIES = [
  { id: "all", label: "الكل" },
  { id: "my_college", label: "كليتي" },
  { id: "drinks", label: "مشروبات" },
  { id: "sandwiches", label: "ساندوتشات" },
  { id: "sweets", label: "حلويات وسناكس" },
  { id: "meals", label: "وجبات سريعة" },
];

export const KIOSK_OFFERING_OPTIONS = [
  { value: 'ماكولات', label: 'مأكولات' },
  { value: 'مشروبات', label: 'مشروبات' },
  { value: 'مشروبات وماكولات', label: 'مشروبات ومأكولات (الاتنين معاً)' },
] as const;

export type KioskOfferingType = 'food' | 'drinks' | 'both';

export function getKioskOfferingType(category?: string | null): KioskOfferingType {
  const cat = (category || '').trim().toLowerCase();

  const hasDrinks = cat.includes('مشروب') || cat.includes('عصير') || cat.includes('قهوة');
  const hasFood =
    cat.includes('ماكول') ||
    cat.includes('مأكول') ||
    cat.includes('فطار') ||
    cat.includes('غداء') ||
    cat.includes('غدا') ||
    cat.includes('ساندوتش') ||
    cat.includes('اكل') ||
    cat.includes('أكل');

  if (hasDrinks && hasFood) {
    return 'both';
  }
  if (hasDrinks) {
    return 'drinks';
  }
  if (hasFood) {
    return 'food';
  }

  if (cat === 'مشروبات') return 'drinks';
  if (cat === 'ماكولات' || cat === 'مأكولات') return 'food';

  return 'both';
}

export const ORDER_STATUS_DETAILS: Record<
  OrderStatus,
  { label: string; description: string; badgeColor: string; textColor: string; stepIndex: number }
> = {
  PENDING_KIOSK: {
    label: "في انتظار موافقة الكشك",
    description: "الكاشير بيراجع أوردرك وهيقبله في لحظات",
    badgeColor: "bg-primary-soft",
    textColor: "text-primary-ink",
    stepIndex: 1,
  },
  ACCEPTED: {
    label: "تم قبول الأوردر وجاري التجهيز",
    description: "الكشك قبل أوردرك وبدأ في تجهيزه فوراً",
    badgeColor: "bg-primary-soft",
    textColor: "text-primary-ink",
    stepIndex: 2,
  },
  PREPARING: {
    label: "جاري التجهيز",
    description: "طلبك بيتحضر دلوقتي، خليك متابع وقت التجهيز",
    badgeColor: "bg-primary-soft",
    textColor: "text-primary-ink",
    stepIndex: 2,
  },
  READY: {
    label: "جاهز للاستلام",
    description: "أوردرك جاهز! اتفضل عند الكشك واستلم وادفع كاش أو محفظة",
    badgeColor: "bg-accent",
    textColor: "text-white",
    stepIndex: 3,
  },
  COMPLETED: {
    label: "تم الاستلام بنجاح",
    description: "بالهنا والشفا! تم تسليم الأوردر وتأكيد الدفع",
    badgeColor: "bg-accent-soft",
    textColor: "text-accent",
    stepIndex: 4,
  },
  REJECTED: {
    label: "تم رفض الأوردر",
    description: "نعتذر، لم يتمكن الكشك من قبول الأوردر حالياً",
    badgeColor: "bg-danger-soft",
    textColor: "text-danger",
    stepIndex: 0,
  },
  CANCELLED: {
    label: "تم إلغاء الأوردر",
    description: "تم إلغاء الطلب بناءً على رغبتك أو من الكشك",
    badgeColor: "bg-canvas border border-line",
    textColor: "text-ink-soft",
    stepIndex: 0,
  },
  NO_SHOW: {
    label: "لم يحضر الطالب",
    description: "تم تجهيز الأوردر ولكن لم يتم الاستلام",
    badgeColor: "bg-danger-soft",
    textColor: "text-danger",
    stepIndex: 0,
  },
  EXPIRED: {
    label: "منتهي الصلاحية",
    description: "لم يستجب الكشك خلال المهلة المحددة",
    badgeColor: "bg-canvas",
    textColor: "text-ink-soft",
    stepIndex: 0,
  },
};

export const ACCOUNT_STATUS_DETAILS: Record<
  AccountStatus,
  { label: string; badgeClass: string }
> = {
  active: {
    label: "حالتك تمام",
    badgeClass: "bg-accent-soft text-accent",
  },
  warning: {
    label: "تحذير عدم استلام أوردر سابق",
    badgeClass: "bg-primary-soft text-primary-ink",
  },
  restricted: {
    label: "حسابك مقيد مؤقتاً بسبب عدم الحضور",
    badgeClass: "bg-danger-soft text-danger",
  },
};

import { useServiceFeeStore } from '@/stores/useServiceFeeStore';

/**
 * رسوم خدمة الطلب المتدرجة بالقروش (piasters)
 *   تُحسب ديناميكياً من إعدادات المنصة (useServiceFeeStore) مع مراعاة:
 *   - شرائح قيمة الأوردر
 *   - طريقة الدفع (كاش أم أونلاين)
 *   - أيام الطلب المجاني
 *   - إعفاء أول أوردر
 *   - العروض والخصومات المئوية
 */
export function getServiceFeePiasters(
  subtotalPiasters: number,
  paymentMethod: 'cash' | 'digital_wallet' = 'cash',
  isFirstOrder = false
): number {
  if (typeof window !== 'undefined') {
    try {
      const store = useServiceFeeStore.getState();
      if (!store.lastFetchedAt && !store.isLoading) {
        store.fetchConfig().catch(() => {});
      }
      const calc = store.calculateServiceFee({
        subtotalEGP: subtotalPiasters / 100,
        paymentMethod,
        isFirstOrder,
      });
      return calc.feePiasters;
    } catch (e) {
      // Fallback to static rule
    }
  }
  const isOnline = paymentMethod === 'digital_wallet';
  if (subtotalPiasters < 10000) return isOnline ? 200 : 300;
  if (subtotalPiasters <= 20000) return isOnline ? 400 : 500;
  return isOnline ? 800 : 1000;
}

/** Helper: returns fee in EGP for a subtotal in EGP with payment method awareness */
export function getServiceFeeEGP(
  subtotalEGP: number,
  paymentMethod: 'cash' | 'digital_wallet' = 'cash',
  isFirstOrder = false
): number {
  return getServiceFeePiasters(subtotalEGP * 100, paymentMethod, isFirstOrder) / 100;
}

/** Default minimum fee displayed to the user before order is finalized */
export const SERVICE_FEE_EGP = 3;
export const SERVICE_FEE_PIASTERS = 300;


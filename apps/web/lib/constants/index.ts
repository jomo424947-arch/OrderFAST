import { OrderStatus, AccountStatus } from "@/types";

export const APP_NAME = "FastOrder";
export const APP_TAGLINE = "ORDER • WAIT • ENJOY";
export const APP_TAGLINE_AR = "اطلب • استنى • استمتع";

export const COLLEGES = [
  "كلية طب الفم والأسنان",
  "كلية الصيدلة",
  "كلية الطب البيطري",
  "كلية العلاج الطبيعي",
  "كلية الهندسة",
  "كلية الحاسبات والذكاء الاصطناعي",
  "كلية تكنولوجيا العلوم الصحية",
  "كلية التمريض",

];

export const CATEGORIES = [
  { id: "all", label: "الكل" },
  { id: "my_college", label: "كليتي" },
  { id: "drinks", label: "مشروبات" },
  { id: "sandwiches", label: "ساندوتشات" },
  { id: "sweets", label: "حلويات وسناكس" },
  { id: "meals", label: "وجبات سريعة" },
];

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

/**
 * رسوم خدمة الطلب المتدرجة بالقروش (piasters)
 *   أقل من 100 ج.م → 3 ج.م (300 قرش)
 *   من 100 إلى 200 ج.م → 5 ج.م (500 قرش)
 *   أعلى من 200 ج.م → 10 ج.م (1000 قرش)
 */
export function getServiceFeePiasters(subtotalPiasters: number): number {
  if (subtotalPiasters < 10000) return 300;
  if (subtotalPiasters <= 20000) return 500;
  return 1000;
}

/** Helper: returns fee in EGP for a subtotal in EGP */
export function getServiceFeeEGP(subtotalEGP: number): number {
  return getServiceFeePiasters(subtotalEGP * 100) / 100;
}

/** Minimum fee displayed to the user before order is finalized */
export const SERVICE_FEE_EGP = 3;
export const SERVICE_FEE_PIASTERS = 300;


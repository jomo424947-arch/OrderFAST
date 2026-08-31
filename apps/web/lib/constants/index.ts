import { OrderStatus, AccountStatus } from "@/types";

export const APP_NAME = "OrderFAST";
export const APP_TAGLINE = "ORDER • WAIT • ENJOY";
export const APP_TAGLINE_AR = "اطلب • استنى • استمتع";

export const COLLEGES = [
  "كلية الهندسة",
  "كلية الحاسبات والمعلومات",
  "كلية التجارة وإدارة الأعمال",
  "كلية الصيدلة",
  "كلية طب الفم والأسنان",
  "كلية الفنون التطبيقية",
  "كلية الألسن واللغات",
  "كل الكليات (الحرم المركزي)"
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
  placed: {
    label: "تم إرسال الأوردر",
    description: "في انتظار إرسال الأوردر للكشك",
    badgeColor: "bg-primary-soft",
    textColor: "text-primary-ink",
    stepIndex: 1,
  },
  pending_review: {
    label: "في انتظار موافقة الكشك",
    description: "الكاشير بيراجع أوردرك وهيقبله في لحظات",
    badgeColor: "bg-primary-soft",
    textColor: "text-primary-ink",
    stepIndex: 2,
  },
  accepted: {
    label: "تم قبول الأوردر",
    description: "الكشك قبل الأوردر ومستعد لبدء التجهيز",
    badgeColor: "bg-accent-soft",
    textColor: "text-accent",
    stepIndex: 3,
  },
  preparing: {
    label: "جاري التجهيز",
    description: "طلبك بيتحضر دلوقتي، خليك متابع وقت التجهيز",
    badgeColor: "bg-primary-soft",
    textColor: "text-primary-ink",
    stepIndex: 4,
  },
  ready_for_pickup: {
    label: "جاهز للاستلام",
    description: "أوردرك جاهز! اتفضل عند الكشك واستلم وادفع كاش أو محفظة",
    badgeColor: "bg-accent",
    textColor: "text-white",
    stepIndex: 5,
  },
  picked_up: {
    label: "تم الاستلام بنجاح",
    description: "بالهنا والشفا! تم تسليم الأوردر وتأكيد الدفع",
    badgeColor: "bg-accent-soft",
    textColor: "text-accent",
    stepIndex: 6,
  },
  rejected: {
    label: "تم رفض الأوردر",
    description: "نعتذر، لم يتمكن الكشك من قبول الأوردر حالياً",
    badgeColor: "bg-danger-soft",
    textColor: "text-danger",
    stepIndex: 0,
  },
  no_show: {
    label: "لم يحضر الطالب",
    description: "تم تجهيز الأوردر ولكن لم يتم الاستلام",
    badgeColor: "bg-danger-soft",
    textColor: "text-danger",
    stepIndex: 0,
  },
  expired: {
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

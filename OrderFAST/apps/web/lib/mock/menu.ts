import { MenuCategory, MenuItem } from "@/types";

export const MOCK_CATEGORIES: MenuCategory[] = [
  { id: "cat-hot-drinks", kioskId: "kiosk-01", name: "مشروبات ساخنة", displayOrder: 1 },
  { id: "cat-cold-drinks", kioskId: "kiosk-01", name: "مشروبات باردة", displayOrder: 2 },
  { id: "cat-sandwiches", kioskId: "kiosk-01", name: "ساندوتشات", displayOrder: 3 },
  { id: "cat-snacks", kioskId: "kiosk-01", name: "سناكس وحلويات", displayOrder: 4 },
];

export const MOCK_MENU_ITEMS: MenuItem[] = [
  // مشروبات ساخنة
  {
    id: "item-01",
    kioskId: "kiosk-01",
    categoryId: "cat-hot-drinks",
    name: "شاي بالنعناع",
    description: "شاي أسود مع أوراق النعناع الطازج",
    price: 8,
    isAvailable: true,
    isUnderReview: true,
    preparationTimeMins: 3,
  },
  {
    id: "item-02",
    kioskId: "kiosk-01",
    categoryId: "cat-hot-drinks",
    name: "قهوة تركي",
    description: "بن برازيلي محوج بالهيل (سادة / مظبوط / زيادة)",
    price: 12,
    isAvailable: true,
    isUnderReview: true,
    preparationTimeMins: 5,
  },
  {
    id: "item-03",
    kioskId: "kiosk-01",
    categoryId: "cat-hot-drinks",
    name: "نسكافيه بحليب",
    description: "مشروب نسكافيه كلاسيك مع حليب ساخن",
    price: 15,
    isAvailable: true,
    isUnderReview: false,
    preparationTimeMins: 4,
  },

  // مشروبات باردة
  {
    id: "item-04",
    kioskId: "kiosk-01",
    categoryId: "cat-cold-drinks",
    name: "عصير مانجا",
    description: "عصير مانجا فريش طبيعي مثلج",
    price: 15,
    isAvailable: true,
    isUnderReview: false,
    preparationTimeMins: 4,
  },
  {
    id: "item-05",
    kioskId: "kiosk-01",
    categoryId: "cat-cold-drinks",
    name: "ليمون بالنعناع",
    description: "عصير ليمون منعش مع أوراق النعناع الطازج",
    price: 14,
    isAvailable: false, // "غير متاح دلوقتي"
    isUnderReview: false,
    preparationTimeMins: 4,
  },
  {
    id: "item-06",
    kioskId: "kiosk-01",
    categoryId: "cat-cold-drinks",
    name: "مياه معدنية صغيرة",
    description: "زجاجة مياه معدنية نقية 600 مل",
    price: 6,
    isAvailable: true,
    isUnderReview: false,
    preparationTimeMins: 1,
  },

  // ساندوتشات
  {
    id: "item-07",
    kioskId: "kiosk-01",
    categoryId: "cat-sandwiches",
    name: "سندوتش جبنة رومي",
    description: "عيش فينو طازج مع جبنة رومي قديمة وطماطم وخيار",
    price: 20,
    isAvailable: true,
    isUnderReview: false,
    preparationTimeMins: 4,
  },
  {
    id: "item-08",
    kioskId: "kiosk-01",
    categoryId: "cat-sandwiches",
    name: "سندوتش تونة",
    description: "تونة قطع مع صوص مايونيز خفيف وذرة وفلفل ألوان",
    price: 25,
    isAvailable: true,
    isUnderReview: false,
    preparationTimeMins: 6,
  },
  {
    id: "item-09",
    kioskId: "kiosk-01",
    categoryId: "cat-sandwiches",
    name: "سندوتش بطاطس فارم فريتس",
    description: "بطاطس مقرمشة متبلة في فينو مع كاتشب ومايونيز",
    price: 18,
    isAvailable: true,
    isUnderReview: false,
    preparationTimeMins: 7,
  },

  // سناكس وحلويات
  {
    id: "item-10",
    kioskId: "kiosk-01",
    categoryId: "cat-snacks",
    name: "كوكيز شوكولاتة",
    description: "قطعة كوكيز طرية بحبيبات الشوكولاتة اللذيذة",
    price: 10,
    isAvailable: true,
    isUnderReview: false,
    preparationTimeMins: 1,
  },
];

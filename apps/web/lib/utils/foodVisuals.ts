import {
  Coffee,
  CupSoda,
  UtensilsCrossed,
  Cookie,
  Sandwich,
  LucideIcon,
} from 'lucide-react';
import { MenuItem } from '@/types';

export interface FoodTheme {
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
  borderColor: string;
  categoryLabel?: string;
}

/**
 * Returns visual styling and clean SVG icon based on item name and category.
 * Strictly without emojis for a clean, premium, modern look.
 */
export function getFoodTheme(item: MenuItem): FoodTheme {
  const name = (item.name || '').toLowerCase();
  const cat = (item.categoryId || '').toLowerCase();

  // Hot drinks
  if (
    cat.includes('hot') ||
    name.includes('شاي') ||
    name.includes('قهوة') ||
    name.includes('نسكافيه') ||
    name.includes('كابتشينو') ||
    name.includes('لاتيه') ||
    name.includes('اسبريسو')
  ) {
    return {
      icon: Coffee,
      bgColor: 'bg-amber-100/90 dark:bg-amber-950/40',
      iconColor: 'text-amber-800 dark:text-amber-300',
      borderColor: 'border-amber-300/80 dark:border-amber-700/50',
      categoryLabel: 'مشروب ساخن',
    };
  }

  // Cold drinks
  if (
    cat.includes('cold') ||
    cat.includes('drink') ||
    name.includes('عصير') ||
    name.includes('كانز') ||
    name.includes('بيبسي') ||
    name.includes('كولا') ||
    name.includes('مياه') ||
    name.includes('سموزي') ||
    name.includes('موهيتو') ||
    name.includes('ثلج')
  ) {
    return {
      icon: CupSoda,
      bgColor: 'bg-sky-100/90 dark:bg-sky-950/40',
      iconColor: 'text-sky-800 dark:text-sky-300',
      borderColor: 'border-sky-300/80 dark:border-sky-700/50',
      categoryLabel: 'مشروب بارد',
    };
  }

  // Sandwiches / Burgers / Savory
  if (
    cat.includes('sandwich') ||
    name.includes('ساندوتش') ||
    name.includes('سندوتش') ||
    name.includes('بطاطس') ||
    name.includes('خلطة') ||
    name.includes('برجر') ||
    name.includes('شاورما') ||
    name.includes('جبنة') ||
    name.includes('رومي') ||
    name.includes('تونة') ||
    name.includes('بانيه') ||
    name.includes('كفتة') ||
    name.includes('فراخ') ||
    name.includes('دجاج') ||
    name.includes('لحم')
  ) {
    return {
      icon: Sandwich,
      bgColor: 'bg-orange-100/90 dark:bg-orange-950/40',
      iconColor: 'text-orange-800 dark:text-orange-300',
      borderColor: 'border-orange-300/80 dark:border-orange-700/50',
      categoryLabel: 'ساندوتش',
    };
  }

  // Snacks / Sweets / Desserts
  if (
    cat.includes('snack') ||
    cat.includes('sweet') ||
    name.includes('شيبسي') ||
    name.includes('بسكويت') ||
    name.includes('شوكولاتة') ||
    name.includes('دونات') ||
    name.includes('كيك') ||
    name.includes('كرواسون') ||
    name.includes('باتيه')
  ) {
    return {
      icon: Cookie,
      bgColor: 'bg-rose-100/90 dark:bg-rose-950/40',
      iconColor: 'text-rose-800 dark:text-rose-300',
      borderColor: 'border-rose-300/80 dark:border-rose-700/50',
      categoryLabel: 'سناكس',
    };
  }

  // Default food
  return {
    icon: UtensilsCrossed,
    bgColor: 'bg-primary-soft/90',
    iconColor: 'text-primary-ink',
    borderColor: 'border-primary/30',
    categoryLabel: 'صنف رئيسي',
  };
}

/**
 * Returns a fallback appetizing description if none exists in database.
 */
export function getAppetizingDescription(item: MenuItem): string {
  if (item.description && item.description.trim().length > 0) {
    return item.description;
  }

  const name = (item.name || '').toLowerCase();

  if (name.includes('بطاطس سوري')) {
    return 'أصابع بطاطس مقلية ذهبية ومقرمشة مع صوص الثومية والمخلل بخبز سوري طازج';
  }
  if (name.includes('بطاطس')) {
    return 'بطاطس مقلية ذهبية مقرمشة محضرة طازجة ومتبلة ببهارات شهية';
  }
  if (name.includes('خلطة فرنساوي')) {
    return 'خلطة شهية مميزة منتقاة بعناية في خبز فينو طازج مع بهارات خاصة';
  }
  if (name.includes('كانز')) {
    return 'مشروب غازي منعش يقدم بارداً ومثلجاً';
  }
  if (name.includes('شاي بالنعناع')) {
    return 'شاي أسود منقى ممزوج بأوراق النعناع الطازج العطري';
  }
  if (name.includes('قهوة تركي')) {
    return 'بن محوج عالي الجودة محضر على الطريقة التقليدية بوجه متماسك';
  }
  if (name.includes('نسكافيه')) {
    return 'مزيج قهوة غني مع حليب دافئ وقوام كريمي متوازن';
  }
  if (name.includes('عصير مانجا')) {
    return 'عصير طبيعي مثلج بقوام غني ومنعش';
  }
  if (name.includes('سندوتش جبنة') || name.includes('ساندوتش جبنة')) {
    return 'جبنة مختارة مع شرائح خضار طازجة في خبز مخبوز يومياً';
  }
  if (name.includes('تونة')) {
    return 'تونة ناعمة عالية الجودة مع صوص خفيف وشرائح خضار مقرمشة';
  }

  return 'محضر طازج يومياً بأجود المكونات وبطعم استثنائي';
}

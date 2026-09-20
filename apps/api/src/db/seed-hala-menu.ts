import { db } from './client.js';
import { kiosks, menuCategories, menuItems } from './schema.js';
import { generateId } from '../shared/id/index.js';
import { eq, and, sql } from 'drizzle-orm';

const KIOSK_ID = '01a05e06-7e2d-7d7f-b9ed-6b7bca859b8f';

interface MenuItemDef {
  name: string;
  price: number; // in EGP
  prepTime?: number;
  description?: string;
}

interface CategoryDef {
  name: string;
  aliases?: string[];
  displayOrder: number;
  items: MenuItemDef[];
}

const MENU_DATA: CategoryDef[] = [
  // ==========================================
  // 1. الفطار 🍳
  // ==========================================
  {
    name: 'الفطار',
    displayOrder: 1,
    items: [
      { name: 'فول بالطحينة (بلدي)', price: 10, prepTime: 3 },
      { name: 'فول بالطحينة (فينو)', price: 15, prepTime: 3 },
      { name: 'فول اسكندراني (بلدي)', price: 12, prepTime: 3 },
      { name: 'فول اسكندراني (فينو)', price: 15, prepTime: 3 },
      { name: 'بابا غنوج (بلدي)', price: 12, prepTime: 3 },
      { name: 'بابا غنوج (فينو)', price: 15, prepTime: 3 },
      { name: 'بطاطس كاتشب ومايونيز (بلدي)', price: 15, prepTime: 4 },
      { name: 'بطاطس كاتشب ومايونيز (فينو)', price: 15, prepTime: 4 },
      { name: 'لانشون (بلدي)', price: 20, prepTime: 3 },
      { name: 'لانشون (فينو)', price: 20, prepTime: 3 },
      { name: 'جبنة رومي (بلدي)', price: 20, prepTime: 3 },
      { name: 'جبنة رومي (فينو)', price: 20, prepTime: 3 },
      { name: 'حلاوة طحينية (بلدي)', price: 15, prepTime: 3 },
      { name: 'حلاوة طحينية (فينو)', price: 15, prepTime: 3 },
      { name: 'مربى (بلدي)', price: 15, prepTime: 3 },
      { name: 'مربى (فينو)', price: 15, prepTime: 3 },
      { name: 'أومليت (بلدي)', price: 15, prepTime: 4 },
      { name: 'أومليت (فينو)', price: 18, prepTime: 4 },
      { name: 'بطاطس بابا غنوج (بلدي)', price: 20, prepTime: 4 },
      { name: 'بطاطس بابا غنوج (فينو)', price: 20, prepTime: 4 },
      { name: 'أومليت خضار (بلدي)', price: 20, prepTime: 5 },
      { name: 'أومليت خضار (فينو)', price: 20, prepTime: 5 },
      { name: 'أومليت إضافات (بسطرمة / سوسيس / رومي / موتزاريلا) (بلدي)', price: 25, prepTime: 5 },
      { name: 'أومليت إضافات (بسطرمة / سوسيس / رومي / موتزاريلا) (فينو)', price: 25, prepTime: 5 },
      { name: 'لانشون رومي (بلدي)', price: 30, prepTime: 4 },
      { name: 'لانشون رومي (فينو)', price: 30, prepTime: 4 },
      { name: 'جبنة مقلية (بلدي)', price: 25, prepTime: 5 },
      { name: 'جبنة مقلية (فينو)', price: 25, prepTime: 5 },
      { name: 'باكيت بطاطس (صغير)', price: 20, prepTime: 4 },
      { name: 'باكيت بطاطس (كبير)', price: 30, prepTime: 5 },
    ],
  },

  // ==========================================
  // 2. ساندوتشات 🥪
  // ==========================================
  {
    name: 'ساندوتشات',
    aliases: ['سوري', 'ساندوتشات وسناكس'],
    displayOrder: 2,
    items: [
      { name: 'ساندوتش بطاطس تومية أو كاتشب مايونيز (سوري)', price: 30, prepTime: 5 },
      { name: 'ساندوتش بطاطس رومي أو موتزاريلا (سوري)', price: 40, prepTime: 5 },
      { name: 'ساندوتش بطاطس مكس جبن (سوري)', price: 45, prepTime: 5 },
      { name: 'ساندوتش بطاطس بيض (سوري)', price: 55, prepTime: 6 },
      { name: 'ساندوتش سجق (سوري)', price: 60, prepTime: 7 },
      { name: 'ساندوتش سجق (فينو)', price: 60, prepTime: 7 },
      { name: 'ساندوتش هوت دوج (سوري)', price: 60, prepTime: 7 },
      { name: 'ساندوتش هوت دوج (فينو)', price: 60, prepTime: 7 },
      { name: 'ساندوتش كريسبي (سوري)', price: 80, prepTime: 8 },
      { name: 'ساندوتش كريسبي (فينو)', price: 80, prepTime: 8 },
      { name: 'ساندوتش شيش (سوري)', price: 75, prepTime: 8 },
      { name: 'ساندوتش شيش (فينو)', price: 75, prepTime: 8 },
      { name: 'ساندوتش فاهيتا فراخ (سوري)', price: 80, prepTime: 8 },
      { name: 'ساندوتش فاهيتا فراخ (فينو)', price: 80, prepTime: 8 },
      { name: 'ساندوتش شاورما فراخ (سوري)', price: 75, prepTime: 7 },
      { name: 'ساندوتش شاورما فراخ (فينو)', price: 75, prepTime: 7 },
      { name: 'ساندوتش كفتة (سوري)', price: 75, prepTime: 8 },
      { name: 'ساندوتش كفتة (فينو)', price: 75, prepTime: 8 },
      { name: 'ساندوتش مكس فراخ (سوري)', price: 90, prepTime: 9 },
    ],
  },

  // ==========================================
  // 3. برجر وحواوشي 🍔
  // ==========================================
  {
    name: 'برجر وحواوشي',
    aliases: ['برجر'],
    displayOrder: 3,
    items: [
      { name: 'برجر كلاسيك (فراخ أو لحمة)', price: 70, prepTime: 10 },
      { name: 'برجر تشيز', price: 80, prepTime: 10 },
      { name: 'برجر باربيكيو / رانش', price: 80, prepTime: 10 },
      { name: 'برجر رانش كرانش', price: 75, prepTime: 10 },
      { name: 'برجر تشيلي بيف', price: 75, prepTime: 10 },
      { name: 'وجبة كومبو برجر (برجر + بطاطس + كانز)', price: 100, prepTime: 12 },
      { name: 'حواوشي لحمة بلدي ساده', price: 50, prepTime: 10 },
      { name: 'حواوشي لحمة بلدي بالجبنة', price: 60, prepTime: 10 },
    ],
  },

  // ==========================================
  // 4. الكريب 🌯
  // ==========================================
  {
    name: 'الكريب',
    displayOrder: 4,
    items: [
      { name: 'كريب بوم فريت (بطاطس)', price: 60, prepTime: 8 },
      { name: 'كريب هوت دوج / سجق', price: 70, prepTime: 9 },
      { name: 'كريب شاورما فراخ', price: 80, prepTime: 10 },
      { name: 'كريب فراخ كرسبي', price: 85, prepTime: 10 },
      { name: 'كريب شيش / كفتة', price: 80, prepTime: 10 },
      { name: 'كريب فاهيتا فراخ', price: 85, prepTime: 10 },
      { name: 'كريب مكس فراخ (شاورما + كرسبي + بطاطس)', price: 100, prepTime: 12 },
      { name: 'كريب هلا المخصوص', price: 100, prepTime: 12 },
    ],
  },

  // ==========================================
  // 5. البيتزا 🍕
  // ==========================================
  {
    name: 'البيتزا',
    displayOrder: 5,
    items: [
      { name: 'بيتزا مارجريتا (وسط)', price: 70, prepTime: 12 },
      { name: 'بيتزا مارجريتا (لارج)', price: 110, prepTime: 15 },
      { name: 'بيتزا فيجيتيريا (خضار) (وسط)', price: 75, prepTime: 12 },
      { name: 'بيتزا فيجيتيريا (خضار) (لارج)', price: 115, prepTime: 15 },
      { name: 'بيتزا سجق / سوسيس (وسط)', price: 100, prepTime: 12 },
      { name: 'بيتزا سجق / سوسيس (لارج)', price: 125, prepTime: 15 },
      { name: 'بيتزا كواترو فورماجيو (وسط)', price: 100, prepTime: 12 },
      { name: 'بيتزا كواترو فورماجيو (لارج)', price: 130, prepTime: 15 },
      { name: 'بيتزا شاورما فراخ (وسط)', price: 110, prepTime: 14 },
      { name: 'بيتزا شاورما فراخ (لارج)', price: 140, prepTime: 15 },
      { name: 'بيتزا تشكن رانش / باربيكيو (وسط)', price: 120, prepTime: 14 },
      { name: 'بيتزا تشكن رانش / باربيكيو (لارج)', price: 150, prepTime: 15 },
      { name: 'بيتزا لحمة (وسط)', price: 100, prepTime: 14 },
      { name: 'بيتزا لحمة (لارج)', price: 140, prepTime: 15 },
      { name: 'بيتزا بسطرمة (وسط)', price: 110, prepTime: 14 },
      { name: 'بيتزا بسطرمة (لارج)', price: 140, prepTime: 15 },
      { name: 'بيتزا تونة (وسط)', price: 110, prepTime: 14 },
      { name: 'بيتزا تونة (لارج)', price: 140, prepTime: 15 },
      { name: 'بيتزا بيبروني (وسط)', price: 110, prepTime: 14 },
      { name: 'بيتزا بيبروني (لارج)', price: 140, prepTime: 15 },
      { name: 'بيتزا سوبر سوبريم (وسط)', price: 125, prepTime: 15 },
      { name: 'بيتزا سوبر سوبريم (لارج)', price: 150, prepTime: 17 },
      { name: 'بيتزا مكس فراخ (وسط)', price: 130, prepTime: 15 },
      { name: 'بيتزا مكس فراخ (لارج)', price: 160, prepTime: 17 },
      { name: 'بيتزا هلا المخصوصة (وسط)', price: 130, prepTime: 15 },
      { name: 'بيتزا هلا المخصوصة (لارج)', price: 160, prepTime: 17 },
    ],
  },

  // ==========================================
  // 6. مكرونات 🍝
  // ==========================================
  {
    name: 'مكرونات',
    displayOrder: 6,
    items: [
      { name: 'مكرونة صلصة', price: 35, prepTime: 8 },
      { name: 'مكرونة خضار', price: 45, prepTime: 9 },
      { name: 'مكرونة سوسيس', price: 65, prepTime: 10 },
      { name: 'مكرونة سجق', price: 65, prepTime: 10 },
      { name: 'مكرونة بولونيز', price: 65, prepTime: 10 },
      { name: 'مكرونة نجرسكو', price: 80, prepTime: 12 },
      { name: 'مكرونة كرسبي', price: 85, prepTime: 12 },
      { name: 'مكرونة بشاميل', price: 80, prepTime: 12 },
      { name: 'أكلة هلا المفضلة', price: 100, prepTime: 15, description: 'وجبة هلا الخاصة والشهية' },
    ],
  },

  // ==========================================
  // 7. المشروبات الدافئة ☕
  // ==========================================
  {
    name: 'المشروبات الدافئة',
    aliases: ['المشروبات الساخنة'],
    displayOrder: 7,
    items: [
      { name: 'شاي', price: 10, prepTime: 3 },
      { name: 'كركدية', price: 10, prepTime: 3 },
      { name: 'جنزبيل - ينسون', price: 10, prepTime: 3 },
      { name: 'شاي نعناع', price: 12, prepTime: 3 },
      { name: 'شاي حليب', price: 25, prepTime: 4 },
      { name: 'سحلب مكسرات', price: 25, prepTime: 5 },
      { name: 'مكس أعشاب', price: 25, prepTime: 3 },
      { name: 'ابل سيدر', price: 25, prepTime: 4 },
      { name: 'قهوة تركي', price: 20, prepTime: 4 },
      { name: 'قهوة دوبل', price: 25, prepTime: 4 },
      { name: 'نسكافيه بلاك', price: 25, prepTime: 3 },
      { name: 'قهوة فرنساوي', price: 30, prepTime: 5 },
      { name: 'قهوة بندق', price: 35, prepTime: 5 },
      { name: 'قهوة شيكولاتة', price: 35, prepTime: 5 },
      { name: 'نسكافيه حليب', price: 35, prepTime: 4 },
      { name: 'هوت شيكولت', price: 35, prepTime: 5 },
    ],
  },

  // ==========================================
  // 8. إسبريسو ☕
  // ==========================================
  {
    name: 'اسبريسو',
    displayOrder: 8,
    items: [
      { name: 'اسبريسو سنجل', price: 30, prepTime: 3 },
      { name: 'اسبريسو دوبل', price: 35, prepTime: 3 },
      { name: 'اسبريسو ماكياتو', price: 35, prepTime: 4 },
      { name: 'اسبريسو ماكياتو دوبل', price: 40, prepTime: 4 },
      { name: 'اسبريسو أمريكي', price: 40, prepTime: 4 },
      { name: 'كوفي لاتيه', price: 40, prepTime: 4 },
      { name: 'اسبريسو أمريكي حليب', price: 45, prepTime: 5 },
      { name: 'كابتشينو', price: 45, prepTime: 5 },
      { name: 'كوفي لاتيه فليفر', price: 45, prepTime: 5 },
      { name: 'كابتشينو فليفر', price: 50, prepTime: 5 },
    ],
  },

  // ==========================================
  // 9. أيس كوفي 🧊
  // ==========================================
  {
    name: 'أيس كوفي',
    aliases: ['لاتيه فرابيه'],
    displayOrder: 9,
    items: [
      { name: 'أيس اسبريسو', price: 40, prepTime: 4 },
      { name: 'أيس كوفي أفوكادو', price: 45, prepTime: 5 },
      { name: 'أيس كوفي كلاسيك', price: 50, prepTime: 5 },
      { name: 'أيس كوفي موكا', price: 55, prepTime: 5 },
      { name: 'أيس كوفي كراميل', price: 55, prepTime: 5 },
      { name: 'أيس كوفي لوتس', price: 65, prepTime: 6 },
      { name: 'أيس كوفي نوتيلا', price: 65, prepTime: 6 },
    ],
  },

  // ==========================================
  // 10. مشروبات باردة وعصائر 🥤
  // ==========================================
  {
    name: 'مشروبات باردة',
    displayOrder: 10,
    items: [
      { name: 'عصير جوافة فريش', price: 25, prepTime: 4 },
      { name: 'سموزي جوافة', price: 30, prepTime: 4 },
      { name: 'عصير موز فريش', price: 25, prepTime: 4 },
      { name: 'سموزي موز', price: 30, prepTime: 4 },
      { name: 'عصير ليمون', price: 25, prepTime: 3 },
      { name: 'عصير برتقال فريش', price: 25, prepTime: 4 },
      { name: 'عصير بطيخ', price: 25, prepTime: 4 },
      { name: 'سموزي بطيخ', price: 30, prepTime: 4 },
      { name: 'عصير جوافة بالحليب', price: 30, prepTime: 4 },
      { name: 'سموزي جوافة بالحليب', price: 35, prepTime: 4 },
      { name: 'عصير موز بالحليب', price: 30, prepTime: 4 },
      { name: 'سموزي موز بالحليب', price: 35, prepTime: 4 },
      { name: 'عصير ليمون نعناع', price: 30, prepTime: 4 },
      { name: 'سموزي ليمون نعناع', price: 35, prepTime: 4 },
      { name: 'عصير مانجو طبيعي', price: 35, prepTime: 4 },
      { name: 'سموزي مانجو', price: 40, prepTime: 4 },
      { name: 'عصير فراولة طبيعي', price: 35, prepTime: 4 },
      { name: 'سموزي فراولة', price: 40, prepTime: 4 },
      { name: 'سموزي مكس بري', price: 40, prepTime: 5 },
    ],
  },

  // ==========================================
  // 11. ميلك شيك 🍨
  // ==========================================
  {
    name: 'ميلك شيك',
    displayOrder: 11,
    items: [
      { name: 'ميلك شيك (شيكولاتة / فانيليا / فراولة / مانجو / كيك)', price: 40, prepTime: 5 },
      { name: 'ميلك شيك (بلو بيري / موز)', price: 45, prepTime: 5 },
      { name: 'ميلك شيك أوريو', price: 45, prepTime: 5 },
    ],
  },

  // ==========================================
  // 12. صودا وموهيتو 🍹
  // ==========================================
  {
    name: 'صودا',
    displayOrder: 12,
    items: [
      { name: 'موهيتو / صودا (صن شاين / صن رايز / بلو كرواسون / موخيتو)', price: 40, prepTime: 4 },
    ],
  },

  // ==========================================
  // 13. أيس كريم 🍦
  // ==========================================
  {
    name: 'أيس كريم',
    displayOrder: 13,
    items: [
      { name: 'بولة أيس كريم', price: 15, prepTime: 2 },
      { name: 'مكس أيس كريم', price: 40, prepTime: 3 },
    ],
  },

  // ==========================================
  // 14. الاضافات ✨
  // ==========================================
  {
    name: 'الاضافات',
    displayOrder: 14,
    items: [
      { name: 'إضافة جبنة موتزاريلا', price: 10, prepTime: 1 },
      { name: 'إضافة بطاطس', price: 10, prepTime: 2 },
      { name: 'إضافة صوص رانش', price: 15, prepTime: 1 },
      { name: 'إضافة صوص باربيكيو', price: 10, prepTime: 1 },
      { name: 'إضافة صوص سبايسي', price: 5, prepTime: 1 },
    ],
  },
];

async function seedHalaMenu() {
  console.log('🚀 Starting update for مطعم هلا (ID: ' + KIOSK_ID + ')...');

  // 1. Update Kiosk info
  await db
    .update(kiosks)
    .set({
      phone: '01001401169',
      campusZone: 'أسيوط الجديدة - القرية الذكية',
      category: 'وجبات سريعة ومشروبات',
      defaultPrepTimeMins: 12,
      updatedAt: new Date(),
    })
    .where(eq(kiosks.id, KIOSK_ID));
  console.log('✅ Updated Kiosk general info (phone, campusZone, category).');

  // 2. Fetch existing categories
  const existingCategories = await db
    .select()
    .from(menuCategories)
    .where(eq(menuCategories.kioskId, KIOSK_ID));

  // 3. Fetch all existing items for this kiosk
  const existingItems = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.kioskId, KIOSK_ID));

  const handledItemIds = new Set<string>();

  for (const catDef of MENU_DATA) {
    // Find category by name or aliases
    let catRecord = existingCategories.find((c) => c.name === catDef.name);
    if (!catRecord && catDef.aliases) {
      catRecord = existingCategories.find((c) => catDef.aliases!.includes(c.name));
    }

    let catId: string;
    if (catRecord) {
      catId = catRecord.id;
      await db
        .update(menuCategories)
        .set({
          name: catDef.name,
          displayOrder: catDef.displayOrder,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(menuCategories.id, catId));
      console.log(`📁 Updated Category: [${catDef.name}]`);
    } else {
      catId = generateId();
      await db.insert(menuCategories).values({
        id: catId,
        kioskId: KIOSK_ID,
        name: catDef.name,
        displayOrder: catDef.displayOrder,
        isActive: true,
      });
      console.log(`✨ Created Category: [${catDef.name}]`);
    }

    // Process items in this category
    for (const itemDef of catDef.items) {
      const priceInPiasters = itemDef.price * 100;
      const prepTime = itemDef.prepTime || 8;

      function normalizeArabic(text: string): string {
        return text
          .replace(/[أإآ]/g, 'ا')
          .replace(/ة/g, 'ه')
          .replace(/ى/g, 'ي')
          .replace(/[^\w\s\u0600-\u06FF]/gi, '') // remove parens/symbols for normalized comparison
          .replace(/\s+/g, ' ')
          .trim();
      }

      const targetNorm = normalizeArabic(itemDef.name);

      // Look for exact match or normalized exact match among unhandled items
      const existingItem = existingItems.find((i) => {
        if (handledItemIds.has(i.id)) return false;
        if (i.name.trim() === itemDef.name.trim()) return true;
        return normalizeArabic(i.name) === targetNorm;
      });

      if (existingItem) {
        handledItemIds.add(existingItem.id);
        await db
          .update(menuItems)
          .set({
            categoryId: catId,
            name: itemDef.name,
            description: itemDef.description || existingItem.description || null,
            price: priceInPiasters,
            preparationTimeMins: prepTime,
            isAvailable: true,
            isUnderReview: false,
            isDeleted: false,
            updatedAt: new Date(),
          })
          .where(eq(menuItems.id, existingItem.id));
        console.log(`   🔄 Updated: ${itemDef.name} -> ${itemDef.price} EGP`);
      } else {
        const newItemId = generateId();
        handledItemIds.add(newItemId);
        await db.insert(menuItems).values({
          id: newItemId,
          kioskId: KIOSK_ID,
          categoryId: catId,
          name: itemDef.name,
          description: itemDef.description || null,
          price: priceInPiasters,
          preparationTimeMins: prepTime,
          isAvailable: true,
          isUnderReview: false,
          isDeleted: false,
        });
        console.log(`   ➕ Inserted: ${itemDef.name} -> ${itemDef.price} EGP`);
      }
    }
  }

  // Handle any remaining old items not present in the new flyer
  const obsoleteItems = existingItems.filter((i) => !handledItemIds.has(i.id) && !i.isDeleted);
  if (obsoleteItems.length > 0) {
    console.log(`🧹 Archiving ${obsoleteItems.length} old/obsolete items not in the new flyer...`);
    for (const item of obsoleteItems) {
      await db
        .update(menuItems)
        .set({
          isDeleted: true,
          isAvailable: false,
          updatedAt: new Date(),
        })
        .where(eq(menuItems.id, item.id));
      console.log(`   📦 Archived: ${item.name}`);
    }
  }

  console.log('\n🎉 ALL DONE! Menu of مطعم هلا updated successfully!');
  process.exit(0);
}

seedHalaMenu().catch((err) => {
  console.error('❌ Error updating Hala menu:', err);
  process.exit(1);
});

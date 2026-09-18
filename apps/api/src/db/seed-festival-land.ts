import { db } from './client.js';
import { kiosks, menuCategories, menuItems } from './schema.js';
import { generateId } from '../shared/id/index.js';
import { eq, and } from 'drizzle-orm';

const KIOSK_ID = '01a0abfc-44f3-745d-ac9d-ffe45d8e72a9';

interface SeedItem {
  name: string;
  description?: string;
  price: number; // in EGP
  prepTime?: number;
}

interface SeedCategory {
  name: string;
  displayOrder: number;
  items: SeedItem[];
}

const MENU_DATA: SeedCategory[] = [
  // 1. ساندوتشات وأطباق الإفطار
  {
    name: 'ساندوتشات وأطباق الإفطار',
    displayOrder: 1,
    items: [
      { name: 'ساندوتش طعمية', price: 15, prepTime: 3 },
      { name: 'ساندوتش بطاطس سادة', price: 15, prepTime: 3 },
      { name: 'ساندوتش بطاطس كاتشب ومايونيز', price: 17, prepTime: 3 },
      { name: 'ساندوتش بابا غنوج', price: 15, prepTime: 3 },
      { name: 'ساندوتش مسقعة', price: 15, prepTime: 3 },
      { name: 'ساندوتش فول', price: 15, prepTime: 3 },
      { name: 'ساندوتش جبنة بيضاء بالطماطم', price: 15, prepTime: 3 },
      { name: 'ساندوتش ديناميت', price: 20, prepTime: 4 },
      { name: 'ساندوتش بيض مسلوق', price: 15, prepTime: 3 },
      { name: 'بطاطس مهروسة', price: 15, prepTime: 3 },
      { name: 'ساندوتش فول بالليمون المعصفر', price: 18, prepTime: 3 },
      { name: 'ساندوتش شكشوكة', price: 15, prepTime: 4 },
      { name: 'بيض أومليت عادي', price: 15, prepTime: 4 },
      { name: 'بيض أومليت بسطرمة', price: 40, prepTime: 5 },
      { name: 'بيض أومليت خضار', price: 20, prepTime: 4 },
      { name: 'بيض أومليت سوسيس', price: 30, prepTime: 5 },
      { name: 'بيض أومليت سجق', price: 30, prepTime: 5 },
      { name: 'طبق فول صغير', price: 10, prepTime: 3 },
      { name: 'طبق بطاطس', price: 15, prepTime: 4 },
      { name: 'طبق طعمية', price: 10, prepTime: 3 },
      { name: 'طبق مسقعة صغير', price: 10, prepTime: 3 },
      { name: '4 أرغفة / كيس عيش', price: 5, prepTime: 1 },
      { name: 'طبق بابا غنوج', price: 15, prepTime: 3 },
      { name: 'طبق جبنة بالطماطم', price: 15, prepTime: 3 },
      { name: 'إضافة بابا غنوج فطار', price: 5, prepTime: 1 },
      { name: 'مخلل صغير', price: 5, prepTime: 1 },
    ],
  },

  // 2. ساندوتشات فينو وتورتيلا
  {
    name: 'ساندوتشات فينو وتورتيلا',
    displayOrder: 2,
    items: [
      { name: 'ساندوتش بطاطس فينو', price: 20, prepTime: 4 },
      { name: 'شاورما فراخ فينو', price: 60, prepTime: 6 },
      { name: 'شاورما لحمة فينو', price: 70, prepTime: 6 },
      { name: 'بانيه فينو', price: 65, prepTime: 6 },
      { name: 'تشكن كريسبي فينو', price: 65, prepTime: 6 },
      { name: 'شيش طاووق فينو', price: 70, prepTime: 7 },
      { name: 'فاهيتا فراخ فينو', price: 70, prepTime: 7 },
      { name: 'كوردن بلو فينو', price: 80, prepTime: 8 },
      { name: 'تشكن استربس فينو', price: 70, prepTime: 6 },
      { name: 'زنجر حار فينو', price: 70, prepTime: 6 },
      { name: 'سجق فينو', price: 50, prepTime: 6 },
      { name: 'سوسيس فينو', price: 50, prepTime: 5 },
      { name: 'هوت دوج فينو', price: 50, prepTime: 5 },
      { name: 'تورتيلا شاورما فراخ', price: 100, prepTime: 8 },
      { name: 'تورتيلا استربس', price: 95, prepTime: 8 },
      { name: 'تورتيلا بانيه', price: 90, prepTime: 7 },
      { name: 'تورتيلا شيش طاووق', price: 115, prepTime: 8 },
      { name: 'تورتيلا لحم', price: 110, prepTime: 8 },
      { name: 'تورتيلا هوت دوج', price: 85, prepTime: 7 },
      { name: 'تورتيلا سوسيس', price: 85, prepTime: 7 },
      { name: 'تورتيلا فاهيتا فراخ', price: 110, prepTime: 8 },
      { name: 'سوري بطاطس بالتومية', price: 40, prepTime: 5 },
    ],
  },

  // 3. الكريب والباكتات
  {
    name: 'الكريب والباكتات',
    displayOrder: 3,
    items: [
      { name: 'كريب ميكس جبن', price: 80, prepTime: 8 },
      { name: 'كريب شيش طاووق', price: 115, prepTime: 10 },
      { name: 'كريب شاورما لحمة', price: 120, prepTime: 10 },
      { name: 'كريب استربس', price: 95, prepTime: 9 },
      { name: 'كريب بانيه', price: 90, prepTime: 9 },
      { name: 'كريب شاورما فراخ', price: 110, prepTime: 10 },
      { name: 'كريب سوسيس', price: 90, prepTime: 8 },
      { name: 'كريب سجق', price: 90, prepTime: 8 },
      { name: 'كريب مشروم', price: 75, prepTime: 8 },
      { name: 'كريب بطاطس', price: 50, prepTime: 7 },
      { name: 'كريب فاهيتا فراخ', price: 115, prepTime: 10 },
      { name: 'باكيت بطاطس', price: 20, prepTime: 5 },
      { name: 'بطاطس جبنة شيدر وهلابينو', price: 30, prepTime: 6 },
      { name: 'بطاطسيكو فراخ', price: 50, prepTime: 7 },
      { name: 'بطاطسيكو لحمة', price: 50, prepTime: 7 },
      { name: 'فتة شاورما', price: 60, prepTime: 8 },
      { name: 'روزيتو', price: 65, prepTime: 8 },
      { name: 'تشكن سيزر سالاد', price: 50, prepTime: 6 },
      { name: 'كرواسون تشيز & تركي', price: 50, prepTime: 5 },
    ],
  },

  // 4. البيتزا
  {
    name: 'البيتزا',
    displayOrder: 4,
    items: [
      { name: 'بيتزا فراخ (وسط)', price: 90, prepTime: 12 },
      { name: 'بيتزا فراخ (كبير)', price: 140, prepTime: 15 },
      { name: 'بيتزا فراخ باربكيو (وسط)', price: 100, prepTime: 12 },
      { name: 'بيتزا فراخ باربكيو (كبير)', price: 150, prepTime: 15 },
      { name: 'بيتزا فراخ رانش (وسط)', price: 100, prepTime: 12 },
      { name: 'بيتزا فراخ رانش (كبير)', price: 150, prepTime: 15 },
      { name: 'بيتزا ببروني (وسط)', price: 110, prepTime: 12 },
      { name: 'بيتزا ببروني (كبير)', price: 160, prepTime: 15 },
      { name: 'بيتزا تونة (وسط)', price: 110, prepTime: 12 },
      { name: 'بيتزا تونة (كبير)', price: 160, prepTime: 15 },
      { name: 'بيتزا لحمة (وسط)', price: 100, prepTime: 12 },
      { name: 'بيتزا لحمة (كبير)', price: 150, prepTime: 15 },
      { name: 'بيتزا سجق (وسط)', price: 80, prepTime: 12 },
      { name: 'بيتزا سجق (كبير)', price: 130, prepTime: 15 },
      { name: 'بيتزا سوسيس (وسط)', price: 80, prepTime: 12 },
      { name: 'بيتزا سوسيس (كبير)', price: 130, prepTime: 15 },
      { name: 'بيتزا مارجريتا (وسط)', price: 70, prepTime: 10 },
      { name: 'بيتزا مارجريتا (كبير)', price: 120, prepTime: 14 },
      { name: 'بيتزا ميكس جبن (وسط)', price: 100, prepTime: 12 },
      { name: 'بيتزا ميكس جبن (كبير)', price: 150, prepTime: 15 },
      { name: 'بيتزا خضار (وسط)', price: 80, prepTime: 10 },
      { name: 'بيتزا خضار (كبير)', price: 130, prepTime: 14 },
      { name: 'بيتزا مكس لحوم (وسط)', price: 120, prepTime: 14 },
      { name: 'بيتزا مكس لحوم (كبير)', price: 180, prepTime: 16 },
      { name: 'بيتزا مكس فراخ (وسط)', price: 120, prepTime: 14 },
      { name: 'بيتزا مكس فراخ (كبير)', price: 180, prepTime: 16 },
    ],
  },

  // 5. مشروبات ساخنة
  {
    name: 'مشروبات ساخنة',
    displayOrder: 5,
    items: [
      { name: 'شاي فتلة (العروسة / ليبتون)', price: 10, prepTime: 3 },
      { name: 'شاي أحمد تي كلاسيك', price: 12, prepTime: 3 },
      { name: 'شاي أحمد تي نكهات مختلفة', price: 15, prepTime: 3 },
      { name: 'شاي كرك كلاسيك', price: 25, prepTime: 4 },
      { name: 'شاي كرك بالحليب', price: 35, prepTime: 5 },
      { name: 'ينسون / نعناع / كركديه', price: 15, prepTime: 3 },
      { name: 'ميكس أعشاب', price: 25, prepTime: 4 },
      { name: 'شاي بالحليب', price: 25, prepTime: 4 },
      { name: 'قهوة تركي', price: 20, prepTime: 4 },
      { name: 'قهوة تركي دبل', price: 25, prepTime: 5 },
      { name: 'نسكافيه بلاك', price: 25, prepTime: 3 },
      { name: 'نسكافيه 3x1', price: 25, prepTime: 3 },
      { name: 'نسكافيه 2x1', price: 25, prepTime: 3 },
      { name: 'نسكافيه وايت', price: 40, prepTime: 4 },
      { name: 'كابتشينو', price: 40, prepTime: 4 },
      { name: 'قهوة فرنساوي', price: 40, prepTime: 4 },
      { name: 'قهوة فرنساوي فليفر', price: 45, prepTime: 5 },
      { name: 'هوت شوكلت', price: 45, prepTime: 4 },
      { name: 'هوت أوريو', price: 50, prepTime: 5 },
      { name: 'إسبريسو سنجل', price: 35, prepTime: 3 },
      { name: 'إسبريسو دبل شوت', price: 50, prepTime: 4 },
      { name: 'سحلب سادة', price: 35, prepTime: 5 },
      { name: 'سحلب مكسرات', price: 45, prepTime: 5 },
      { name: 'هوت لاتيه', price: 60, prepTime: 5 },
    ],
  },

  // 6. مشروبات باردة وعصائر فريش
  {
    name: 'مشروبات باردة وعصائر فريش',
    displayOrder: 6,
    items: [
      { name: 'آيس لاتيه', price: 45, prepTime: 4 },
      { name: 'آيس سبانش لاتيه', price: 50, prepTime: 5 },
      { name: 'آيس موكا (دارك / وايت)', price: 50, prepTime: 5 },
      { name: 'آيس أمريكانو', price: 40, prepTime: 3 },
      { name: 'آيس كوفي (كراميل / شوكولاتة)', price: 50, prepTime: 5 },
      { name: 'آيس كراميل ميكاتو', price: 50, prepTime: 5 },
      { name: 'آيس ماتشا كلاسيك', price: 45, prepTime: 5 },
      { name: 'آيس ماتشا (فراولة / مانجا)', price: 50, prepTime: 5 },
      { name: 'آيس أوريو لاتيه', price: 50, prepTime: 5 },
      { name: 'آيس بستاشيو لاتيه', price: 50, prepTime: 5 },
      { name: 'آيس ستروبري لاتيه', price: 50, prepTime: 5 },
      { name: 'بلو آيس سبانش لاتيه', price: 50, prepTime: 5 },
      { name: 'آيس كابتشينو', price: 50, prepTime: 4 },
      { name: 'آيس فانيلا لاتيه', price: 50, prepTime: 4 },
      { name: 'آيس تي خوخ', price: 35, prepTime: 3 },
      { name: 'آيس تي باشن فروت', price: 35, prepTime: 3 },
      { name: 'عصير ليمون فريش', price: 25, prepTime: 3 },
      { name: 'عصير ليمون نعناع', price: 35, prepTime: 4 },
      { name: 'عصير مانجا طبيعي', price: 40, prepTime: 4 },
      { name: 'عصير فراولة طبيعي', price: 40, prepTime: 4 },
      { name: 'عصير جوافة فريش', price: 40, prepTime: 4 },
      { name: 'عصير بطيخ فريش', price: 40, prepTime: 4 },
      { name: 'عصير كانتلوب فريش', price: 40, prepTime: 4 },
      { name: 'عصير موز', price: 30, prepTime: 4 },
      { name: 'عصير خوخ فريش', price: 40, prepTime: 4 },
      { name: 'عصير برقوق', price: 40, prepTime: 4 },
      { name: 'عصير كيوي فريش', price: 50, prepTime: 4 },
      { name: 'عصير أفوكادو سادة', price: 50, prepTime: 5 },
      { name: 'عصير أفوكادو مكسرات', price: 60, prepTime: 5 },
      { name: 'أفوكادو مكس (موز + مكسرات + عسل)', price: 70, prepTime: 6 },
      { name: 'مكس مانجا + كيوي', price: 60, prepTime: 5 },
      { name: 'مكس مانجا + خوخ', price: 60, prepTime: 5 },
      { name: 'مكس موز + فراولة', price: 60, prepTime: 5 },
      { name: 'مكس مانجا + خوخ + كيوي', price: 70, prepTime: 5 },
      { name: 'مكس جوافة + ليمون', price: 60, prepTime: 5 },
      { name: 'مكس بطيخ + ليمون + نعناع', price: 60, prepTime: 5 },
      { name: 'مكس مانجا + آيس كريم + موز + بلوبيري', price: 70, prepTime: 6 },
      { name: 'مكس أفوكادو + مانجا + آيس كريم', price: 70, prepTime: 6 },
      { name: 'مكس مانجا + فراولة + بلوبيري', price: 60, prepTime: 5 },
      { name: 'بينا كولادا (أناناس + جوز هند + حليب)', price: 60, prepTime: 5 },
      { name: 'مكس مانجا + كيوي + باشن + موز', price: 60, prepTime: 5 },
      { name: 'موهيتو (أي فليفر من اختيارك)', price: 45, prepTime: 4 },
    ],
  },

  // 7. ميلك شيك وفرابيه
  {
    name: 'ميلك شيك وفرابيه',
    displayOrder: 7,
    items: [
      { name: 'ميلك شيك شوكولاتة / فانيليا', price: 50, prepTime: 5 },
      { name: 'ميلك شيك كراميل', price: 50, prepTime: 5 },
      { name: 'ميلك شيك فراولة', price: 50, prepTime: 5 },
      { name: 'ميلك شيك مانجا', price: 50, prepTime: 5 },
      { name: 'ميلك شيك توت بري / بلوبيري', price: 50, prepTime: 5 },
      { name: 'ميلك شيك مارشميلو / كاندي', price: 50, prepTime: 5 },
      { name: 'ميلك شيك أوريو', price: 60, prepTime: 5 },
      { name: 'ميلك شيك لوتس', price: 60, prepTime: 5 },
      { name: 'ميلك شيك بستاشيو', price: 60, prepTime: 5 },
      { name: 'ميلك شيك مكس (أي طعمين من اختيارك)', price: 70, prepTime: 6 },
      { name: 'فرابيه كلاسيك', price: 40, prepTime: 4 },
      { name: 'فرابيه كراميل', price: 45, prepTime: 5 },
      { name: 'فرابيه موكا', price: 45, prepTime: 5 },
      { name: 'فرابيه بندق', price: 45, prepTime: 5 },
      { name: 'فرابيه فانيلا', price: 45, prepTime: 5 },
      { name: 'فرابيه بستاشيو', price: 50, prepTime: 5 },
    ],
  },

  // 8. حلويات وآيس كريم
  {
    name: 'حلويات وآيس كريم',
    displayOrder: 8,
    items: [
      { name: '10 قطع بان كيك', price: 50, prepTime: 8 },
      { name: 'وافلز نوتيلا', price: 50, prepTime: 8 },
      { name: 'مولتن كيك', price: 80, prepTime: 10 },
      { name: 'سبونش كيك', price: 50, prepTime: 3 },
      { name: 'تشيز كيك', price: 70, prepTime: 3 },
      { name: 'ريد فيلفت', price: 70, prepTime: 3 },
      { name: 'فادج كيك', price: 60, prepTime: 3 },
      { name: 'طاجن نوتيلا', price: 50, prepTime: 8 },
      { name: 'آيس كريم (حجم صغير)', price: 25, prepTime: 2 },
      { name: 'آيس كريم (حجم كبير)', price: 35, prepTime: 2 },
    ],
  },

  // 9. الإضافات
  {
    name: 'الإضافات',
    displayOrder: 9,
    items: [
      { name: 'إضافة فراخ', price: 30, prepTime: 2 },
      { name: 'إضافة لحوم', price: 30, prepTime: 2 },
      { name: 'إضافة صوص', price: 8, prepTime: 1 },
      { name: 'إضافة صوص شيدر', price: 10, prepTime: 1 },
      { name: 'إضافة موتزاريلا', price: 25, prepTime: 2 },
      { name: 'إضافة هالبينو', price: 10, prepTime: 1 },
      { name: 'إضافة سموزي', price: 10, prepTime: 1 },
      { name: 'إضافة حليب كوب صغير', price: 15, prepTime: 1 },
      { name: 'إضافة حليب كوب كبير', price: 20, prepTime: 1 },
      { name: 'إضافة عسل', price: 10, prepTime: 1 },
      { name: 'إضافة بوبا', price: 15, prepTime: 1 },
      { name: 'إضافة صوص حلويات/مشروبات', price: 10, prepTime: 1 },
    ],
  },
];

async function seedFestivalLand() {
  console.log(`🚀 Starting menu seeding for kiosk: ${KIOSK_ID}...`);

  // 1. Check if Kiosk exists
  const [kiosk] = await db.select().from(kiosks).where(eq(kiosks.id, KIOSK_ID)).limit(1);

  if (!kiosk) {
    console.error(`❌ Kiosk with ID ${KIOSK_ID} not found in database!`);
    process.exit(1);
  }

  console.log(`✅ Found Kiosk: "${kiosk.name}" (ID: ${kiosk.id})`);

  // Update kiosk info with verified contacts and status
  await db
    .update(kiosks)
    .set({
      name: 'FESTIVAL LAND',
      phone: '01035825534',
      walletNumber: '01008114466',
      instapayHandle: '01008114466',
      acceptsWallet: true,
      acceptsInstapay: true,
      acceptsCash: true,
      acceptsOnline: true,
      acceptsOnlineOrders: true,
      isOpen: true,
      isHidden: false,
      category: 'وجبات ومشروبات وحلويات',
      openingHours: '8:00 ص - 10:00 م',
      imageUrl: '/images/menus/festival-land/food-menu.png',
    })
    .where(eq(kiosks.id, KIOSK_ID));

  console.log(`✨ Kiosk settings and contact details updated.`);

  let totalCategoriesAdded = 0;
  let totalItemsAdded = 0;

  for (const catData of MENU_DATA) {
    // Check if category already exists for this kiosk
    let [existingCat] = await db
      .select()
      .from(menuCategories)
      .where(and(eq(menuCategories.kioskId, KIOSK_ID), eq(menuCategories.name, catData.name)))
      .limit(1);

    let catId = existingCat?.id;

    if (!existingCat) {
      catId = generateId();
      await db.insert(menuCategories).values({
        id: catId,
        kioskId: KIOSK_ID,
        name: catData.name,
        displayOrder: catData.displayOrder,
        isActive: true,
      });
      totalCategoriesAdded++;
      console.log(`📁 Added Category: ${catData.name}`);
    } else {
      // update displayOrder if needed
      await db
        .update(menuCategories)
        .set({ displayOrder: catData.displayOrder, isActive: true })
        .where(eq(menuCategories.id, catId!));
      console.log(`📁 Category already exists: ${catData.name}`);
    }

    // Insert items
    for (const item of catData.items) {
      const priceInPiasters = item.price * 100; // EGP to Piasters (e.g. 15 EGP = 1500 Piasters)

      const [existingItem] = await db
        .select()
        .from(menuItems)
        .where(and(eq(menuItems.kioskId, KIOSK_ID), eq(menuItems.name, item.name)))
        .limit(1);

      if (!existingItem) {
        await db.insert(menuItems).values({
          id: generateId(),
          kioskId: KIOSK_ID,
          categoryId: catId!,
          name: item.name,
          description: item.description || null,
          price: priceInPiasters,
          preparationTimeMins: item.prepTime || 5,
          isAvailable: true,
          isUnderReview: false, // Must be false to be visible to students!
          isDeleted: false,
        });
        totalItemsAdded++;
      } else {
        // update price and ensure isUnderReview is false
        await db
          .update(menuItems)
          .set({
            categoryId: catId!,
            price: priceInPiasters,
            preparationTimeMins: item.prepTime || 5,
            isAvailable: true,
            isUnderReview: false,
            isDeleted: false,
          })
          .where(eq(menuItems.id, existingItem.id));
      }
    }
  }

  console.log(`\n🎉 SEEDING COMPLETE!`);
  console.log(`- Categories Processed: ${MENU_DATA.length}`);
  console.log(`- Total Items Seeded/Updated: ${MENU_DATA.reduce((acc, c) => acc + c.items.length, 0)}`);
  console.log(`- All items set to isUnderReview = false (Immediately visible to students)`);

  process.exit(0);
}

seedFestivalLand().catch((err) => {
  console.error('❌ Error seeding FESTIVAL LAND menu:', err);
  process.exit(1);
});

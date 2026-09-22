import { db } from './client.js';
import { kiosks, menuCategories, menuItems } from './schema.js';
import { generateId } from '../shared/id/index.js';
import { eq } from 'drizzle-orm';

const KIOSK_ID = '01a0c97d-0ae7-70ab-814d-36ebca8d8ee8';

interface MenuItemDef {
  name: string;
  price: number; // in EGP
  prepTime?: number; // in minutes
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
  // 1. سندوتشات فلافل
  // ==========================================
  {
    name: 'سندوتشات فلافل',
    aliases: ['فلافل', 'طعمية'],
    displayOrder: 1,
    items: [
      { name: 'فلافل سادة', price: 13, prepTime: 3, description: 'ساندوتش فلافل طازجة ومقرمشة بالسلطة والطحينة' },
      { name: 'فلافل محشية', price: 14, prepTime: 3, description: 'ساندوتش فلافل محشية بالخلطة المميزة' },
      { name: 'فلافل بتنجان', price: 15, prepTime: 3, description: 'فلافل مقرمشة مع شرائح الباذنجان المقلي والطحينة' },
      { name: 'فلافل بطاطس', price: 16, prepTime: 4, description: 'مزيج شهي من الفلافل والبطاطس المحمرة' },
      { name: 'فلافل بطاطس رانش', price: 20, prepTime: 4, description: 'فلافل وبطاطس محمرة مع صوص الرانش الغني' },
      { name: 'فلافل بطاطس بتنجان', price: 20, prepTime: 4, description: 'مكس ثلاثي رائع: فلافل وبطاطس وباذنجان مقلي' },
      { name: 'فلافل بيض مسلوق', price: 20, prepTime: 4, description: 'فلافل مقرمشة مع شرائح البيض المسلوق' },
      { name: 'ساندوتش ديناميت', price: 25, prepTime: 5, description: 'ساندوتش ديناميت ويزو المميز بكل الإضافات' },
    ],
  },

  // ==========================================
  // 2. سندوتشات فول
  // ==========================================
  {
    name: 'سندوتشات فول',
    aliases: ['فول'],
    displayOrder: 2,
    items: [
      { name: 'ساندوتش فول', price: 12, prepTime: 3, description: 'فول مدمس طازج بالطحينة والليمون والتوابل' },
      { name: 'فول زيت حار', price: 14, prepTime: 3, description: 'فول بالزيت الحار الأصلي والكمون والليمون' },
      { name: 'فول زيت زيتون', price: 14, prepTime: 3, description: 'فول صحي غني بزيت الزيتون النقي والطحينة' },
      { name: 'فول علي فلافل', price: 15, prepTime: 3, description: 'مزيج الفول المدمس مع الفلافل المقرمشة' },
    ],
  },

  // ==========================================
  // 3. سندوتشات بطاطس
  // ==========================================
  {
    name: 'سندوتشات بطاطس',
    aliases: ['بطاطس'],
    displayOrder: 3,
    items: [
      { name: 'بطاطس ويلز', price: 17, prepTime: 4, description: 'ساندوتش بطاطس ويلز المميزة' },
      { name: 'بطاطس تومية بارد', price: 19, prepTime: 4, description: 'بطاطس محمرة مع صوص التومية البارد اللذيذ' },
      { name: 'بطاطس تومية حار', price: 19, prepTime: 4, description: 'بطاطس محمرة مع صوص التومية السبايسي الحار' },
      { name: 'بطاطس كاتشب', price: 19, prepTime: 4, description: 'بطاطس مقلية كرسبي مع صوص الكاتشب' },
      { name: 'بطاطس كاتشب ومايونيز', price: 20, prepTime: 4, description: 'بطاطس مقلية مع مكس الكاتشب والمايونيز' },
      { name: 'بطاطس مايونيز', price: 20, prepTime: 4, description: 'بطاطس مقلية ذهبية مع المايونيز الكريمي' },
      { name: 'بطاطس رانش', price: 20, prepTime: 4, description: 'بطاطس محمرة مع صوص الرانش اللذيذ' },
      { name: 'بطاطس باربكيو', price: 20, prepTime: 4, description: 'بطاطس مقلية مع صوص الباربكيو المدخن' },
      { name: 'بطاطس صوص شيدر', price: 25, prepTime: 5, description: 'بطاطس مقلية مغطاة بصوص جبنة الشيدر السايحة' },
      { name: 'بطاطس موتزاريلا', price: 25, prepTime: 5, description: 'بطاطس محمرة مع جبنة موتزاريلا سايحة ومطاطية' },
      { name: 'بطاطس رومي', price: 25, prepTime: 5, description: 'بطاطس محمرة مع الجبنة الرومي المبشورة' },
      { name: 'بطاطس جبنة بيضاء', price: 20, prepTime: 4, description: 'ساندوتش بطاطس محمرة مع الجبنة البيضاء' },
      { name: 'بطاطس بيض مسلوق', price: 20, prepTime: 4, description: 'بطاطس محمرة مع شرائح البيض المسلوق' },
      { name: 'ساندوتش جبنة بيض', price: 25, prepTime: 4, description: 'ساندوتش ميكس جبنة بيضاء مع بيض مسلوق' },
      { name: 'بطاطس علي فول', price: 16, prepTime: 4, description: 'مزيج البطاطس المحمرة مع الفول المدمس' },
      { name: 'ساندوتش بيض علي فول', price: 20, prepTime: 4, description: 'فول مدمس مع البيض المسلوق والتوابل' },
    ],
  },

  // ==========================================
  // 4. سندوتشات بيض
  // ==========================================
  {
    name: 'سندوتشات بيض',
    aliases: ['بيض', 'أومليت'],
    displayOrder: 4,
    items: [
      { name: 'أومليت سادة', price: 15, prepTime: 4, description: 'بيض أومليت طازج محضر على الجريل' },
      { name: 'أومليت رومي', price: 25, prepTime: 5, description: 'بيض أومليت بالجبنة الرومي اللذيذة' },
      { name: 'أومليت شيدر', price: 25, prepTime: 5, description: 'بيض أومليت غني بجبنة الشيدر السايحة' },
      { name: 'أومليت بسطرمة', price: 30, prepTime: 5, description: 'بيض أومليت بقطع البسطرمة البلدية الفاخرة' },
      { name: 'بيض مسلوق', price: 14, prepTime: 3, description: 'ساندوتش بيض مسلوق طازج مع رشة توابل' },
    ],
  },

  // ==========================================
  // 5. سندوتشات عيش سوري
  // ==========================================
  {
    name: 'سندوتشات عيش سوري',
    aliases: ['عيش سوري', 'سوري'],
    displayOrder: 5,
    items: [
      { name: 'بطاطس سادة (سوري)', price: 20, prepTime: 5, description: 'ساندوتش بطاطس في الخبز السوري المحمص' },
      { name: 'بطاطس كاتشب (سوري)', price: 25, prepTime: 5, description: 'بطاطس وكاتشب في العيش السوري المقرمش' },
      { name: 'بطاطس مايونيز (سوري)', price: 25, prepTime: 5, description: 'بطاطس ومايونيز في الخبز السوري' },
      { name: 'بطاطس كاتشب ومايونيز (سوري)', price: 26, prepTime: 5, description: 'بطاطس مكس كاتشب ومايونيز في عيش سوري' },
      { name: 'بطاطس تومية بارد (سوري)', price: 25, prepTime: 5, description: 'بطاطس مع تومية باردة في عيش سوري محمص' },
      { name: 'بطاطس تومية حار (سوري)', price: 25, prepTime: 5, description: 'بطاطس مع تومية حارة سبايسي في عيش سوري' },
      { name: 'بطاطس باربكيو (سوري)', price: 27, prepTime: 5, description: 'بطاطس وصوص باربكيو مدخن في عيش سوري' },
      { name: 'بطاطس رانش (سوري)', price: 27, prepTime: 5, description: 'بطاطس وصوص رانش غني في خبز سوري' },
      { name: 'بطاطس شيدر (سوري)', price: 35, prepTime: 6, description: 'بطاطس سوري مغطاة بصوص جبنة الشيدر' },
      { name: 'بطاطس موتزاريلا (سوري)', price: 35, prepTime: 6, description: 'بطاطس سوري مع جبنة موتزاريلا سايحة ومطاطية' },
      { name: 'فلافل (سوري)', price: 25, prepTime: 5, description: 'ساندوتش فلافل مقرمشة في الخبز السوري اللذيذ' },
      { name: 'فلافل مشكل (سوري)', price: 35, prepTime: 6, description: 'فلافل مع بطاطس وإضافات مشكلة في العيش السوري' },
    ],
  },

  // ==========================================
  // 6. كريب
  // ==========================================
  {
    name: 'كريب',
    aliases: ['كريب'],
    displayOrder: 6,
    items: [
      {
        name: 'كريب استربس',
        price: 110,
        prepTime: 8,
        description: 'استربس دجاج مقرمش + بطاطس + خضار + جبنة وموتزاريلا + كاتشب ومايونيز',
      },
      {
        name: 'كريب بانيه',
        price: 100,
        prepTime: 8,
        description: 'قطع دجاج بانيه + بطاطس + خضار + جبنة وموتزاريلا + كاتشب ومايونيز',
      },
      {
        name: 'كريب سجق',
        price: 100,
        prepTime: 8,
        description: 'سجق بلدي متبل + بطاطس + خضار + كاتشب ومايونيز',
      },
      {
        name: 'كريب سوسيس',
        price: 100,
        prepTime: 8,
        description: 'سوسيس مشوي + بطاطس + خضار + كاتشب ومايونيز',
      },
      {
        name: 'كريب الوحش',
        price: 130,
        prepTime: 10,
        description: 'كريب الوحش الخارق: استربس + بانيه + سجق + سوسيس + بطاطس + خضار + جبنة وموتزاريلا + كاتشب ومايونيز',
      },
    ],
  },

  // ==========================================
  // 7. سندوتشات عيش فرنساوي
  // ==========================================
  {
    name: 'سندوتشات عيش فرنساوي',
    aliases: ['فرنساوي', 'عيش فرنساوي'],
    displayOrder: 7,
    items: [
      { name: 'ساندوتش كبدة (فرنساوي)', price: 30, prepTime: 6, description: 'كبدة اسكندراني متبلة بالفلفل والتوابل في عيش فرنساوي' },
      { name: 'ساندوتش سجق (فرنساوي)', price: 40, prepTime: 6, description: 'سجق بلدي مشوي ومتبل بخلطة ويزو الخاصة في عيش فرنساوي' },
      { name: 'ساندوتش بانيه (فرنساوي)', price: 40, prepTime: 6, description: 'صدور دجاج بانيه مقرمشة مع الخس والصوص في عيش فرنساوي' },
      { name: 'ساندوتش سوسيس (فرنساوي)', price: 40, prepTime: 5, description: 'سوسيس مشوي مع الصوصات اللذيذة في عيش فرنساوي' },
      { name: 'رغيف حواوشي', price: 50, prepTime: 8, description: 'حواوشي بلدي متبل ومحمص مقرمش على الجريل' },
    ],
  },
];

async function seedWezoMenu() {
  console.log(`🚀 Starting menu update for ويزو - المطعم (ID: ${KIOSK_ID})...`);

  // 1. Verify kiosk exists
  const kioskList = await db.select().from(kiosks).where(eq(kiosks.id, KIOSK_ID));
  if (kioskList.length === 0) {
    throw new Error(`Kiosk with ID ${KIOSK_ID} not found in database!`);
  }
  const kiosk = kioskList[0];
  console.log(`✅ Found Kiosk: ${kiosk.name} (${kiosk.collegeLocation})`);

  // Update kiosk info to ensure category is 'ماكولات', isOpen is true, prep time is 10 mins
  await db
    .update(kiosks)
    .set({
      category: 'ماكولات',
      defaultPrepTimeMins: 10,
      isOpen: true,
      acceptsOnlineOrders: true,
      updatedAt: new Date(),
    })
    .where(eq(kiosks.id, KIOSK_ID));

  // 2. Fetch existing categories
  const existingCategories = await db
    .select()
    .from(menuCategories)
    .where(eq(menuCategories.kioskId, KIOSK_ID));

  // 3. Fetch existing items
  const existingItems = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.kioskId, KIOSK_ID));

  console.log(`📊 Current DB state: ${existingCategories.length} categories, ${existingItems.length} items.`);

  const handledItemIds = new Set<string>();

  for (const catDef of MENU_DATA) {
    // Check if category already exists (by name or alias)
    let catRecord = existingCategories.find((c) => c.name.trim() === catDef.name.trim());
    if (!catRecord && catDef.aliases) {
      catRecord = existingCategories.find((c) =>
        catDef.aliases!.some((alias) => c.name.toLowerCase().includes(alias.toLowerCase()))
      );
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
      console.log(`\n📁 Updated Category: [${catDef.name}]`);
    } else {
      catId = generateId();
      await db.insert(menuCategories).values({
        id: catId,
        kioskId: KIOSK_ID,
        name: catDef.name,
        displayOrder: catDef.displayOrder,
        isActive: true,
      });
      console.log(`\n✨ Created Category: [${catDef.name}]`);
    }

    // Process items
    for (const itemDef of catDef.items) {
      const priceInPiasters = itemDef.price * 100;
      const prepTime = itemDef.prepTime || 5;

      const existingItem = existingItems.find((i) => {
        if (handledItemIds.has(i.id)) return false;
        return i.name.trim() === itemDef.name.trim();
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
        console.log(`   🔄 Updated Item: ${itemDef.name} -> ${itemDef.price} EGP`);
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
        console.log(`   ➕ Inserted Item: ${itemDef.name} -> ${itemDef.price} EGP`);
      }
    }
  }

  // Handle any remaining old items
  const obsoleteItems = existingItems.filter((i) => !handledItemIds.has(i.id) && !i.isDeleted);
  if (obsoleteItems.length > 0) {
    console.log(`\n🧹 Archiving ${obsoleteItems.length} old/obsolete items...`);
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

  console.log(`\n🎉 ALL DONE! Menu of ويزو - المطعم (Wezo) seeded successfully with ${handledItemIds.size} items across ${MENU_DATA.length} categories.`);
  process.exit(0);
}

seedWezoMenu().catch((err) => {
  console.error('❌ Error seeding Wezo menu:', err);
  process.exit(1);
});

import { db } from './client.js';
import { kiosks, menuCategories, menuItems } from './schema.js';
import { generateId } from '../shared/id/index.js';
import { eq } from 'drizzle-orm';

const KIOSK_ID = '01a0c980-895e-74ba-9900-77c1e2f59dab';

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
  // 1. موهيتو - Mojito
  // ==========================================
  {
    name: 'موهيتو - Mojito',
    aliases: ['موهيتو', 'Mojito'],
    displayOrder: 1,
    items: [
      {
        name: 'موهيتو ريد بول (Mojito Redbull)',
        price: 80,
        prepTime: 4,
        description: 'موهيتو منعش مع مشروب الطاقة ريد بول والنعناع والليمون والثلج',
      },
      {
        name: 'موهيتو بأي نكهة (Mojito with Any Flavor)',
        price: 90,
        prepTime: 4,
        description: 'موهيتو منعش بنكهتك المفضلة من اختيارك مع الصودا والنعناع والليمون',
      },
      {
        name: 'موهيتو كلاسيك (Mojito Classic)',
        price: 50,
        prepTime: 3,
        description: 'موهيتو كلاسيكي منعش بالنعناع الطازج، شرائح الليمون، والصودا',
      },
      {
        name: 'موهيتو فراولة (Mojito Strawberry)',
        price: 50,
        prepTime: 3,
        description: 'موهيتو بنكهة الفراولة الطبيعية المنعشة مع النعناع والليمون',
      },
      {
        name: 'موهيتو مانجو (Mojito Mango)',
        price: 50,
        prepTime: 3,
        description: 'موهيتو بنكهة المانجو الاستوائية اللذيذة مع النعناع والليمون',
      },
      {
        name: 'موهيتو باشن فروت (Mojito Passion Fruit)',
        price: 50,
        prepTime: 3,
        description: 'موهيتو بنكهة الباشن فروت الاستوائية المنعشة',
      },
      {
        name: 'موهيتو خوخ (Mojito Peach)',
        price: 50,
        prepTime: 3,
        description: 'موهيتو منعش بنكهة الخوخ اللذيذة مع شرائح الليمون والنعناع',
      },
      {
        name: 'موهيتو كيوي (Mojito Kiwi)',
        price: 60,
        prepTime: 4,
        description: 'موهيتو منعش بنكهة الكيوي المميزة والليمون والنعناع',
      },
      {
        name: 'موهيتو ميكس نكهتين (Mojito Mix 2 Flavor)',
        price: 80,
        prepTime: 4,
        description: 'ميكس موهيتو منعش يجمع بين نكهتين من اختيارك مع الليمون والنعناع',
      },
    ],
  },

  // ==========================================
  // 2. بوبا - Boba
  // ==========================================
  {
    name: 'بوبا - Boba',
    aliases: ['بوبا', 'Boba'],
    displayOrder: 2,
    items: [
      {
        name: 'ايس لاتيه بوبا (Iced Latte Boba)',
        price: 80,
        prepTime: 5,
        description: 'ايس لاتيه اسبريسو فاخر مع الحليب البارد وكرات البوبا اللذيذة',
      },
      {
        name: 'ايس سبانش بوبا (Iced Spanish Boba)',
        price: 90,
        prepTime: 5,
        description: 'ايس سبانش لاتيه غني بالحليب المكثف المحلى وكرات البوبا المميزة',
      },
      {
        name: 'إضافة بوبا لأي ميلك شيك (Any Milkshake Boba)',
        price: 10,
        prepTime: 2,
        description: 'إضافة كرات البوبا التابيوكا المميزة لأي مشروب ميلك شيك من اختيارك',
      },
    ],
  },

  // ==========================================
  // 3. فرابتشينو - Frappuccino
  // ==========================================
  {
    name: 'فرابتشينو - Frappuccino',
    aliases: ['فرابتشينو', 'Frappuccino'],
    displayOrder: 3,
    items: [
      {
        name: 'فرابتشينو كراميل (Frappuccino Caramel)',
        price: 90,
        prepTime: 5,
        description: 'فرابتشينو مثلج بصوص الكراميل الغني، قهوة، حليب وكريمة مخفوقة',
      },
      {
        name: 'فرابتشينو كلاسيك (Frappuccino Classic)',
        price: 70,
        prepTime: 5,
        description: 'فرابتشينو القهوة الكلاسيكي المثلج المخفوق مع الحليب والثلج',
      },
      {
        name: 'فرابتشينو موكا (Frappuccino Mocha)',
        price: 80,
        prepTime: 5,
        description: 'مزيج مثلج رائع من القهوة وصوص الشوكولاتة اللذيذ مع الحليب والكريمة',
      },
      {
        name: 'فرابتشينو وايت موكا (Frappuccino White Mocha)',
        price: 80,
        prepTime: 5,
        description: 'فرابتشينو القهوة مع صوص الشوكولاتة البيضاء الفاخرة والكريمة المخفوقة',
      },
      {
        name: 'فرابتشينو لوتس (Frappuccino Lotus)',
        price: 85,
        prepTime: 5,
        description: 'فرابتشينو مثلج مع زبدة اللوتس وبسكويت اللوتس المقرمش',
      },
      {
        name: 'فرابتشينو فانيليا بدون قهوة (Frappuccino Vanilla)',
        price: 70,
        prepTime: 4,
        description: 'فرابتشينو مثلج كريمي غني بنكهة الفانيليا (بدون قهوة - Non Coffee)',
      },
      {
        name: 'فرابتشينو فراولة بدون قهوة (Frappuccino Strawberry)',
        price: 70,
        prepTime: 4,
        description: 'فرابتشينو مثلج كريمي بنكهة الفراولة الطبيعية (بدون قهوة - Non Coffee)',
      },
      {
        name: 'فرابتشينو ساقي (Frappuccino Saqi)',
        price: 95,
        prepTime: 6,
        description: 'المشروب المميز الخاص بكافتريا ساقي بخلطة ونكهات حصرية',
      },
    ],
  },

  // ==========================================
  // 4. ميلك شيك - Milk Shake
  // ==========================================
  {
    name: 'ميلك شيك - Milk Shake',
    aliases: ['ميلك شيك', 'Milk Shake', 'Milkshake'],
    displayOrder: 4,
    items: [
      {
        name: 'ميلك شيك فراولة (Milk Shake Strawberry)',
        price: 75,
        prepTime: 5,
        description: 'ميلك شيك آيس كريم الفراولة الطبيعية الغني بالحليب والكريمة',
      },
      {
        name: 'ميلك شيك مانجو (Milk Shake Mango)',
        price: 75,
        prepTime: 5,
        description: 'ميلك شيك المانجو الطبيعية المنعشة والمخفوقة مع الآيس كريم',
      },
      {
        name: 'ميلك شيك باشن فروت (Milk Shake Passion Fruit)',
        price: 75,
        prepTime: 5,
        description: 'ميلك شيك مميز بنكهة الباشن فروت الاستوائية مع الآيس كريم',
      },
      {
        name: 'ميلك شيك بلوبيري (Milk Shake Blueberry)',
        price: 80,
        prepTime: 5,
        description: 'ميلك شيك التوت الأزرق اللذيذ الغني بالآيس كريم والكريمة',
      },
      {
        name: 'ميلك شيك خوخ (Milk Shake Peach)',
        price: 75,
        prepTime: 5,
        description: 'ميلك شيك بنكهة الخوخ اللذيذة والمنعشة مع الآيس كريم',
      },
      {
        name: 'ميلك شيك نوتيلا (Milk Shake Nutella)',
        price: 80,
        prepTime: 5,
        description: 'ميلك شيك شوكولاتة نوتيلا الأصلية الغنية بالبندق مع الكريمة',
      },
      {
        name: 'ميلك شيك كراميل (Milk Shake Caramel)',
        price: 75,
        prepTime: 5,
        description: 'ميلك شيك كريمي بصوص الكراميل الذهبي اللذيذ',
      },
      {
        name: 'ميلك شيك كيندر (Milk Shake Kinder)',
        price: 90,
        prepTime: 5,
        description: 'ميلك شيك شوكولاتة كيندر الفاخرة مع الحليب والآيس كريم والكريمة',
      },
      {
        name: 'ميلك شيك لوتس (Milk Shake Lotus)',
        price: 90,
        prepTime: 5,
        description: 'ميلك شيك زبدة اللوتس الشهية مع فتات بسكويت اللوتس المقرمش',
      },
      {
        name: 'ميلك شيك بستاشيو (Milk Shake Pistachio)',
        price: 95,
        prepTime: 5,
        description: 'ميلك شيك فستق بستاشيو فاخر غني بالطعم الكريمي الرائع',
      },
      {
        name: 'ميلك شيك سنيكرز (Milk Shake Snickers)',
        price: 85,
        prepTime: 5,
        description: 'ميلك شيك شوكولاتة سنيكرز مع صوص الكراميل والفول السوداني',
      },
      {
        name: 'ميلك شيك أوريو (Milk Shake Oreo)',
        price: 75,
        prepTime: 5,
        description: 'ميلك شيك غني بقطع بسكويت أوريو اللذيذ مع الآيس كريم والكريمة',
      },
      {
        name: 'ميلك شيك هوهوز (Milk Shake HoHos)',
        price: 70,
        prepTime: 5,
        description: 'ميلك شيك كيك هوهوز الشوكولاتة المحشوة بالكريمة',
      },
    ],
  },

  // ==========================================
  // 5. قهوة مثلجة - Iced Coffee
  // ==========================================
  {
    name: 'قهوة مثلجة - Iced Coffee',
    aliases: ['قهوة مثلجة', 'Iced Coffee', 'ايس كوفي'],
    displayOrder: 5,
    items: [
      {
        name: 'ايس لاتيه (Iced Latte)',
        price: 70,
        prepTime: 4,
        description: 'جرعة اسبريسو طازجة مع الحليب البارد وقطع الثلج المنعشة',
      },
      {
        name: 'ايس سبانش لاتيه (Iced Spanish Latte)',
        price: 90,
        prepTime: 4,
        description: 'اسبريسو غني مع الحليب والحليب المكثف المحلى البارد والثلج',
      },
      {
        name: 'ايس دارك موكا (Iced Dark Mocha)',
        price: 80,
        prepTime: 4,
        description: 'قهوة اسبريسو مثلجة مع صوص الشوكولاتة الداكنة والحليب البارد',
      },
      {
        name: 'ايس وايت موكا (Iced White Mocha)',
        price: 80,
        prepTime: 4,
        description: 'قهوة اسبريسو مثلجة مع صوص الشوكولاتة البيضاء والحليب البارد',
      },
      {
        name: 'ايس كراميل ماكياتو (Iced Caramel Macchiato)',
        price: 80,
        prepTime: 4,
        description: 'طبقات متناغمة من الحليب البارد، اسبريسو قوي وصوص الكراميل',
      },
    ],
  },
];

async function seedSaqiMenu() {
  console.log(`🚀 Starting menu update for ساقي - الكافتريا (ID: ${KIOSK_ID})...`);

  // 1. Verify kiosk exists
  const kioskList = await db.select().from(kiosks).where(eq(kiosks.id, KIOSK_ID));
  if (kioskList.length === 0) {
    throw new Error(`Kiosk with ID ${KIOSK_ID} not found in database!`);
  }
  const kiosk = kioskList[0];
  console.log(`✅ Found Kiosk: ${kiosk.name} (${kiosk.collegeLocation})`);

  // Update kiosk info to ensure it's open, category is 'مشروبات', and prep time is 6 mins
  await db
    .update(kiosks)
    .set({
      category: 'مشروبات',
      defaultPrepTimeMins: 6,
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
        // Exact name or contained name
        const matchExact = i.name.trim() === itemDef.name.trim();
        const cleanExisting = i.name.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, '');
        const cleanDef = itemDef.name.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, '');
        return matchExact || cleanExisting === cleanDef;
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

  // Check if any old unhandled items exist
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

  console.log(`\n🎉 ALL DONE! Menu of ساقي (Saqi) seeded successfully with ${handledItemIds.size} items across ${MENU_DATA.length} categories.`);
  process.exit(0);
}

seedSaqiMenu().catch((err) => {
  console.error('❌ Error seeding Saqi menu:', err);
  process.exit(1);
});

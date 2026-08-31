import { db } from './client.js';
import {
  kiosks,
  menuCategories,
  menuItems,
} from './schema.js';
import { generateId } from '../shared/id/index.js';

async function seed() {
  console.log('🌱 Seeding OrderFAST initial university kiosks and menus...');

  try {
    // 1. Create Kiosks
    const kiosk1Id = generateId();
    const kiosk2Id = generateId();
    const kiosk3Id = generateId();

    await db.insert(kiosks).values([
      {
        id: kiosk1Id,
        name: 'كشك الحرية',
        collegeLocation: 'كلية الهندسة',
        campusZone: 'الساحة الرئيسية - مبنى عمارة',
        category: 'مشروبات وسناكس',
        isOpen: true,
        acceptsOnlineOrders: true,
        isRushMode: false,
        openingHours: 'مفتوح حتى 4:00 م',
        phone: '01123456780',
        rating: '4.80',
        defaultPrepTimeMins: 15,
        acceptanceTimeoutSecs: 300,
      },
      {
        id: kiosk2Id,
        name: 'كافيه الحاسبات',
        collegeLocation: 'كلية الحاسبات والمعلومات',
        campusZone: 'الدور الأرضي - جانب المعامل',
        category: 'مشروبات ساخنة',
        isOpen: true,
        acceptsOnlineOrders: true,
        isRushMode: false,
        openingHours: 'مفتوح حتى 5:30 م',
        phone: '01234567891',
        rating: '4.90',
        defaultPrepTimeMins: 8,
        acceptanceTimeoutSecs: 240,
      },
      {
        id: kiosk3Id,
        name: 'كريب ووافل التجارة',
        collegeLocation: 'كلية التجارة وإدارة الأعمال',
        campusZone: 'المبنى الملحق',
        category: 'ساندوتشات وحلويات',
        isOpen: true,
        acceptsOnlineOrders: true,
        isRushMode: false,
        openingHours: 'مفتوح حتى 4:30 م',
        phone: '01511223344',
        rating: '4.70',
        defaultPrepTimeMins: 12,
        acceptanceTimeoutSecs: 300,
      },
    ]);

    // 2. Create Categories for Kiosk 1 (كشك الحرية)
    const catHotId = generateId();
    const catColdId = generateId();
    const catFoodId = generateId();

    await db.insert(menuCategories).values([
      {
        id: catHotId,
        kioskId: kiosk1Id,
        name: 'مشروبات ساخنة',
        displayOrder: 1,
        isActive: true,
      },
      {
        id: catColdId,
        kioskId: kiosk1Id,
        name: 'مشروبات باردة',
        displayOrder: 2,
        isActive: true,
      },
      {
        id: catFoodId,
        kioskId: kiosk1Id,
        name: 'ساندوتشات وسناكس',
        displayOrder: 3,
        isActive: true,
      },
    ]);

    // 3. Create Menu Items for Kiosk 1 (Prices in Piasters: 8 EGP = 800)
    await db.insert(menuItems).values([
      {
        id: generateId(),
        kioskId: kiosk1Id,
        categoryId: catHotId,
        name: 'شاي بالنعناع',
        description: 'شاي أسود مع أوراق النعناع الطازج',
        price: 800, // 8.00 EGP
        isAvailable: true,
        isUnderReview: false,
        preparationTimeMins: 3,
      },
      {
        id: generateId(),
        kioskId: kiosk1Id,
        categoryId: catHotId,
        name: 'قهوة تركي محوجة',
        description: 'بن برازيلي محوج بالهيل (سادة / مظبوط / زيادة)',
        price: 1200, // 12.00 EGP
        isAvailable: true,
        isUnderReview: false,
        preparationTimeMins: 5,
      },
      {
        id: generateId(),
        kioskId: kiosk1Id,
        categoryId: catColdId,
        name: 'عصير مانجا فريش',
        description: 'عصير مانجا طبيعي مثلج',
        price: 1500, // 15.00 EGP
        isAvailable: true,
        isUnderReview: false,
        preparationTimeMins: 4,
      },
      {
        id: generateId(),
        kioskId: kiosk1Id,
        categoryId: catFoodId,
        name: 'سندوتش جبنة رومي قديمة',
        description: 'عيش فينو طازج مع جبنة رومي وطماطم وخيار',
        price: 2000, // 20.00 EGP
        isAvailable: true,
        isUnderReview: false,
        preparationTimeMins: 4,
      },
      {
        id: generateId(),
        kioskId: kiosk1Id,
        categoryId: catFoodId,
        name: 'سندوتش بطاطس فارم فريتس',
        description: 'بطاطس مقرمشة متبلة في فينو مع كاتشب ومايونيز',
        price: 1800, // 18.00 EGP
        isAvailable: true,
        isUnderReview: false,
        preparationTimeMins: 6,
      },
    ]);

    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();

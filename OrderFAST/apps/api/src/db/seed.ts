import { db } from './client.js';
import {
  kiosks,
  menuCategories,
  menuItems,
  profiles,
  students,
  kioskStaff,
} from './schema.js';
import { generateId } from '../shared/id/index.js';
import { getSupabaseAdmin } from '../shared/supabase/index.js';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Seeding OrderFAST initial university kiosks, menus, and users...');

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Check / Create Kiosks
    let [kiosk1] = await db.select().from(kiosks).where(eq(kiosks.name, 'كشك الحرية')).limit(1);
    const kiosk1Id = kiosk1?.id || generateId();

    if (!kiosk1) {
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
          openingHours: '8:00 ص - 4:00 م',
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
          openingHours: '8:00 ص - 5:30 م',
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
          openingHours: '8:00 ص - 4:30 م',
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
    }

    // 4. Helper function to create or get Supabase Auth user
    async function getOrCreateUser(email: string, password: string, fullName: string, role: string) {
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
      const existing = listData?.users?.find((u) => u.email === email);

      if (existing) {
        return existing.id;
      }

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, system_role: role },
      });

      if (error || !data.user) {
        throw new Error(`Failed to create auth user ${email}: ${error?.message}`);
      }

      return data.user.id;
    }

    // 5. Seed Test Student: student@orderfast.test
    const studentUserId = await getOrCreateUser(
      'student@orderfast.test',
      'Password123!',
      'أحمد كريم',
      'student'
    );

    const [existingStudentProfile] = await db.select().from(profiles).where(eq(profiles.id, studentUserId)).limit(1);
    if (!existingStudentProfile) {
      await db.insert(profiles).values({
        id: studentUserId,
        fullName: 'أحمد كريم',
        phone: '01012345678',
        systemRole: 'student',
        isActive: true,
      });

      await db.insert(students).values({
        id: studentUserId,
        universityId: 'U2024001',
        college: 'كلية الهندسة',
        accountStatus: 'active',
        noShowCount: 0,
      });
    }

    // 6. Seed Test Cashier: cashier@orderfast.test
    const cashierUserId = await getOrCreateUser(
      'cashier@orderfast.test',
      'Password123!',
      'محمد كاشير',
      'staff'
    );

    const [existingCashierProfile] = await db.select().from(profiles).where(eq(profiles.id, cashierUserId)).limit(1);
    if (!existingCashierProfile) {
      await db.insert(profiles).values({
        id: cashierUserId,
        fullName: 'محمد كاشير',
        phone: '01123456789',
        systemRole: 'staff',
        isActive: true,
      });

      await db.insert(kioskStaff).values({
        id: generateId(),
        kioskId: kiosk1Id,
        userId: cashierUserId,
        role: 'owner',
        isActive: true,
      });
    }

    // 7. Seed Test Admin: admin@orderfast.test
    const adminUserId = await getOrCreateUser(
      'admin@orderfast.test',
      'Password123!',
      'مدير النظام',
      'admin'
    );

    const [existingAdminProfile] = await db.select().from(profiles).where(eq(profiles.id, adminUserId)).limit(1);
    if (!existingAdminProfile) {
      await db.insert(profiles).values({
        id: adminUserId,
        fullName: 'مدير النظام',
        phone: '01234567890',
        systemRole: 'admin',
        isActive: true,
      });
    }

    console.log('✅ Seeding completed successfully!');
    console.log('🔑 Test credentials ready:');
    console.log('   - Student: student@orderfast.test / Password123!');
    console.log('   - Cashier: cashier@orderfast.test / Password123!');
    console.log('   - Admin:   admin@orderfast.test   / Password123!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();

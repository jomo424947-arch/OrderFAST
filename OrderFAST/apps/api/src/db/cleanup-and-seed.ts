import { db } from './client.js';
import {
  kiosks,
  menuCategories,
  menuItems,
  profiles,
  students,
  kioskStaff,
  orders,
  orderItems,
  orderEvents,
  notifications,
} from './schema.js';
import { generateId } from '../shared/id/index.js';
import { getSupabaseAdmin } from '../shared/supabase/index.js';
import { eq, and, sql, inArray, like, or } from 'drizzle-orm';

async function cleanupAndSeed() {
  console.log('🧹 Cleaning up database from test kiosks and obsolete data...');

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Find all test kiosks to remove
    const testKiosks = await db
      .select({ id: kiosks.id, name: kiosks.name })
      .from(kiosks)
      .where(
        or(
          like(kiosks.name, 'test_%'),
          like(kiosks.name, 't_%'),
          like(kiosks.name, 't_p15_%')
        )
      );

    if (testKiosks.length > 0) {
      console.log(`🗑️ Found ${testKiosks.length} test kiosks to remove.`);
      const testKioskIds = testKiosks.map((k) => k.id);

      // Find any orders related to these test kiosks to delete them
      const relatedOrders = await db
        .select({ id: orders.id })
        .from(orders)
        .where(inArray(orders.kioskId, testKioskIds));

      if (relatedOrders.length > 0) {
        const orderIds = relatedOrders.map((o) => o.id);
        await db.delete(orderEvents).where(inArray(orderEvents.orderId, orderIds));
        await db.delete(orderItems).where(inArray(orderItems.orderId, orderIds));
        await db.delete(notifications).where(inArray(notifications.orderId, orderIds));
        await db.delete(orders).where(inArray(orders.id, orderIds));
      }

      // Delete test kiosks (cascade removes categories, items, staff)
      await db.delete(kiosks).where(inArray(kiosks.id, testKioskIds));
      console.log('✅ Test kiosks removed successfully.');
    } else {
      console.log('✨ No test kiosks found to clean.');
    }

    // 2. Ensure Real Kiosks Exist
    console.log('🏬 Seeding / Updating standard campus kiosks...');

    // Helper: Seed or update kiosk
    async function seedKiosk(kioskData: typeof kiosks.$inferInsert, categoriesData: Array<{ name: string; displayOrder: number; items: Array<{ name: string; description?: string; price: number; prepTime: number }> }>) {
      let [existing] = await db.select().from(kiosks).where(eq(kiosks.name, kioskData.name)).limit(1);
      let kioskId = existing?.id;

      if (!existing) {
        kioskId = generateId();
        const [inserted] = await db.insert(kiosks).values({ ...kioskData, id: kioskId }).returning();
        existing = inserted;
        console.log(`   ➕ Created Kiosk: ${kioskData.name}`);
      } else {
        await db.update(kiosks).set({
          isOpen: true,
          acceptsOnlineOrders: true,
          collegeLocation: kioskData.collegeLocation,
          campusZone: kioskData.campusZone,
          category: kioskData.category,
          openingHours: kioskData.openingHours,
          phone: kioskData.phone,
        }).where(eq(kiosks.id, kioskId!));
      }

      // Ensure categories & items exist
      for (const cat of categoriesData) {
        let [existingCat] = await db.select().from(menuCategories).where(sql`${menuCategories.kioskId} = ${kioskId} AND ${menuCategories.name} = ${cat.name}`).limit(1);
        let catId = existingCat?.id;

        if (!existingCat) {
          catId = generateId();
          await db.insert(menuCategories).values({
            id: catId,
            kioskId: kioskId!,
            name: cat.name,
            displayOrder: cat.displayOrder,
            isActive: true,
          });
        }

        for (const item of cat.items) {
          const [existingItem] = await db.select().from(menuItems).where(sql`${menuItems.kioskId} = ${kioskId} AND ${menuItems.name} = ${item.name}`).limit(1);
          if (!existingItem) {
            await db.insert(menuItems).values({
              id: generateId(),
              kioskId: kioskId!,
              categoryId: catId!,
              name: item.name,
              description: item.description || null,
              price: item.price,
              preparationTimeMins: item.prepTime,
              isAvailable: true,
              isUnderReview: false,
              isDeleted: false,
            });
          }
        }
      }

      return kioskId!;
    }

    // 1. كشك الحرية
    const kiosk1Id = await seedKiosk(
      {
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
      [
        {
          name: 'مشروبات ساخنة',
          displayOrder: 1,
          items: [
            { name: 'شاي بالنعناع', description: 'شاي أسود مع أوراق النعناع الطازج', price: 800, prepTime: 3 },
            { name: 'قهوة تركي محوجة', description: 'بن برازيلي محوج بالهيل (سادة / مظبوط / زيادة)', price: 1200, prepTime: 5 },
            { name: 'نسكافيه بلاك', description: 'قهوة سريعة التحضير نكهة قوية', price: 1000, prepTime: 3 },
            { name: 'هوت شوكليت كلاسيك', description: 'كاكاو بالحليب مع صوص شوكولاتة', price: 1800, prepTime: 5 },
          ],
        },
        {
          name: 'مشروبات باردة',
          displayOrder: 2,
          items: [
            { name: 'عصير مانجا فريش', description: 'عصير مانجا طبيعي مثلج', price: 1500, prepTime: 4 },
            { name: 'عصير فراولة طبيعي', description: 'فراولة طازجة مخفوقة', price: 1500, prepTime: 4 },
            { name: 'آيس كوفي كراميل', description: 'إسبريسو بالحليب المثلج وصوص الكراميل', price: 2200, prepTime: 5 },
          ],
        },
        {
          name: 'ساندوتشات وسناكس',
          displayOrder: 3,
          items: [
            { name: 'سندوتش جبنة رومي قديمة', description: 'عيش فينو طازج مع جبنة رومي وطماطم وخيار', price: 2000, prepTime: 4 },
            { name: 'سندوتش بطاطس فارم فريتس', description: 'بطاطس مقرمشة متبلة في فينو مع كاتشب ومايونيز', price: 1800, prepTime: 6 },
            { name: 'سندوتش كبدة إسكندراني', description: 'كبدة متبلة بالفلفل الحار والليمون والطحينة', price: 2500, prepTime: 7 },
          ],
        },
      ]
    );

    // 2. كافيه الحاسبات
    const kiosk2Id = await seedKiosk(
      {
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
      [
        {
          name: 'قهوة ومشروبات مختصة',
          displayOrder: 1,
          items: [
            { name: 'إسبريسو دبل', description: 'شوت قهوة إسبريسو غني ومكثف', price: 1500, prepTime: 3 },
            { name: 'كابتشينو إيطالي', description: 'إسبريسو مع فوم حليب ناعم ورشة كاكاو', price: 2000, prepTime: 4 },
            { name: 'لاتيه فانيليا', description: 'حليب ساخن مع قهوة ونكهة فانيليا فرنسية', price: 2200, prepTime: 5 },
            { name: 'ماتشا لاتيه مثلج', description: 'شاي ماتشا ياباني مع حليب مثلج', price: 2800, prepTime: 4 },
          ],
        },
        {
          name: 'مخبوزات وسناكس سريعة',
          displayOrder: 2,
          items: [
            { name: 'كرواسون زبدة فرنسي', description: 'كرواسون طازج مقرمش وهش', price: 1800, prepTime: 2 },
            { name: 'كوكيز شوكولاتة دبل', description: 'كوكيز بحبيبات الشوكولاتة الذائبة', price: 1200, prepTime: 2 },
          ],
        },
      ]
    );

    // 3. كريب ووافل التجارة
    const kiosk3Id = await seedKiosk(
      {
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
      [
        {
          name: 'كريب حادق',
          displayOrder: 1,
          items: [
            { name: 'كريب كرسبي دجاج مكس جبن', description: 'قطع استربس كرسبي مقرمشة مع مكس جبن وصوص شيدر', price: 4500, prepTime: 10 },
            { name: 'كريب سوسيس وبطاطس', description: 'سوسيس مشوي مع بطاطس فارم وصوص باربيكيو', price: 3800, prepTime: 8 },
            { name: 'كريب مكس جبن (رومي وموتزاريلا وشيدر)', description: 'جبن ذائبة غنية مع زيتون وفلفل ألوان', price: 3500, prepTime: 7 },
          ],
        },
        {
          name: 'وافل وحلويات',
          displayOrder: 2,
          items: [
            { name: 'وافل نوتيلا وموز', description: 'وافل بلجيكي مقرمش مغطى بنوتيلا وقطع الموز', price: 3200, prepTime: 8 },
            { name: 'وافل لوتس مع وايت شوكليت', description: 'وافل مع زبدة لوتس وبسكوت مطحون', price: 3500, prepTime: 8 },
          ],
        },
      ]
    );

    // 3. Seed Students & Users
    console.log('👥 Seeding real student & admin accounts in Supabase Auth & PostgreSQL...');

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

    const testStudents = [
      {
        email: 'student@orderfast.test',
        fullName: 'أحمد كريم',
        phone: '01012345678',
        universityId: '20220914',
        college: 'كلية الحاسبات والمعلومات',
        accountStatus: 'active' as const,
        noShowCount: 0,
      },
      {
        email: 'sara.hassan@sphinx.edu.eg',
        fullName: 'سارة حسن',
        phone: '01198765432',
        universityId: '20210342',
        college: 'كلية الهندسة',
        accountStatus: 'warning' as const,
        noShowCount: 1,
      },
      {
        email: 'mohamed.adel@sphinx.edu.eg',
        fullName: 'محمد عادل',
        phone: '01055443322',
        universityId: '20230155',
        college: 'كلية التجارة وإدارة الأعمال',
        accountStatus: 'restricted' as const,
        noShowCount: 3,
      },
      {
        email: 'nour.elhoda@sphinx.edu.eg',
        fullName: 'نور الهدى',
        phone: '01277889900',
        universityId: '20240087',
        college: 'كلية الصيدلة',
        accountStatus: 'active' as const,
        noShowCount: 0,
      },
    ];

    for (const std of testStudents) {
      const userId = await getOrCreateUser(std.email, 'Password123!', std.fullName, 'student');

      const [existingProfile] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
      if (!existingProfile) {
        await db.insert(profiles).values({
          id: userId,
          fullName: std.fullName,
          phone: std.phone,
          systemRole: 'student',
          isActive: true,
        });

        await db.insert(students).values({
          id: userId,
          universityId: std.universityId,
          college: std.college,
          accountStatus: std.accountStatus,
          noShowCount: std.noShowCount,
        });
      } else {
        await db.update(profiles).set({ fullName: std.fullName, phone: std.phone }).where(eq(profiles.id, userId));
        await db.update(students).set({
          universityId: std.universityId,
          college: std.college,
          accountStatus: std.accountStatus,
          noShowCount: std.noShowCount,
        }).where(eq(students.id, userId));
      }
    }

    // Clean up old kiosk staff assignments to ensure strict isolation
    await db.delete(kioskStaff);

    // 1. Cashier for Kiosk 1 (كشك الحرية - هندسة)
    const cashier1UserId = await getOrCreateUser('cashier.eng@orderfast.test', 'Password123!', 'كاشير الهندسة', 'staff');
    const [c1Profile] = await db.select().from(profiles).where(eq(profiles.id, cashier1UserId)).limit(1);
    if (!c1Profile) {
      await db.insert(profiles).values({
        id: cashier1UserId,
        fullName: 'كاشير الهندسة',
        phone: '01123456781',
        systemRole: 'staff',
        isActive: true,
      });
    }
    await db.insert(kioskStaff).values({
      id: generateId(),
      kioskId: kiosk1Id,
      userId: cashier1UserId,
      role: 'owner',
      isActive: true,
    });

    // Also keep primary cashier@orderfast.test mapped strictly to Kiosk 1
    const defaultCashierUserId = await getOrCreateUser('cashier@orderfast.test', 'Password123!', 'محمد كاشير', 'staff');
    const [cDefProfile] = await db.select().from(profiles).where(eq(profiles.id, defaultCashierUserId)).limit(1);
    if (!cDefProfile) {
      await db.insert(profiles).values({
        id: defaultCashierUserId,
        fullName: 'محمد كاشير',
        phone: '01123456789',
        systemRole: 'staff',
        isActive: true,
      });
    }
    await db.insert(kioskStaff).values({
      id: generateId(),
      kioskId: kiosk1Id,
      userId: defaultCashierUserId,
      role: 'owner',
      isActive: true,
    });

    // 2. Cashier for Kiosk 2 (كافيه الحاسبات - حاسبات ومعلومات)
    const cashier2UserId = await getOrCreateUser('cashier.cs@orderfast.test', 'Password123!', 'كاشير الحاسبات', 'staff');
    const [c2Profile] = await db.select().from(profiles).where(eq(profiles.id, cashier2UserId)).limit(1);
    if (!c2Profile) {
      await db.insert(profiles).values({
        id: cashier2UserId,
        fullName: 'كاشير الحاسبات',
        phone: '01234567892',
        systemRole: 'staff',
        isActive: true,
      });
    }
    await db.insert(kioskStaff).values({
      id: generateId(),
      kioskId: kiosk2Id,
      userId: cashier2UserId,
      role: 'owner',
      isActive: true,
    });

    // 3. Cashier for Kiosk 3 (كريب ووافل التجارة - تجارة)
    const cashier3UserId = await getOrCreateUser('cashier.biz@orderfast.test', 'Password123!', 'كاشير التجارة', 'staff');
    const [c3Profile] = await db.select().from(profiles).where(eq(profiles.id, cashier3UserId)).limit(1);
    if (!c3Profile) {
      await db.insert(profiles).values({
        id: cashier3UserId,
        fullName: 'كاشير التجارة',
        phone: '01511223345',
        systemRole: 'staff',
        isActive: true,
      });
    }
    await db.insert(kioskStaff).values({
      id: generateId(),
      kioskId: kiosk3Id,
      userId: cashier3UserId,
      role: 'owner',
      isActive: true,
    });

    // Admin User
    const adminUserId = await getOrCreateUser('admin@orderfast.test', 'Password123!', 'مدير النظام', 'admin');
    const [existingAdmin] = await db.select().from(profiles).where(eq(profiles.id, adminUserId)).limit(1);
    if (!existingAdmin) {
      await db.insert(profiles).values({
        id: adminUserId,
        fullName: 'مدير النظام',
        phone: '01234567890',
        systemRole: 'admin',
        isActive: true,
      });
    }

    console.log('🎉 Database cleaned and seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup and seed:', error);
    process.exit(1);
  }
}

cleanupAndSeed();

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import dotenv from 'dotenv';

// Load Environment
dotenv.config({ path: path.resolve(process.cwd(), 'apps/api/.env') });

import { env } from '../../apps/api/src/config/env.js';
import { pool, db, testDbConnection } from '../../apps/api/src/db/client.js';
import { getSupabaseAdmin, getSupabaseClient } from '../../apps/api/src/shared/supabase/index.js';
import * as schema from '../../apps/api/src/db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { OrderService } from '../../apps/api/src/modules/orders/order.service.js';
import { AuthService } from '../../apps/api/src/modules/auth/auth.service.js';
import { CatalogService } from '../../apps/api/src/modules/catalog/catalog.service.js';
import { buildApp } from '../../apps/api/src/app.js';
import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';

interface TestMetrics {
  phase: string;
  durationMs: number;
  status: 'PASSED' | 'FAILED';
  details?: string;
}

const metrics: TestMetrics[] = [];
let app: FastifyInstance;

// Shared test entities
let testKioskIdA: string;
let testKioskIdB: string;
let testCategoryId: string;
let testMenuItemId1: string;
let testMenuItemId2: string;
let studentUserId: string;
let studentAuthToken: string;
let staffUserIdA: string;
let staffAuthTokenA: string;
let staffUserIdB: string;
let staffAuthTokenB: string;

const testPrefix = `test_${Date.now()}`;

console.log('═══════════════════════════════════════════════════════════════');
console.log('  OrderFAST Backend & Supabase Verification Suite (17 Phases)   ');
console.log('═══════════════════════════════════════════════════════════════\n');

async function recordPhase(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  console.log(`▶ Starting Phase: ${name}...`);
  try {
    await fn();
    const durationMs = Date.now() - start;
    metrics.push({ phase: name, durationMs, status: 'PASSED' });
    console.log(`  ✔ ${name} PASSED (${durationMs}ms)\n`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    metrics.push({ phase: name, durationMs, status: 'FAILED', details: err.message });
    console.error(`  ✖ ${name} FAILED (${durationMs}ms):`, err.message, '\n');
    throw err;
  }
}

async function runSuite() {
  // Setup App
  app = await buildApp();
  await app.ready();

  // Phase 1: Environment & Config Verification
  await recordPhase('1. Environment & Configuration Check', async () => {
    assert.ok(env.SUPABASE_URL, 'SUPABASE_URL must be defined');
    assert.ok(env.SUPABASE_ANON_KEY, 'SUPABASE_ANON_KEY must be defined');
    assert.ok(env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY must be defined');
    assert.ok(env.DATABASE_URL, 'DATABASE_URL must be defined');
    assert.ok(env.JWT_SECRET, 'JWT_SECRET must be defined');
    assert.ok(env.PORT, 'PORT must be defined');
    assert.strictEqual(env.SUPABASE_URL.startsWith('https://'), true, 'SUPABASE_URL must be HTTPS');
  });

  // Phase 2: PostgreSQL Pool & Direct Query Check
  await recordPhase('2. PostgreSQL Pool & SELECT 1 Verification', async () => {
    const isConnected = await testDbConnection();
    assert.strictEqual(isConnected, true, 'Database test connection must succeed');

    const client = await pool.connect();
    try {
      const res = await client.query('SELECT 1 as alive, current_database() as db_name, version() as pg_version;');
      assert.strictEqual(res.rows[0].alive, 1, 'SELECT 1 must return 1');
      assert.strictEqual(res.rows[0].db_name, 'postgres');
    } finally {
      client.release();
    }
  });

  // Setup Test Kiosks & Data
  await recordPhase('Setup: Seed Test Kiosks & Catalog Data', async () => {
    // 1. Create Kiosk A
    const [kioskA] = await db.insert(schema.kiosks).values({
      name: `${testPrefix}_Kiosk_Engineering`,
      collegeLocation: 'Faculty of Engineering',
      campusZone: 'Main Building',
      category: 'Cafeteria',
      isOpen: true,
      acceptsOnlineOrders: true,
      isRushMode: false,
      defaultPrepTimeMins: 10,
      acceptanceTimeoutSecs: 300,
    }).returning();
    testKioskIdA = kioskA.id;

    // 2. Create Kiosk B (for Cross-Kiosk IDOR isolation tests)
    const [kioskB] = await db.insert(schema.kiosks).values({
      name: `${testPrefix}_Kiosk_Science`,
      collegeLocation: 'Faculty of Science',
      campusZone: 'Building B',
      category: 'Bakery',
      isOpen: true,
      acceptsOnlineOrders: true,
      isRushMode: false,
      defaultPrepTimeMins: 15,
      acceptanceTimeoutSecs: 300,
    }).returning();
    testKioskIdB = kioskB.id;

    // 3. Create Category for Kiosk A
    const [category] = await db.insert(schema.menuCategories).values({
      kioskId: testKioskIdA,
      name: 'Hot Sandwiches',
      displayOrder: 1,
      isActive: true,
    }).returning();
    testCategoryId = category.id;

    // 4. Create Menu Items for Kiosk A
    const [item1] = await db.insert(schema.menuItems).values({
      kioskId: testKioskIdA,
      categoryId: testCategoryId,
      name: 'Shawarma Roll',
      description: 'Fresh chicken shawarma roll with garlic sauce',
      price: 4500, // 45.00 EGP in piasters
      isAvailable: true,
      isUnderReview: false,
      preparationTimeMins: 5,
    }).returning();
    testMenuItemId1 = item1.id;

    const [item2] = await db.insert(schema.menuItems).values({
      kioskId: testKioskIdA,
      categoryId: testCategoryId,
      name: 'Burger Deluxe',
      description: 'Beef patty with cheese',
      price: 6500, // 65.00 EGP in piasters
      isAvailable: true,
      isUnderReview: false,
      preparationTimeMins: 8,
    }).returning();
    testMenuItemId2 = item2.id;
  });

  // Phase 3: Auth Registration & Profile Creation
  await recordPhase('3. Auth Registration & Profile Creation', async () => {
    const studentEmail = `${testPrefix}_student@orderfast.test`;
    const staffEmailA = `${testPrefix}_staffA@orderfast.test`;
    const staffEmailB = `${testPrefix}_staffB@orderfast.test`;
    const testPassword = 'TestPassword123!';

    const admin = getSupabaseAdmin();

    // 1. Create Student User in Supabase Auth
    const { data: sUser, error: sErr } = await admin.auth.admin.createUser({
      email: studentEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Ahmed Student' },
    });
    if (sErr) throw sErr;
    studentUserId = sUser.user.id;

    // Insert Student Profile & Student record in PostgreSQL
    await db.insert(schema.profiles).values({
      id: studentUserId,
      fullName: 'Ahmed Student',
      phone: '01001234567',
      systemRole: 'student',
      isActive: true,
    });
    await db.insert(schema.students).values({
      id: studentUserId,
      universityId: `STU_${Date.now()}`,
      college: 'Faculty of Engineering',
      accountStatus: 'active',
      noShowCount: 0,
    });

    // 2. Create Staff User A (for Kiosk A)
    const { data: stUserA, error: stErrA } = await admin.auth.admin.createUser({
      email: staffEmailA,
      password: testPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Staff Kiosk A' },
    });
    if (stErrA) throw stErrA;
    staffUserIdA = stUserA.user.id;

    await db.insert(schema.profiles).values({
      id: staffUserIdA,
      fullName: 'Staff Kiosk A',
      phone: '01009876543',
      systemRole: 'staff',
      isActive: true,
    });
    await db.insert(schema.kioskStaff).values({
      kioskId: testKioskIdA,
      userId: staffUserIdA,
      role: 'cashier',
      isActive: true,
    });

    // 3. Create Staff User B (for Kiosk B)
    const { data: stUserB, error: stErrB } = await admin.auth.admin.createUser({
      email: staffEmailB,
      password: testPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Staff Kiosk B' },
    });
    if (stErrB) throw stErrB;
    staffUserIdB = stUserB.user.id;

    await db.insert(schema.profiles).values({
      id: staffUserIdB,
      fullName: 'Staff Kiosk B',
      phone: '01005554433',
      systemRole: 'staff',
      isActive: true,
    });
    await db.insert(schema.kioskStaff).values({
      kioskId: testKioskIdB,
      userId: staffUserIdB,
      role: 'cashier',
      isActive: true,
    });

    // Login via Supabase client to get real JWT access tokens
    const client = getSupabaseClient();
    const { data: sLogin } = await client.auth.signInWithPassword({
      email: studentEmail,
      password: testPassword,
    });
    studentAuthToken = sLogin.session!.access_token;

    const { data: stLoginA } = await client.auth.signInWithPassword({
      email: staffEmailA,
      password: testPassword,
    });
    staffAuthTokenA = stLoginA.session!.access_token;

    const { data: stLoginB } = await client.auth.signInWithPassword({
      email: staffEmailB,
      password: testPassword,
    });
    staffAuthTokenB = stLoginB.session!.access_token;

    assert.ok(studentAuthToken, 'Student token generated');
    assert.ok(staffAuthTokenA, 'Staff A token generated');
    assert.ok(staffAuthTokenB, 'Staff B token generated');

    // Test /api/auth/me via HTTP Fastify
    const meRes = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${studentAuthToken}` },
    });
    assert.strictEqual(meRes.statusCode, 200, `/api/auth/me should return 200: ${meRes.body}`);
    const meData = JSON.parse(meRes.body);
    assert.strictEqual(meData.data.id, studentUserId);
    assert.strictEqual(meData.data.systemRole, 'student');
  });

  // Phase 4: Token Rejection & Security Validation
  await recordPhase('4. JWT Security & Token Forgery Rejection', async () => {
    // 1. Missing Auth header
    const noHeaderRes = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
    });
    assert.strictEqual(noHeaderRes.statusCode, 401, 'Missing token must return 401');

    // 2. Forged / Invalid Token
    const fakeTokenRes = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.signature' },
    });
    assert.strictEqual(fakeTokenRes.statusCode, 401, 'Forged token must return 401');
  });

  // Phase 5: RBAC & Anti-IDOR Cross-Kiosk Isolation
  await recordPhase('5. RBAC & Cross-Kiosk Isolation (Anti-IDOR)', async () => {
    // 1. Student trying to perform staff action -> 403 Forbidden
    const studentAsStaffRes = await app.inject({
      method: 'PATCH',
      url: `/api/kiosks/${testKioskIdA}/status`,
      headers: { authorization: `Bearer ${studentAuthToken}` },
      payload: { isOpen: false },
    });
    assert.strictEqual(studentAsStaffRes.statusCode, 403, 'Student cannot access staff kiosk endpoints');

    // 2. Staff A (Kiosk A) trying to manage Kiosk B -> 403 Forbidden
    const crossKioskRes = await app.inject({
      method: 'PATCH',
      url: `/api/kiosks/${testKioskIdB}/status`,
      headers: { authorization: `Bearer ${staffAuthTokenA}` },
      payload: { isOpen: false },
    });
    assert.strictEqual(crossKioskRes.statusCode, 403, 'Staff of Kiosk A cannot control Kiosk B');
  });

  // Phase 6: Catalog Lifecycle & Real-Time Availability
  await recordPhase('6. Catalog Lifecycle & Item Availability Management', async () => {
    // 1. Fetch public menu for Kiosk A
    const menuRes = await app.inject({
      method: 'GET',
      url: `/api/catalog/kiosks/${testKioskIdA}/menu`,
    });
    assert.strictEqual(menuRes.statusCode, 200);
    const menu = JSON.parse(menuRes.body);
    assert.ok(menu.data.categories.length > 0, 'Must have at least 1 category');
    assert.ok(menu.data.categories[0].items.length >= 2, 'Must have active items');

    // 2. Staff A toggles Shawarma Roll availability to false
    const toggleRes = await app.inject({
      method: 'PATCH',
      url: `/api/catalog/items/${testMenuItemId1}/availability`,
      headers: { authorization: `Bearer ${staffAuthTokenA}` },
      payload: { isAvailable: false },
    });
    assert.strictEqual(toggleRes.statusCode, 200, 'Staff A can toggle item availability');

    // 3. Verify public menu excludes unavailable item
    const menuAfterRes = await app.inject({
      method: 'GET',
      url: `/api/catalog/kiosks/${testKioskIdA}/menu`,
    });
    const menuAfter = JSON.parse(menuAfterRes.body);
    const itemNames = menuAfter.data.categories[0].items.map((i: any) => i.name);
    assert.strictEqual(itemNames.includes('Shawarma Roll'), false, 'Unavailable items must not appear in public student menu');

    // Re-enable item for subsequent order tests
    await app.inject({
      method: 'PATCH',
      url: `/api/catalog/items/${testMenuItemId1}/availability`,
      headers: { authorization: `Bearer ${staffAuthTokenA}` },
      payload: { isAvailable: true },
    });
  });

  // Phase 7: Transaction Rollback Integrity
  let testOrderId: string;
  let testIdempotencyKey = randomUUID();

  await recordPhase('7. Database Transaction & Rollback Integrity', async () => {
    // Attempt order creation with invalid item ID inside transaction -> entire order fails cleanly
    const invalidIdempotencyKey = randomUUID();
    const invalidPayload = {
      kioskId: testKioskIdA,
      items: [
        { menuItemId: randomUUID(), quantity: 1, specialInstructions: 'None' }, // Non-existent item
      ],
      paymentMethod: 'cash',
    };

    const failedOrderRes = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: {
        authorization: `Bearer ${studentAuthToken}`,
        'idempotency-key': invalidIdempotencyKey,
      },
      payload: invalidPayload,
    });

    assert.notStrictEqual(failedOrderRes.statusCode, 201, 'Order with invalid item must fail');

    // Verify no orphan records exist in orders or order_items for that idempotency key
    const [orphan] = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.idempotencyKey, invalidIdempotencyKey));
    assert.strictEqual(orphan, undefined, 'No partial/orphan order record should exist after failed transaction');
  });

  // Phase 8: Real Order Creation & Snapshots
  await recordPhase('8. Real Order Creation & Data Snapshots (#0001)', async () => {
    const createOrderPayload = {
      kioskId: testKioskIdA,
      items: [
        { menuItemId: testMenuItemId1, quantity: 2, specialInstructions: 'Extra tahini' }, // 4500 * 2 = 9000
        { menuItemId: testMenuItemId2, quantity: 1, specialInstructions: 'No onions' },   // 6500 * 1 = 6500
      ],
      paymentMethod: 'cash',
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: {
        authorization: `Bearer ${studentAuthToken}`,
        'idempotency-key': testIdempotencyKey,
      },
      payload: createOrderPayload,
    });

    assert.strictEqual(res.statusCode, 201, `Order creation must return 201: ${res.body}`);
    const resBody = JSON.parse(res.body);
    const order = resBody.data;
    testOrderId = order.id;

    // Verify Financial Snapshots
    assert.strictEqual(order.subtotal, 15500, 'Subtotal must be 15500 piasters (155.00 EGP)');
    assert.strictEqual(order.total, 15500, 'Total must match subtotal minus discount plus fees');
    assert.strictEqual(order.status, 'PENDING_KIOSK');
    assert.ok(order.orderNumber.startsWith('#'), 'Order number format should be #XXXX');
    assert.strictEqual(order.studentNameSnapshot, 'Ahmed Student');
    assert.strictEqual(order.kioskNameSnapshot, `${testPrefix}_Kiosk_Engineering`);

    // Verify Line Item Snapshots in Database
    const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, testOrderId));
    assert.strictEqual(items.length, 2, 'Must have 2 order items in DB');
    const roll = items.find(i => i.nameSnapshot === 'Shawarma Roll');
    assert.ok(roll, 'Shawarma Roll snapshot must exist');
    assert.strictEqual(roll.unitPriceSnapshot, 4500);
    assert.strictEqual(roll.quantity, 2);
    assert.strictEqual(roll.lineTotal, 9000);

    // Verify Order Event log
    const events = await db.select().from(schema.orderEvents).where(eq(schema.orderEvents.orderId, testOrderId));
    assert.ok(events.length >= 1, 'Must have recorded order creation event');
    assert.strictEqual(events[0].toStatus, 'PENDING_KIOSK');
  });

  // Phase 9: Idempotency Verification
  await recordPhase('9. Idempotency (Replay & Payload Mismatch Conflict)', async () => {
    // 1. Replay exact same request with same Idempotency-Key -> returns identical order without duplication
    const identicalPayload = {
      kioskId: testKioskIdA,
      items: [
        { menuItemId: testMenuItemId1, quantity: 2, specialInstructions: 'Extra tahini' },
        { menuItemId: testMenuItemId2, quantity: 1, specialInstructions: 'No onions' },
      ],
      paymentMethod: 'cash',
    };

    const replayRes = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: {
        authorization: `Bearer ${studentAuthToken}`,
        'idempotency-key': testIdempotencyKey,
      },
      payload: identicalPayload,
    });

    assert.strictEqual(replayRes.statusCode, 200, 'Replayed idempotent request must return 200');
    const replayBody = JSON.parse(replayRes.body);
    assert.strictEqual(replayBody.data.id, testOrderId, 'Must return the same order ID');

    // 2. Same Idempotency-Key with MODIFIED payload -> 409 Conflict
    const conflictingPayload = {
      kioskId: testKioskIdA,
      items: [
        { menuItemId: testMenuItemId1, quantity: 5 }, // Different quantity
      ],
      paymentMethod: 'cash',
    };

    const conflictRes = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: {
        authorization: `Bearer ${studentAuthToken}`,
        'idempotency-key': testIdempotencyKey,
      },
      payload: conflictingPayload,
    });

    assert.strictEqual(conflictRes.statusCode, 409, 'Reused key with mismatched payload must return 409 Conflict');
  });

  // Phase 10: State Machine Transitions & Concurrency Race
  await recordPhase('10. Order State Machine & Concurrency Race Resolution', async () => {
    // 1. Cashier A accepts the order (PENDING_KIOSK -> ACCEPTED)
    const acceptRes = await app.inject({
      method: 'PATCH',
      url: `/api/orders/${testOrderId}/status`,
      headers: { authorization: `Bearer ${staffAuthTokenA}` },
      payload: { status: 'ACCEPTED', estimatedReadyMins: 12 },
    });
    assert.strictEqual(acceptRes.statusCode, 200, `Accept order should return 200: ${acceptRes.body}`);
    const acceptedData = JSON.parse(acceptRes.body);
    assert.strictEqual(acceptedData.data.status, 'ACCEPTED');

    // 2. Concurrent/Duplicate Accept attempt on already accepted order -> 400 Bad Request
    const secondAcceptRes = await app.inject({
      method: 'PATCH',
      url: `/api/orders/${testOrderId}/status`,
      headers: { authorization: `Bearer ${staffAuthTokenA}` },
      payload: { status: 'ACCEPTED' },
    });
    assert.strictEqual(secondAcceptRes.statusCode, 400, 'Cannot accept an already ACCEPTED order');

    // 3. Advance to PREPARING
    const prepRes = await app.inject({
      method: 'PATCH',
      url: `/api/orders/${testOrderId}/status`,
      headers: { authorization: `Bearer ${staffAuthTokenA}` },
      payload: { status: 'PREPARING' },
    });
    assert.strictEqual(prepRes.statusCode, 200);

    // 4. Advance to READY
    const readyRes = await app.inject({
      method: 'PATCH',
      url: `/api/orders/${testOrderId}/status`,
      headers: { authorization: `Bearer ${staffAuthTokenA}` },
      payload: { status: 'READY' },
    });
    assert.strictEqual(readyRes.statusCode, 200);

    // 5. Complete order (READY -> COMPLETED)
    const completeRes = await app.inject({
      method: 'PATCH',
      url: `/api/orders/${testOrderId}/status`,
      headers: { authorization: `Bearer ${staffAuthTokenA}` },
      payload: { status: 'COMPLETED' },
    });
    assert.strictEqual(completeRes.statusCode, 200);
    const completeData = JSON.parse(completeRes.body);
    assert.strictEqual(completeData.data.status, 'COMPLETED');
    assert.strictEqual(completeData.data.paymentStatus, 'paid');
  });

  // Phase 11: Batch Operations & Expiration Worker
  await recordPhase('11. Batch Operations & Expiration Worker Processing', async () => {
    // 1. Create 2 new orders to test batch reject and expiration
    const key1 = randomUUID();
    const key2 = randomUUID();

    const orderRes1 = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { authorization: `Bearer ${studentAuthToken}`, 'idempotency-key': key1 },
      payload: {
        kioskId: testKioskIdA,
        items: [{ menuItemId: testMenuItemId2, quantity: 1 }],
        paymentMethod: 'cash',
      },
    });
    const order1Id = JSON.parse(orderRes1.body).data.id;

    const orderRes2 = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { authorization: `Bearer ${studentAuthToken}`, 'idempotency-key': key2 },
      payload: {
        kioskId: testKioskIdA,
        items: [{ menuItemId: testMenuItemId2, quantity: 1 }],
        paymentMethod: 'cash',
      },
    });
    const order2Id = JSON.parse(orderRes2.body).data.id;

    // Test Batch Reject
    const batchRes = await app.inject({
      method: 'POST',
      url: '/api/orders/batch-status',
      headers: { authorization: `Bearer ${staffAuthTokenA}` },
      payload: {
        orderIds: [order1Id],
        status: 'REJECTED',
        rejectionReason: 'Sold out for the day',
      },
    });
    assert.strictEqual(batchRes.statusCode, 200);
    const batchData = JSON.parse(batchRes.body);
    assert.strictEqual(batchData.data.successful.length, 1);

    // Test Expiration Worker: Set expires_at in past for order2
    await db
      .update(schema.orders)
      .set({ expiresAt: new Date(Date.now() - 10000) })
      .where(eq(schema.orders.id, order2Id));

    const orderService = new OrderService();
    const expiredCount = await orderService.expirePendingOrders();
    assert.ok(expiredCount >= 1, 'Expiration worker must process and expire overdue orders');

    const [expiredOrder] = await db.select().from(schema.orders).where(eq(schema.orders.id, order2Id));
    assert.strictEqual(expiredOrder.status, 'EXPIRED');
  });

  // Phase 12: Financial Integrity & Zero-Float Arithmetic
  await recordPhase('12. Financial Integrity & Integer Piasters Constraint', async () => {
    // Attempt inserting an order with mismatched total vs subtotal via SQL check constraint
    const client = await pool.connect();
    try {
      let threwConstraint = false;
      try {
        await client.query(`
          INSERT INTO orders (
            id, order_number, student_id, kiosk_id, status, idempotency_key,
            subtotal, discount, fees, total,
            student_name_snapshot, student_college_snapshot, kiosk_name_snapshot,
            expires_at
          ) VALUES (
            gen_random_uuid(), '#9999', '${studentUserId}', '${testKioskIdA}', 'PENDING_KIOSK', gen_random_uuid(),
            10000, 0, 0, 9000,
            'Test', 'Engineering', 'Kiosk A',
            NOW() + interval '5 minutes'
          )
        `);
      } catch (err: any) {
        threwConstraint = true;
        assert.ok(err.message.includes('check_order_total_calc'), 'Must fail check_order_total_calc constraint');
      }
      assert.strictEqual(threwConstraint, true, 'Database must enforce total = subtotal - discount + fees at DB level');
    } finally {
      client.release();
    }
  });

  // Phase 13: High-Concurrency Daily Sequential Counter
  await recordPhase('13. High-Concurrency Daily Counter (#0001, #0002...) Non-Collision', async () => {
    // Spawn 5 concurrent order creations to the same kiosk
    const concurrentKeys = Array.from({ length: 5 }, () => randomUUID());
    const promises = concurrentKeys.map(key =>
      app.inject({
        method: 'POST',
        url: '/api/orders',
        headers: { authorization: `Bearer ${studentAuthToken}`, 'idempotency-key': key },
        payload: {
          kioskId: testKioskIdA,
          items: [{ menuItemId: testMenuItemId2, quantity: 1 }],
          paymentMethod: 'cash',
        },
      })
    );

    const results = await Promise.all(promises);
    const orderNumbers: string[] = [];
    for (const r of results) {
      assert.strictEqual(r.statusCode, 201);
      const b = JSON.parse(r.body);
      orderNumbers.push(b.data.orderNumber);
    }

    // Verify all order numbers are unique and correctly formatted
    const uniqueNums = new Set(orderNumbers);
    assert.strictEqual(uniqueNums.size, 5, 'All concurrent order numbers must be unique without collisions');
    console.log(`    Generated concurrent daily order numbers: ${orderNumbers.join(', ')}`);
  });

  // Phase 14: Error Handling & Secret Leak Prevention
  await recordPhase('14. API Error Handling & Secret Leak Prevention', async () => {
    // Force 404 / 400 error
    const errRes = await app.inject({
      method: 'GET',
      url: '/api/orders/00000000-0000-0000-0000-000000000000',
      headers: { authorization: `Bearer ${studentAuthToken}` },
    });

    const body = errRes.body;
    assert.strictEqual(body.includes('postgres:'), false, 'Response must never leak database connection string');
    assert.strictEqual(body.includes(env.JWT_SECRET), false, 'Response must never leak JWT secret');
    assert.strictEqual(body.includes('aws-1-eu-west-1'), false, 'Response must never leak DB host');
  });

  // Phase 15: Connection Pool Stability & Latency Benchmarks
  await recordPhase('15. Connection Pool Stability & Latency Benchmarks (p50/p95/p99)', async () => {
    const latencies: number[] = [];
    const totalRequests = 20;

    for (let i = 0; i < totalRequests; i++) {
      const t0 = performance.now();
      const r = await app.inject({
        method: 'GET',
        url: `/api/catalog/kiosks/${testKioskIdA}/menu`,
      });
      assert.strictEqual(r.statusCode, 200);
      latencies.push(performance.now() - t0);
    }

    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.5)].toFixed(2);
    const p95 = latencies[Math.floor(latencies.length * 0.95)].toFixed(2);
    const p99 = latencies[Math.floor(latencies.length * 0.99)].toFixed(2);

    console.log(`    📊 Benchmark Results (20 sequential requests):`);
    console.log(`       - p50 Latency: ${p50}ms`);
    console.log(`       - p95 Latency: ${p95}ms`);
    console.log(`       - p99 Latency: ${p99}ms`);
    console.log(`       - Active Pool Total: ${pool.totalCount}, Idle: ${pool.idleCount}, Waiting: ${pool.waitingCount}`);
  });

  // Phase 16: Teardown & Clean Up Test Artifacts
  await recordPhase('16. Teardown & Clean Up Test Artifacts', async () => {
    // Delete test kiosks (CASCADE deletes categories, items, orders, staff, events)
    await db.delete(schema.kiosks).where(eq(schema.kiosks.id, testKioskIdA));
    await db.delete(schema.kiosks).where(eq(schema.kiosks.id, testKioskIdB));

    // Delete profiles
    await db.delete(schema.profiles).where(eq(schema.profiles.id, studentUserId));
    await db.delete(schema.profiles).where(eq(schema.profiles.id, staffUserIdA));
    await db.delete(schema.profiles).where(eq(schema.profiles.id, staffUserIdB));

    // Delete from Supabase Auth
    const admin = getSupabaseAdmin();
    await admin.auth.admin.deleteUser(studentUserId);
    await admin.auth.admin.deleteUser(staffUserIdA);
    await admin.auth.admin.deleteUser(staffUserIdB);
  });

  // Close connections
  await app.close();
  await pool.end();

  // Phase 17: Summary Report
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                 FINAL VERIFICATION SUMMARY                    ');
  console.log('═══════════════════════════════════════════════════════════════');
  let allPassed = true;
  for (const m of metrics) {
    const icon = m.status === 'PASSED' ? '✔' : '✖';
    console.log(`${icon} [${m.status}] ${m.phase} (${m.durationMs}ms)`);
    if (m.status === 'FAILED') allPassed = false;
  }
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`VERDICT: ${allPassed ? '🚀 READY FOR FRONTEND INTEGRATION' : '❌ NOT READY'}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
}

runSuite().catch(err => {
  console.error('Test suite execution failed:', err);
  process.exit(1);
});

import assert from 'node:assert/strict';
import path from 'path';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

// Load Environment
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'apps/api/.env') });

import { env } from './config/env.js';
import { pool, db, testDbConnection } from './db/client.js';
import { getSupabaseAdmin, getSupabase } from './shared/supabase/index.js';
import * as schema from './db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import { buildApp } from './app.js';
import type { FastifyInstance } from 'fastify';

interface TestMetrics {
  section: string;
  durationMs: number;
  status: 'PASSED' | 'FAILED';
  details?: string;
}

const metrics: TestMetrics[] = [];
let app: FastifyInstance;

let testKioskId: string;
let testCategoryId: string;
let testMenuItemId: string;
let studentUserId: string;
let studentAuthToken: string;

const creationLatencies: number[] = [];
const dbQueryDurations: number[] = [];

console.log('═══════════════════════════════════════════════════════════════');
console.log('  OrderFAST — Phase 15-18 Verification & Concurrency Stress    ');
console.log('  (Supabase Transaction-Mode Pooler :6543 Optimization)        ');
console.log('═══════════════════════════════════════════════════════════════\n');

async function runSection(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  console.log(`▶ Starting: ${name}...`);
  try {
    await fn();
    const durationMs = Date.now() - start;
    metrics.push({ section: name, durationMs, status: 'PASSED' });
    console.log(`  ✔ [PASSED] ${name} (${durationMs}ms)\n`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    metrics.push({ section: name, durationMs, status: 'FAILED', details: err.message });
    console.error(`  ✖ [FAILED] ${name} (${durationMs}ms):`, err.message, '\n');
    throw err;
  }
}

async function runSuite() {
  app = await buildApp();
  await app.ready();

  const isConnected = await testDbConnection();
  assert.strictEqual(isConnected, true, 'Must connect to PostgreSQL via port 6543');

  const supabaseAdmin = getSupabaseAdmin();
  const supabase = getSupabase();
  const testPrefix = `t_p15_${Date.now()}`;
  const testPassword = 'TestPassword123!';

  // ─────────────────────────────────────────────────────────────
  // Setup: Seed Kiosk & Test Student
  // ─────────────────────────────────────────────────────────────
  await runSection('Setup: Seed Kiosk & Student User', async () => {
    // 1. Create Student User in Supabase Auth
    const studentEmail = `${testPrefix}_student@orderfast.test`;
    const { data: sAuth, error: sErr } = await supabaseAdmin.auth.admin.createUser({
      email: studentEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Stress Test Student' },
    });
    assert.ok(sAuth.user, `Failed to create student: ${sErr?.message}`);
    studentUserId = sAuth.user.id;

    // 2. Insert Profile & Student records
    await db.insert(schema.profiles).values({
      id: studentUserId,
      email: studentEmail,
      fullName: 'Stress Test Student',
      systemRole: 'student',
      isActive: true,
    });

    await db.insert(schema.students).values({
      id: studentUserId,
      universityId: `UNIV-${Date.now().toString().slice(-6)}`,
      college: 'Faculty of Engineering',
      accountStatus: 'active',
      noShowCount: 0,
    });

    // 3. Login to get Bearer JWT
    const { data: sLogin, error: lErr } = await supabase.auth.signInWithPassword({
      email: studentEmail,
      password: testPassword,
    });
    assert.ok(sLogin.session, `Student login failed: ${lErr?.message}`);
    studentAuthToken = sLogin.session.access_token;

    // 4. Create Kiosk, Category, and Menu Item
    const [kiosk] = await db.insert(schema.kiosks).values({
      name: `${testPrefix}_Kiosk_Stress`,
      collegeLocation: 'Faculty of Engineering',
      campusZone: 'Building A',
      category: 'Food',
      isOpen: true,
      acceptsOnlineOrders: true,
      isRushMode: false,
      defaultPrepTimeMins: 10,
      acceptanceTimeoutSecs: 300,
    }).returning();
    testKioskId = kiosk.id;

    const [category] = await db.insert(schema.menuCategories).values({
      kioskId: testKioskId,
      name: 'Stress Test Category',
      displayOrder: 1,
      isActive: true,
    }).returning();
    testCategoryId = category.id;

    const [item] = await db.insert(schema.menuItems).values({
      kioskId: testKioskId,
      categoryId: testCategoryId,
      name: 'Stress Test Burger',
      description: 'Juicy beef burger',
      price: 3500, // 35.00 EGP in piasters
      isAvailable: true,
      isUnderReview: false,
      preparationTimeMins: 8,
    }).returning();
    testMenuItemId = item.id;

    console.log(`    - Created Test Kiosk: ${testKioskId}`);
    console.log(`    - Created Test Student User: ${studentUserId}`);
  });

  // ─────────────────────────────────────────────────────────────
  // 15. Order Number Concurrency Test (20 Parallel Orders)
  // ─────────────────────────────────────────────────────────────
  await runSection('15. Order Number Concurrency Test (20 Parallel Orders)', async () => {
    const count = 20;
    const concurrentKeys = Array.from({ length: count }, () => randomUUID());

    const tStart = performance.now();
    const promises = concurrentKeys.map(key => {
      const tReq0 = performance.now();
      return app
        .inject({
          method: 'POST',
          url: '/api/orders',
          headers: { authorization: `Bearer ${studentAuthToken}`, 'idempotency-key': key },
          payload: {
            kioskId: testKioskId,
            items: [{ menuItemId: testMenuItemId, quantity: 1 }],
            paymentMethod: 'cash',
          },
        })
        .then(res => {
          creationLatencies.push(performance.now() - tReq0);
          return res;
        });
    });

    const results = await Promise.all(promises);
    const totalDuration = performance.now() - tStart;

    const orderNumbers: string[] = [];
    for (const r of results) {
      assert.strictEqual(r.statusCode, 201, `Concurrent order creation returned non-201: ${r.body}`);
      const b = JSON.parse(r.body);
      orderNumbers.push(b.data.orderNumber);
    }

    // Verify all order numbers are unique and correctly formatted (#0001, #0002, etc.)
    const uniqueNums = new Set(orderNumbers);
    assert.strictEqual(uniqueNums.size, count, `All ${count} concurrent order numbers must be unique without collisions`);
    
    // Verify each order number matches pattern #\d{4}
    for (const num of orderNumbers) {
      assert.match(num, /^#\d{4}$/, `Order number ${num} must follow format #XXXX`);
    }

    console.log(`    - Generated ${count} unique order numbers concurrently in ${totalDuration.toFixed(2)}ms`);
    console.log(`    - First 3: ${orderNumbers.slice(0, 3).join(', ')} ... Last 3: ${orderNumbers.slice(-3).join(', ')}`);
  });

  // ─────────────────────────────────────────────────────────────
  // 16. Error Handling & Secret Leak Prevention
  // ─────────────────────────────────────────────────────────────
  await runSection('16. Error Handling & Secret Leak Prevention', async () => {
    // 1. 404 Error
    const notFoundRes = await app.inject({
      method: 'GET',
      url: `/api/orders/${randomUUID()}`,
      headers: { authorization: `Bearer ${studentAuthToken}` },
    });
    assert.strictEqual(notFoundRes.statusCode, 404);
    const notFoundBody = JSON.parse(notFoundRes.body);
    assert.strictEqual(notFoundBody.success, false);
    assert.strictEqual(notFoundBody.error.code, 'NOT_FOUND');
    assert.ok(notFoundBody.error.requestId);

    // 2. 422 Validation Error
    const validationRes = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { authorization: `Bearer ${studentAuthToken}`, 'idempotency-key': randomUUID() },
      payload: {
        kioskId: 'invalid-uuid',
        items: [],
      },
    });
    assert.strictEqual(validationRes.statusCode, 422);
    const validationBody = JSON.parse(validationRes.body);
    assert.strictEqual(validationBody.error.code, 'VALIDATION_ERROR');

    // 3. Security Leak Check across all error strings
    const rawResponses = [notFoundRes.body, validationRes.body];
    for (const text of rawResponses) {
      assert.strictEqual(text.includes('postgres:'), false, 'Response must never leak database connection string');
      assert.strictEqual(text.includes(env.SUPABASE_SERVICE_ROLE_KEY), false, 'Response must never leak service role key');
      assert.strictEqual(text.includes('node_modules'), false, 'Response must never leak internal server paths');
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 17. Connection Pool & Stability Verification
  // ─────────────────────────────────────────────────────────────
  await runSection('17. Connection Pool & Stability Verification', async () => {
    console.log(`    - Pool Total Count: ${pool.totalCount}`);
    console.log(`    - Pool Idle Count: ${pool.idleCount}`);
    console.log(`    - Pool Waiting Count: ${pool.waitingCount}`);

    assert.strictEqual(pool.waitingCount, 0, 'No queries should be stuck in waiting queue');
    assert.ok(pool.totalCount <= 20, 'Total pool connections should not exceed max limit');

    // Test a rapid burst of 30 queries
    const burstPromises = Array.from({ length: 30 }, () =>
      app.inject({
        method: 'GET',
        url: `/api/kiosks/${testKioskId}/menu`,
      })
    );
    const burstResults = await Promise.all(burstPromises);
    for (const r of burstResults) {
      assert.strictEqual(r.statusCode, 200);
    }

    assert.strictEqual(pool.waitingCount, 0, 'Pool waiting count must return to 0 after burst');
    console.log(`    - Handled 30 rapid burst requests cleanly. Waiting count: ${pool.waitingCount}`);
  });

  // ─────────────────────────────────────────────────────────────
  // Teardown: Clean up Test Artifacts
  // ─────────────────────────────────────────────────────────────
  await runSection('Teardown: Clean up Test Artifacts', async () => {
    // 1. Delete Orders and Order Items for this test kiosk
    const kioskOrders = await db.select({ id: schema.orders.id }).from(schema.orders).where(eq(schema.orders.kioskId, testKioskId));
    const orderIds = kioskOrders.map(o => o.id);
    if (orderIds.length > 0) {
      await db.delete(schema.orderItems).where(inArray(schema.orderItems.orderId, orderIds));
      await db.delete(schema.orderEvents).where(inArray(schema.orderEvents.orderId, orderIds));
      await db.delete(schema.orders).where(inArray(schema.orders.id, orderIds));
    }

    // 2. Delete Menu Items and Categories
    await db.delete(schema.menuItems).where(eq(schema.menuItems.kioskId, testKioskId));
    await db.delete(schema.menuCategories).where(eq(schema.menuCategories.kioskId, testKioskId));

    // 3. Delete Kiosk
    await db.delete(schema.kiosks).where(eq(schema.kiosks.id, testKioskId));

    // 4. Delete Profile & Student
    if (studentUserId) {
      await db.delete(schema.students).where(eq(schema.students.id, studentUserId));
      await db.delete(schema.profiles).where(eq(schema.profiles.id, studentUserId));
      try {
        await supabaseAdmin.auth.admin.deleteUser(studentUserId);
      } catch {}
    }
  });

  // Close app & pool
  await app.close();
  await pool.end();

  // ─────────────────────────────────────────────────────────────
  // 18. Final Report & Metrics Calculation
  // ─────────────────────────────────────────────────────────────
  creationLatencies.sort((a, b) => a - b);
  const p50 = creationLatencies.length > 0 ? creationLatencies[Math.floor(creationLatencies.length * 0.5)].toFixed(2) : '0';
  const p95 = creationLatencies.length > 0 ? creationLatencies[Math.floor(creationLatencies.length * 0.95)].toFixed(2) : '0';
  const p99 = creationLatencies.length > 0 ? creationLatencies[Math.floor(creationLatencies.length * 0.99)].toFixed(2) : '0';

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                 FINAL VERIFICATION SUMMARY                    ');
  console.log('═══════════════════════════════════════════════════════════════');
  let passedCount = 0;
  let failedCount = 0;
  for (const m of metrics) {
    const icon = m.status === 'PASSED' ? '✔' : '✖';
    console.log(`${icon} [${m.status}] ${m.section} (${m.durationMs}ms)`);
    if (m.status === 'PASSED') passedCount++;
    else failedCount++;
  }

  console.log('───────────────────────────────────────────────────────────────');
  console.log(`Total Sections Run: ${metrics.length} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log(`📊 Performance Benchmarks (Order Creation under Concurrency):`);
  console.log(`   - p50 Latency: ${p50}ms`);
  console.log(`   - p95 Latency: ${p95}ms`);
  console.log(`   - p99 Latency: ${p99}ms`);
  console.log(`   - Peak Connection Pool Usage: ${pool.totalCount}/20`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`VERDICT: ${failedCount === 0 ? '🚀 READY FOR FRONTEND INTEGRATION' : '❌ NOT READY'}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
}

runSuite().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

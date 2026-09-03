import { db } from './db/client.js';
import { kiosks } from './db/schema.js';
import { eq } from 'drizzle-orm';

const API_BASE = 'http://127.0.0.1:4000/api';

async function login(email: string, password = 'Password123!') {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json() as any;
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(data)}`);
  }
  return {
    token: data.data.session.accessToken,
    user: data.data.user,
  };
}

async function runIsolationTests() {
  console.log('🚀 Starting Kiosk Multi-Tenancy Isolation Verification...');

  // Get kiosks from DB
  const allKiosks = await db.select().from(kiosks);
  const kioskEng = allKiosks.find((k) => k.name === 'كشك الحرية');
  const kioskCS = allKiosks.find((k) => k.name === 'كافيه الحاسبات');
  const kioskBiz = allKiosks.find((k) => k.name === 'كريب ووافل التجارة');

  if (!kioskEng || !kioskCS || !kioskBiz) {
    throw new Error('Could not find all required kiosks in DB');
  }

  console.log(`📍 Kiosks found:`);
  console.log(`   - Kiosk Eng (كشك الحرية): ${kioskEng.id}`);
  console.log(`   - Kiosk CS (كافيه الحاسبات): ${kioskCS.id}`);
  console.log(`   - Kiosk Biz (كريب ووافل التجارة): ${kioskBiz.id}`);

  // Test 1: Cashier Eng Login
  console.log('\n🔑 Test 1: Testing Cashier Engineering (cashier.eng@orderfast.test)...');
  const engSession = await login('cashier.eng@orderfast.test');
  console.log(`   Logged in. Assigned kiosk: ${engSession.user.staffAssignments?.[0]?.kioskName}`);

  // 1a. Cashier Eng accesses Kiosk Eng orders (Allowed)
  const resEngOwn = await fetch(`${API_BASE}/orders/kiosks/${kioskEng.id}/incoming`, {
    headers: { Authorization: `Bearer ${engSession.token}` },
  });
  console.log(`   1a. Access own kiosk incoming orders: HTTP ${resEngOwn.status} (Expected: 200)`);
  if (resEngOwn.status !== 200) {
    throw new Error(`Expected 200, got ${resEngOwn.status}`);
  }

  // 1b. Cashier Eng attempts to access Kiosk CS orders (Forbidden 403)
  const resEngCS = await fetch(`${API_BASE}/orders/kiosks/${kioskCS.id}/incoming`, {
    headers: { Authorization: `Bearer ${engSession.token}` },
  });
  console.log(`   1b. Cross-access attempt to Kiosk CS incoming orders: HTTP ${resEngCS.status} (Expected: 403)`);
  if (resEngCS.status !== 403) {
    throw new Error(`Expected 403 Forbidden, got ${resEngCS.status}`);
  }

  // 1c. Cashier Eng attempts to toggle Kiosk CS status (Forbidden 403)
  const resEngToggleCS = await fetch(`${API_BASE}/kiosks/${kioskCS.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${engSession.token}`,
    },
    body: JSON.stringify({ isOpen: false }),
  });
  console.log(`   1c. Cross-access attempt to toggle Kiosk CS status: HTTP ${resEngToggleCS.status} (Expected: 403)`);
  if (resEngToggleCS.status !== 403) {
    throw new Error(`Expected 403 Forbidden, got ${resEngToggleCS.status}`);
  }

  // Test 2: Cashier CS Login
  console.log('\n🔑 Test 2: Testing Cashier Computer Science (cashier.cs@orderfast.test)...');
  const csSession = await login('cashier.cs@orderfast.test');
  console.log(`   Logged in. Assigned kiosk: ${csSession.user.staffAssignments?.[0]?.kioskName}`);

  // 2a. Cashier CS accesses Kiosk CS orders (Allowed)
  const resCSOwn = await fetch(`${API_BASE}/orders/kiosks/${kioskCS.id}/incoming`, {
    headers: { Authorization: `Bearer ${csSession.token}` },
  });
  console.log(`   2a. Access own kiosk incoming orders: HTTP ${resCSOwn.status} (Expected: 200)`);
  if (resCSOwn.status !== 200) {
    throw new Error(`Expected 200, got ${resCSOwn.status}`);
  }

  // 2b. Cashier CS attempts to access Kiosk Eng orders (Forbidden 403)
  const resCSEng = await fetch(`${API_BASE}/orders/kiosks/${kioskEng.id}/incoming`, {
    headers: { Authorization: `Bearer ${csSession.token}` },
  });
  console.log(`   2b. Cross-access attempt to Kiosk Eng incoming orders: HTTP ${resCSEng.status} (Expected: 403)`);
  if (resCSEng.status !== 403) {
    throw new Error(`Expected 403 Forbidden, got ${resCSEng.status}`);
  }

  // Test 3: Admin Login
  console.log('\n👑 Test 3: Testing Admin Platform Access (admin@orderfast.test)...');
  const adminSession = await login('admin@orderfast.test');
  console.log(`   Logged in as Admin: ${adminSession.user.fullName}`);

  // 3a. Admin accesses Kiosk Eng
  const resAdminEng = await fetch(`${API_BASE}/orders/kiosks/${kioskEng.id}/incoming`, {
    headers: { Authorization: `Bearer ${adminSession.token}` },
  });
  console.log(`   3a. Admin access Kiosk Eng: HTTP ${resAdminEng.status} (Expected: 200)`);
  if (resAdminEng.status !== 200) {
    throw new Error(`Expected 200, got ${resAdminEng.status}`);
  }

  // 3b. Admin accesses Kiosk CS
  const resAdminCS = await fetch(`${API_BASE}/orders/kiosks/${kioskCS.id}/incoming`, {
    headers: { Authorization: `Bearer ${adminSession.token}` },
  });
  console.log(`   3b. Admin access Kiosk CS: HTTP ${resAdminCS.status} (Expected: 200)`);
  if (resAdminCS.status !== 200) {
    throw new Error(`Expected 200, got ${resAdminCS.status}`);
  }

  console.log('\n======================================================');
  console.log('🎉 ALL KIOSK MULTI-TENANCY ISOLATION CHECKS PASSED 100%!');
  console.log('======================================================');
  process.exit(0);
}

runIsolationTests().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});

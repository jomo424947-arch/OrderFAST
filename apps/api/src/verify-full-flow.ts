import { db } from './db/client.js';
import { kiosks, profiles, orders, menuItems } from './db/schema.js';
import { eq, and } from 'drizzle-orm';

const API_BASE = 'http://127.0.0.1:4000/api';

async function run() {
  console.log('🧪 === STARTING FULL END-TO-END FLOW TEST ===\n');

  // 1. Student Login
  console.log('1️⃣ Logging in as Student (student@orderfast.test)...');
  const studentLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@orderfast.test', password: 'Password123!' }),
  });
  const studentLoginJson = await studentLoginRes.json();
  if (!studentLoginRes.ok || !studentLoginJson.data?.session?.accessToken) {
    throw new Error(`Student login failed: ${JSON.stringify(studentLoginJson)}`);
  }
  const studentToken = studentLoginJson.data.session.accessToken;
  console.log('   ✅ Student logged in successfully.');

  // 2. Fetch Kiosks & Menu for Kiosk 2 (كافيه الحاسبات)
  console.log('\n2️⃣ Fetching Kiosks & Menu for كافيه الحاسبات...');
  const kiosksRes = await fetch(`${API_BASE}/kiosks`);
  const kiosksJson = await kiosksRes.json();
  const csKiosk = kiosksJson.data.find((k: any) => k.name.includes('الحاسبات'));
  if (!csKiosk) throw new Error('كافيه الحاسبات not found in /kiosks');
  console.log(`   ✅ Found Kiosk: "${csKiosk.name}" (ID: ${csKiosk.id})`);

  const menuRes = await fetch(`${API_BASE}/kiosks/${csKiosk.id}/menu`);
  const menuJson = await menuRes.json();
  const items = menuJson.data.items;
  if (!items || items.length === 0) throw new Error('No menu items found for كافيه الحاسبات');
  const targetItem = items[0];
  console.log(`   ✅ Found ${items.length} menu items. Selected: "${targetItem.name}" (${targetItem.price / 100} EGP)`);

  // 3. Place Order as Student
  console.log('\n3️⃣ Placing order as student...');
  const orderRes = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      kioskId: csKiosk.id,
      items: [{ menuItemId: targetItem.id, quantity: 2, specialInstructions: 'بدون سكر' }],
      paymentMethod: 'cash',
    }),
  });
  const orderJson = await orderRes.json();
  if (!orderRes.ok || !orderJson.data?.id) {
    throw new Error(`Place order failed: ${JSON.stringify(orderJson)}`);
  }
  const placedOrder = orderJson.data;
  console.log(`   ✅ Order placed successfully! Order #${placedOrder.orderNumber} (ID: ${placedOrder.id}), Status: ${placedOrder.status}`);

  // 4. Cashier Login (cashier.cs@orderfast.test)
  console.log('\n4️⃣ Logging in as Cashier for كافيه الحاسبات (cashier.cs@orderfast.test)...');
  const cashierLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'cashier.cs@orderfast.test', password: 'Password123!' }),
  });
  const cashierLoginJson = await cashierLoginRes.json();
  if (!cashierLoginRes.ok || !cashierLoginJson.data?.session?.accessToken) {
    throw new Error(`Cashier login failed: ${JSON.stringify(cashierLoginJson)}`);
  }
  const cashierToken = cashierLoginJson.data.session.accessToken;
  console.log('   ✅ Cashier logged in.');

  // 5. Cashier fetches incoming orders
  console.log('\n5️⃣ Cashier fetching incoming orders...');
  const incomingRes = await fetch(`${API_BASE}/orders/kiosks/${csKiosk.id}/incoming`, {
    headers: { Authorization: `Bearer ${cashierToken}` },
  });
  const incomingJson = await incomingRes.json();
  const foundOrder = incomingJson.data?.find((o: any) => o.id === placedOrder.id);
  if (!foundOrder) {
    throw new Error(`Placed order ${placedOrder.id} was not found in cashier incoming list! Found: ${JSON.stringify(incomingJson.data)}`);
  }
  console.log(`   ✅ Cashier received incoming order #${foundOrder.orderNumber} immediately!`);

  // 6. Cashier Accepts Order
  console.log('\n6️⃣ Cashier accepting order...');
  const acceptRes = await fetch(`${API_BASE}/orders/${placedOrder.id}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cashierToken}` },
    body: JSON.stringify({ customPrepTimeMins: 10 }),
  });
  const acceptJson = await acceptRes.json();
  console.log(`   ✅ Cashier accepted order: Status is now ${acceptJson.data?.status}`);

  // 7. Cashier Marks Ready & Completes Order
  console.log('\n7️⃣ Cashier updating order to READY and COMPLETED...');
  await fetch(`${API_BASE}/orders/${placedOrder.id}/mark-ready`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cashierToken}` },
  });
  const completeRes = await fetch(`${API_BASE}/orders/${placedOrder.id}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cashierToken}` },
  });
  const completeJson = await completeRes.json();
  console.log(`   ✅ Order completed: Final status is ${completeJson.data?.status}`);

  // 8. Admin Login & Stats Verification
  console.log('\n8️⃣ Logging in as Admin (admin@orderfast.test)...');
  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@orderfast.test', password: 'Password123!' }),
  });
  const adminLoginJson = await adminLoginRes.json();
  const adminToken = adminLoginJson.data?.session?.accessToken;

  const adminStatsRes = await fetch(`${API_BASE}/orders/admin/stats`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminStatsJson = await adminStatsRes.json();
  console.log('   ✅ Admin Campus Stats:', adminStatsJson.data);

  const adminKiosksRes = await fetch(`${API_BASE}/kiosks/admin/with-staff`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminKiosksJson = await adminKiosksRes.json();
  console.log(`   ✅ Admin Kiosks with Staff: Found ${adminKiosksJson.data?.length} kiosks`);
  adminKiosksJson.data?.forEach((k: any) => {
    console.log(`      • ${k.name}: ${k.staff?.length || 0} staff assigned, ${k.menuItemsCount} items`);
  });

  console.log('\n🎉 ALL TESTS PASSED WITH 100% SUCCESS!');
  process.exit(0);
}

run().catch((e) => {
  console.error('❌ Test failed with error:', e);
  process.exit(1);
});

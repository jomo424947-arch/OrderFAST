import { db } from './db/client.js';
import { kiosks, orders, orderItems, menuItems, profiles, kioskStaff, userDeviceTokens } from './db/schema.js';

import { eq } from 'drizzle-orm';

async function checkDb() {
  console.log('=== KIOSKS IN DB ===');
  const kList = await db.select().from(kiosks);
  console.log(kList.map(k => ({ id: k.id, name: k.name, isOpen: k.isOpen, acceptsOnlineOrders: k.acceptsOnlineOrders })));

  console.log('\n=== STAFF IN DB ===');
  const staffList = await db.select({
    staffId: kioskStaff.id,
    kioskId: kioskStaff.kioskId,
    userId: kioskStaff.userId,
    userName: profiles.fullName,
    role: kioskStaff.role,
    isActive: kioskStaff.isActive,
  }).from(kioskStaff).leftJoin(profiles, eq(kioskStaff.userId, profiles.id));
  console.log(staffList);

  console.log('\n=== RECENT ORDERS IN DB ===');
  const orderList = await db.select().from(orders).limit(10);
  console.log(orderList.map(o => ({
    id: o.id,
    orderNumber: o.orderNumber,
    kioskId: o.kioskId,
    status: o.status,
    studentName: o.studentNameSnapshot,
    createdAt: o.createdAt,
    expiresAt: o.expiresAt,
  })));

  console.log('\n=== USER DEVICE TOKENS IN DB ===');
  const tokens = await db.select().from(userDeviceTokens);
  console.log(`Total registered device tokens: ${tokens.length}`);
  console.log(tokens);

  process.exit(0);
}

checkDb().catch(e => {
  console.error(e);
  process.exit(1);
});

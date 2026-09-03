import { db } from './db/client.js';
import { kiosks, orders, orderItems, menuItems, profiles, kioskStaff } from './db/schema.js';

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

  console.log('\n=== MENU ITEMS COUNT PER KIOSK ===');
  const items = await db.select().from(menuItems);
  console.log(`Total menu items: ${items.length}`);
  const perKiosk: Record<string, number> = {};
  for (const it of items) {
    perKiosk[it.kioskId] = (perKiosk[it.kioskId] || 0) + 1;
  }
  console.log('Per kiosk:', perKiosk);

  process.exit(0);
}

checkDb().catch(e => {
  console.error(e);
  process.exit(1);
});

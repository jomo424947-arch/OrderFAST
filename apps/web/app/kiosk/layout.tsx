'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CashierSidebar } from '@/components/layout/CashierSidebar';
import { CashierHeader } from '@/components/layout/CashierHeader';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useOrderStore } from '@/stores/useOrderStore';
import { useKioskStore } from '@/stores/useKioskStore';
import { LayoutDashboard, Inbox, Clock, UtensilsCrossed, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CashierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { decrementTimers, getKioskIncomingOrders, getKioskActiveOrders } = useOrderStore();
  const { activeKioskId } = useKioskStore();

  // Ticker for incoming order countdowns (every 1 second)
  useEffect(() => {
    const interval = setInterval(() => {
      decrementTimers();
    }, 1000);
    return () => clearInterval(interval);
  }, [decrementTimers]);

  const incomingCount = getKioskIncomingOrders(activeKioskId).length;
  const activeCount = getKioskActiveOrders(activeKioskId).length;

  const mobileTabs = [
    { href: '/kiosk', label: 'الرئيسية', icon: LayoutDashboard },
    { href: '/kiosk/incoming', label: 'الواردة', icon: Inbox, count: incomingCount },
    { href: '/kiosk/active', label: 'النشطة', icon: Clock, count: activeCount },
    { href: '/kiosk/menu', label: 'المنيو', icon: UtensilsCrossed },
    { href: '/kiosk/settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <RoleGuard allowedRole="cashier">
      <div className="min-h-screen bg-canvas flex flex-col lg:flex-row">
        {/* Desktop Sidebar */}
        <CashierSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <CashierHeader />

          {/* Mobile / Tablet Tab Strip matching design reference */}
          <div className="p-4 pb-0 lg:hidden max-w-2xl mx-auto w-full">
            <div className="flex bg-surface border border-line rounded-xl p-1 shadow-sm select-none overflow-x-auto no-scrollbar">
              {mobileTabs.map((t) => {
                const isActive = pathname === t.href;
                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    className={cn(
                      'flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-body font-bold rounded-lg transition-all text-center whitespace-nowrap',
                      isActive
                        ? 'bg-white text-ink shadow-sm'
                        : 'text-ink-soft hover:text-ink'
                    )}
                  >
                    <span>{t.label}</span>
                    {t.count !== undefined && t.count > 0 && (
                      <span
                        className={cn(
                          'px-1.5 py-0.2 text-[10px] font-mono rounded-full',
                          isActive
                            ? 'bg-primary-soft text-primary-ink font-bold'
                            : 'bg-line text-ink-soft'
                        )}
                      >
                        {t.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <main className="flex-1 p-4 sm:p-6 max-w-5xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}

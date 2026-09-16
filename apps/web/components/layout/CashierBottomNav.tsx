'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Inbox, Clock, UtensilsCrossed, Settings } from 'lucide-react';
import { useOrderStore } from '@/stores/useOrderStore';
import { useKioskStore } from '@/stores/useKioskStore';
import { cn } from '@/lib/utils';

export const CashierBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { activeKioskId } = useKioskStore();
  const { getKioskIncomingOrders, getKioskActiveOrders } = useOrderStore();

  const incomingCount = getKioskIncomingOrders(activeKioskId).length;
  const activeCount = getKioskActiveOrders(activeKioskId).length;

  const navItems = [
    {
      href: '/kiosk',
      label: 'الرئيسية',
      icon: LayoutDashboard,
      isActive: pathname === '/kiosk',
    },
    {
      href: '/kiosk/incoming',
      label: 'الواردة',
      icon: Inbox,
      isActive: pathname === '/kiosk/incoming',
      badge: incomingCount > 0 ? incomingCount : undefined,
      isAlert: incomingCount > 0,
    },
    {
      href: '/kiosk/active',
      label: 'النشطة',
      icon: Clock,
      isActive: pathname === '/kiosk/active',
      badge: activeCount > 0 ? activeCount : undefined,
      isAlert: false,
    },
    {
      href: '/kiosk/menu',
      label: 'المنيو',
      icon: UtensilsCrossed,
      isActive: pathname.startsWith('/kiosk/menu'),
    },
    {
      href: '/kiosk/settings',
      label: 'الإعدادات',
      icon: Settings,
      isActive: pathname.startsWith('/kiosk/settings'),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-line/80 px-2 py-2 lg:hidden">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all select-none',
                item.isActive
                  ? 'text-primary font-bold'
                  : 'text-ink/75 hover:text-ink font-semibold'
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    'w-5 h-5 transition-transform duration-150',
                    item.isActive
                      ? 'stroke-[2.5] text-primary scale-105'
                      : 'stroke-[2.2] text-ink/75'
                  )}
                />
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      'absolute -top-1.5 -left-2.5 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center border border-white',
                      item.isAlert
                        ? 'bg-danger text-white animate-pulse'
                        : 'bg-primary text-primary-ink'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-[11px] font-body mt-0.5 whitespace-nowrap',
                  item.isActive ? 'font-bold text-primary' : 'font-semibold text-ink/80'
                )}
              >
                {item.label}
              </span>
              {item.isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

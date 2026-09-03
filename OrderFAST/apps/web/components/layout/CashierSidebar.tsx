'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '@/components/branding/Logo';
import { useOrderStore } from '@/stores/useOrderStore';
import { useKioskStore } from '@/stores/useKioskStore';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  LayoutDashboard,
  Inbox,
  Clock,
  UtensilsCrossed,
  Settings,
  Bell,
  LogOut,
  Archive,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const CashierSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { getKioskIncomingOrders, getKioskActiveOrders, getKioskFinishedOrders } = useOrderStore();
  const { activeKioskId, kiosks, fetchKiosks } = useKioskStore();
  const { cashier, logout } = useAuthStore();

  React.useEffect(() => {
    if (kiosks.length === 0) {
      fetchKiosks();
    }
  }, [kiosks.length, fetchKiosks]);

  const currentKiosk =
    kiosks.find((k) => k.id === activeKioskId) || {
      id: cashier?.kioskId || activeKioskId,
      name: cashier?.kioskName || 'الكشك',
      isOpen: true,
      collegeLocation: cashier?.college || '',
    };
  const incomingCount = getKioskIncomingOrders(activeKioskId).length;
  const activeCount = getKioskActiveOrders(activeKioskId).length;
  const finishedCount = getKioskFinishedOrders(activeKioskId).length;

  const navLinks = [
    {
      href: '/kiosk',
      label: 'نظرة عامة',
      icon: LayoutDashboard,
      isActive: pathname === '/kiosk',
    },
    {
      href: '/kiosk/incoming',
      label: 'الأوردرات الواردة',
      icon: Inbox,
      count: incomingCount,
      isIncoming: true,
      isActive: pathname === '/kiosk/incoming',
    },
    {
      href: '/kiosk/active',
      label: 'الأوردرات النشطة',
      icon: Clock,
      count: activeCount,
      isActive: pathname === '/kiosk/active',
    },
    {
      href: '/kiosk/history',
      label: 'أوردرات اليوم',
      icon: Archive,
      count: finishedCount,
      isActive: pathname === '/kiosk/history',
    },
    {
      href: '/kiosk/menu',
      label: 'إدارة المنيو',
      icon: UtensilsCrossed,
      isActive: pathname === '/kiosk/menu',
    },
    {
      href: '/kiosk/notifications',
      label: 'التنبيهات',
      icon: Bell,
      isActive: pathname === '/kiosk/notifications',
    },
    {
      href: '/kiosk/settings',
      label: 'إعدادات الكشك',
      icon: Settings,
      isActive: pathname === '/kiosk/settings',
    },
  ];

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <aside className="w-64 bg-surface border-l border-line flex flex-col justify-between p-4 h-screen sticky top-0 hidden lg:flex select-none">
      <div>
        {/* Logo and Cashier Badge */}
        <div className="pb-6 border-b border-line mb-6">
          <Logo variant="compact" href="/kiosk" />
          <div className="mt-3 flex items-center justify-between bg-canvas px-3 py-2 rounded-xl border border-line">
            <div>
              <p className="font-display font-bold text-sm text-ink">{currentKiosk.name}</p>
              <p className="font-body text-[11px] text-ink-soft">لوحة الكاشير</p>
            </div>
            <span className={cn('w-2.5 h-2.5 rounded-full', currentKiosk.isOpen ? 'bg-accent' : 'bg-danger')} />
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-xl font-body text-sm font-semibold transition-all duration-200',
                  item.isActive
                    ? 'bg-primary text-primary-ink shadow-sm'
                    : 'text-ink-soft hover:text-ink hover:bg-canvas'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-mono font-bold',
                      item.isIncoming
                        ? 'bg-danger text-white animate-pulse'
                        : item.isActive
                        ? 'bg-primary-ink/10 text-primary-ink'
                        : 'bg-primary-soft text-primary-ink'
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions: Logout only */}
      <div className="pt-4 border-t border-line space-y-2">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-body text-danger hover:bg-danger-soft transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
};

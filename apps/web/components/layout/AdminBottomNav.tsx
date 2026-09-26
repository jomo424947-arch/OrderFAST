'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  Megaphone,
  TrendingUp,
  LayoutGrid,
} from 'lucide-react';
import { useKioskStore } from '@/stores/useKioskStore';
import { useAdminNavStore } from '@/stores/useAdminNavStore';
import { cn } from '@/lib/utils';

export const AdminBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { menuItems } = useKioskStore();
  const { isDrawerOpen, toggleDrawer } = useAdminNavStore();

  const underReviewCount = menuItems.filter((i) => i.isUnderReview).length;

  const isMoreActive =
    pathname.startsWith('/admin/menu-review') ||
    pathname.startsWith('/admin/students') ||
    pathname.startsWith('/admin/testers') ||
    pathname.startsWith('/admin/league') ||
    isDrawerOpen;

  const navItems = [
    {
      href: '/admin',
      label: 'الرئيسية',
      icon: LayoutDashboard,
      isActive: pathname === '/admin',
    },
    {
      href: '/admin/kiosks',
      label: 'الأكشاك',
      icon: Store,
      isActive: pathname.startsWith('/admin/kiosks'),
    },
    {
      href: '/admin/marketing',
      label: 'التسويق',
      icon: Megaphone,
      isActive: pathname.startsWith('/admin/marketing'),
    },
    {
      href: '/admin/analytics',
      label: 'الإحصائيات',
      icon: TrendingUp,
      isActive: pathname.startsWith('/admin/analytics'),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-line/60 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] h-16 lg:hidden select-none">
      <div className="max-w-md mx-auto h-full flex items-center justify-around relative px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center py-1 px-3 transition-colors duration-150 min-w-[56px]',
                item.isActive ? 'text-[#FF5A1F]' : 'text-[#60584D] hover:text-ink'
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    'w-5.5 h-5.5 transition-transform duration-150',
                    item.isActive
                      ? 'stroke-[2.2] text-[#FF5A1F] scale-105'
                      : 'stroke-[1.9] text-[#60584D]'
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-[11px] font-body mt-1 whitespace-nowrap transition-colors',
                  item.isActive ? 'font-bold text-[#FF5A1F]' : 'font-medium text-[#60584D]'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More / All Pages Drawer Trigger Button */}
        <button
          type="button"
          onClick={toggleDrawer}
          className={cn(
            'relative flex flex-col items-center justify-center py-1 px-3 transition-colors duration-150 min-w-[56px] focus:outline-none',
            isMoreActive ? 'text-[#FF5A1F]' : 'text-[#60584D] hover:text-ink'
          )}
          aria-label="جميع الصفحات والمزيد"
        >
          <div className="relative">
            <LayoutGrid
              className={cn(
                'w-5.5 h-5.5 transition-transform duration-150',
                isMoreActive
                  ? 'stroke-[2.2] text-[#FF5A1F] scale-105'
                  : 'stroke-[1.9] text-[#60584D]'
              )}
            />
            {/* Show review items badge if there are pending items to approve */}
            {underReviewCount > 0 ? (
              <span className="absolute -top-1.5 -left-2 bg-danger text-white text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center border-2 border-white shadow-xs animate-pulse">
                {underReviewCount}
              </span>
            ) : isMoreActive ? (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#FF5A1F] ring-2 ring-white" />
            ) : null}
          </div>
          <span
            className={cn(
              'text-[11px] font-body mt-1 whitespace-nowrap transition-colors',
              isMoreActive ? 'font-bold text-[#FF5A1F]' : 'font-medium text-[#60584D]'
            )}
          >
            المزيد
          </span>
        </button>
      </div>
    </nav>
  );
};

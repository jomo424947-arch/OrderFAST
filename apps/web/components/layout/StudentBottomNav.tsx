'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Store, ShoppingCart, Package, User } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';
import { cn } from '@/lib/utils';

export const StudentBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { getTotalItems } = useCartStore();
  const cartCount = getTotalItems();

  const navItems = [
    {
      href: '/student',
      label: 'الرئيسية',
      icon: Home,
      isActive: pathname === '/student',
      isFloating: false,
    },
    {
      href: '/student/kiosks',
      label: 'الأكشاك',
      icon: Store,
      isActive: pathname.startsWith('/student/kiosks'),
      isFloating: false,
    },
    {
      href: '/student/cart',
      label: 'السلة',
      icon: ShoppingCart,
      isActive: pathname === '/student/cart',
      badge: cartCount > 0 ? cartCount : undefined,
      isFloating: true,
    },
    {
      href: '/student/orders',
      label: 'طلباتي',
      icon: Package,
      isActive: pathname.startsWith('/student/orders'),
      isFloating: false,
    },
    {
      href: '/student/profile',
      label: 'حسابي',
      icon: User,
      isActive: pathname.startsWith('/student/profile') || pathname.startsWith('/student/settings'),
      isFloating: false,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-line/60 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] h-16 lg:hidden select-none">
      <div className="max-w-md mx-auto h-full flex items-center justify-around relative px-2">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.isFloating) {
            return (
              <div key={item.href} className="relative flex justify-center items-center w-16 h-full">
                {/* Dark scooped crescent notch directly under the button */}
                <div className="absolute -top-3 w-16 h-6 bg-[#261507] rounded-b-full -z-0 pointer-events-none shadow-inner" />

                {/* Floating Large Orange Cart Button */}
                <Link
                  href={item.href}
                  className="relative -top-5 flex items-center justify-center group focus:outline-none z-10"
                  aria-label={item.label}
                >
                  <div
                    className={cn(
                      'w-14 h-14 sm:w-15 sm:h-15 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 active:scale-95',
                      'bg-[#FF5A1F] hover:bg-[#E84E16] text-white',
                      item.isActive && 'ring-4 ring-[#FF5A1F]/25 shadow-glow'
                    )}
                  >
                    <Icon className="w-7 h-7 text-white stroke-[2.2]" />
                    {item.badge !== undefined && (
                      <span className="absolute -top-1 -right-1 bg-ink text-white text-[10px] font-mono font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center border-2 border-white shadow-sm animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-3 transition-colors duration-150 min-w-[56px]',
                item.isActive
                  ? 'text-[#FF5A1F]'
                  : 'text-[#60584D] hover:text-ink'
              )}
            >
              <Icon
                className={cn(
                  'w-5.5 h-5.5 transition-transform duration-150',
                  item.isActive
                    ? 'stroke-[2.2] text-[#FF5A1F] scale-105'
                    : 'stroke-[1.9] text-[#60584D]'
                )}
              />
              <span
                className={cn(
                  'text-[11px] font-body mt-1 whitespace-nowrap transition-colors',
                  item.isActive
                    ? 'font-bold text-[#FF5A1F]'
                    : 'font-medium text-[#60584D]'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

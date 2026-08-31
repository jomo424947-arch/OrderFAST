import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Store, ShoppingBag, Clock, User } from 'lucide-react';
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
    },
    {
      href: '/student/kiosks',
      label: 'الأكشاك',
      icon: Store,
      isActive: pathname.startsWith('/student/kiosks'),
    },
    {
      href: '/student/cart',
      label: 'السلة',
      icon: ShoppingBag,
      isActive: pathname === '/student/cart',
      badge: cartCount > 0 ? cartCount : undefined,
    },
    {
      href: '/student/orders',
      label: 'طلباتي',
      icon: Clock,
      isActive: pathname.startsWith('/student/orders'),
    },
    {
      href: '/student/profile',
      label: 'حسابي',
      icon: User,
      isActive: pathname.startsWith('/student/profile') || pathname.startsWith('/student/settings'),
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
                'relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all select-none',
                item.isActive
                  ? 'text-primary-ink font-bold'
                  : 'text-ink-soft hover:text-ink font-medium'
              )}
            >
              <div className="relative">
                <Icon className={cn('w-5 h-5', item.isActive && 'stroke-[2.5] text-primary-ink')} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -left-2 bg-primary text-primary-ink text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center border border-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-body mt-0.5">{item.label}</span>
              {item.isActive && (
                <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

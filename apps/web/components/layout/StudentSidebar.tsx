'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '@/components/branding/Logo';
import { useCartStore } from '@/stores/useCartStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  LayoutDashboard,
  Store,
  ShoppingBag,
  Clock,
  Bell,
  User,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const StudentSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { student, logout } = useAuthStore();
  const { getTotalItems } = useCartStore();
  const { orders } = useOrderStore();
  const { getUnreadCount } = useNotificationStore();

  const cartCount = getTotalItems();
  const activeOrdersCount = orders.filter(
    (o) =>
      (student?.id ? o.studentId === student.id : true) &&
      (o.status === 'PENDING_KIOSK' ||
        o.status === 'ACCEPTED' ||
        o.status === 'PREPARING' ||
        o.status === 'READY')
  ).length;
  const unreadNotificationsCount = getUnreadCount('student');

  const navLinks = [
    {
      href: '/student',
      label: 'الرئيسية',
      icon: LayoutDashboard,
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
      count: cartCount,
      isActive: pathname === '/student/cart',
    },
    {
      href: '/student/orders',
      label: 'طلباتي',
      icon: Clock,
      count: activeOrdersCount,
      isActive: pathname.startsWith('/student/orders'),
    },
    {
      href: '/student/notifications',
      label: 'الإشعارات',
      icon: Bell,
      count: unreadNotificationsCount,
      isActive: pathname === '/student/notifications',
    },
    {
      href: '/student/profile',
      label: 'حسابي',
      icon: User,
      isActive: pathname.startsWith('/student/profile') || pathname.startsWith('/student/settings'),
    },
  ];

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <aside className="w-64 bg-surface border-l border-line flex flex-col justify-between p-4 h-screen sticky top-0 hidden lg:flex select-none">
      <div>
        {/* Logo and Student Badge */}
        <div className="pb-6 border-b border-line mb-6">
          <Logo variant="compact" href="/student" />
          <div className="mt-3 flex items-center justify-between bg-canvas px-3 py-2 rounded-xl border border-line">
            <div className="truncate">
              <p className="font-display font-bold text-sm text-ink truncate">
                {student?.name || 'حساب الطالب'}
              </p>
              <p className="font-body text-[11px] text-ink-soft truncate">
                {student?.college || 'جامعة سفنكس'}
              </p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-accent flex-shrink-0" />
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
                      item.isActive
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

      {/* Bottom Actions: Logout */}
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

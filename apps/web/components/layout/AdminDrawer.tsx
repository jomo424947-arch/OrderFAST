'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '@/components/branding/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/useAuthStore';
import { useKioskStore } from '@/stores/useKioskStore';
import { useAdminNavStore } from '@/stores/useAdminNavStore';
import {
  LayoutDashboard,
  Store,
  ClipboardCheck,
  Users,
  UserCheck,
  TrendingUp,
  Megaphone,
  Trophy,
  LogOut,
  X,
  ChevronLeft,
  ShieldCheck,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/stores/useNotificationStore';

export const AdminDrawer: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, admin } = useAuthStore();
  const { menuItems } = useKioskStore();
  const { isDrawerOpen, closeDrawer } = useAdminNavStore();
  const unreadNotificationsCount = useNotificationStore((s) => s.getUnreadCount('admin'));

  const underReviewCount = menuItems.filter((i) => i.isUnderReview).length;

  // Close drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  const navLinks = [
    {
      href: '/admin',
      label: 'نظرة عامة (الرئيسية)',
      description: 'مؤشرات الأداء الحية وحالة النظام',
      icon: LayoutDashboard,
      isActive: pathname === '/admin',
    },
    {
      href: '/admin/notifications',
      label: 'إشعارات الأوردرات والحرم',
      description: 'سجل التنبيهات والأوردرات الجديدة فورياً',
      icon: Bell,
      count: unreadNotificationsCount,
      isActive: pathname.startsWith('/admin/notifications'),
    },
    {
      href: '/admin/kiosks',
      label: 'الأكشاك والكاشيرات',
      description: 'إدارة منافذ البيع والكاشيرات والصلاحيات',
      icon: Store,
      isActive: pathname.startsWith('/admin/kiosks'),
    },
    {
      href: '/admin/menu-review',
      label: 'اعتماد الأصناف',
      description: 'مراجعة وقبول منتجات المنيو المضافة',
      icon: ClipboardCheck,
      count: underReviewCount,
      isActive: pathname.startsWith('/admin/menu-review'),
    },
    {
      href: '/admin/students',
      label: 'حسابات الطلاب',
      description: 'متابعة الطلاب المسجلين وحالات عدم الاستلام',
      icon: Users,
      isActive: pathname.startsWith('/admin/students'),
    },
    {
      href: '/admin/testers',
      label: 'متابعة المختبرين (14 يوم)',
      description: 'تتبع الحسابات والمهام اليومية للاختبار',
      icon: UserCheck,
      isActive: pathname.startsWith('/admin/testers'),
    },
    {
      href: '/admin/analytics',
      label: 'الإحصائيات والأرباح',
      description: 'تقارير أرباح المنصة ورسوم الخدمة والمبيعات',
      icon: TrendingUp,
      isActive: pathname.startsWith('/admin/analytics'),
    },
    {
      href: '/admin/marketing',
      label: 'التسويق والإعلانات',
      description: 'إرسال الإشعارات والبانرات الترويجية',
      icon: Megaphone,
      isActive: pathname.startsWith('/admin/marketing'),
    },
    {
      href: '/admin/league',
      label: 'FastOrder League والجوائز',
      description: 'دوري الكليات والمنافسات وتوزيع الجوائز',
      icon: Trophy,
      isActive: pathname.startsWith('/admin/league'),
    },
  ];

  const handleLogout = () => {
    closeDrawer();
    logout();
    router.push('/auth/login');
  };

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/60 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer Panel (slides from right for RTL) */}
      <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-surface shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-right duration-300 border-l border-line">
        {/* Drawer Header */}
        <div className="p-4 border-b border-line flex items-center justify-between bg-canvas/40">
          <div className="flex items-center gap-2">
            <Logo variant="compact" href="/admin" />
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="w-9 h-9 rounded-full bg-surface border border-line flex items-center justify-center text-ink-soft hover:text-ink hover:bg-canvas transition-colors"
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Identity Card */}
        <div className="p-4 pb-2 border-b border-line/60 bg-surface">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-canvas border border-line/80">
            <Avatar name={admin?.name || 'مدير'} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <p className="font-display font-bold text-sm text-ink truncate">
                  {admin?.name || 'محمد خيري'}
                </p>
                <span className="w-2.5 h-2.5 rounded-full bg-accent flex-shrink-0 animate-pulse" />
              </div>
              <p className="font-body text-[11px] text-ink-soft truncate">
                {admin?.email || 'admin@sphinx.edu.eg'}
              </p>
              <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-md w-fit border border-amber-500/20">
                <ShieldCheck className="w-3 h-3 text-amber-600" />
                <span>مدير النظام المركزى</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
          <p className="px-3 pt-1 pb-1.5 text-[11px] font-bold font-body text-ink-soft tracking-wider">
            أقسام الإدارة والتحكم
          </p>
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeDrawer}
                className={cn(
                  'flex items-center justify-between p-3 rounded-2xl transition-all duration-200 group',
                  item.isActive
                    ? 'bg-primary text-primary-ink shadow-sm'
                    : 'hover:bg-canvas text-ink'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
                      item.isActive
                        ? 'bg-primary-ink/15 text-primary-ink'
                        : 'bg-canvas text-ink-soft group-hover:text-primary-ink group-hover:bg-primary-soft/30'
                    )}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        'text-xs font-bold font-display truncate',
                        item.isActive ? 'text-primary-ink' : 'text-ink'
                      )}
                    >
                      {item.label}
                    </p>
                    <p
                      className={cn(
                        'text-[10px] font-body truncate mt-0.5',
                        item.isActive ? 'text-primary-ink/80' : 'text-ink-soft'
                      )}
                    >
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 mr-1">
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold animate-pulse',
                        item.isActive
                          ? 'bg-primary-ink text-white'
                          : 'bg-primary text-primary-ink'
                      )}
                    >
                      {item.count}
                    </span>
                  )}
                  <ChevronLeft
                    className={cn(
                      'w-4 h-4 transition-transform',
                      item.isActive
                        ? 'text-primary-ink'
                        : 'text-ink-soft/60 group-hover:text-ink group-hover:-translate-x-0.5'
                    )}
                  />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom Actions: Logout */}
        <div className="p-3 border-t border-line bg-canvas/30 space-y-2">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-body font-bold text-danger hover:bg-danger-soft transition-colors border border-danger/20"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج من لوحة الإدارة</span>
          </button>
          <div className="text-center">
            <span className="text-[10px] font-mono text-ink-soft">
              FastOrder Admin · منصة جامعة سفنكس v2.0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

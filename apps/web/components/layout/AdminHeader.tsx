'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/branding/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/useAuthStore';
import { useKioskStore } from '@/stores/useKioskStore';
import { useAdminNavStore } from '@/stores/useAdminNavStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { ShieldCheck, ClipboardCheck, Menu, Bell } from 'lucide-react';

export const AdminHeader: React.FC = () => {
  const { admin } = useAuthStore();
  const { menuItems } = useKioskStore();
  const { toggleDrawer } = useAdminNavStore();
  const unreadNotificationsCount = useNotificationStore((s) => s.getUnreadCount('admin'));

  const underReviewCount = menuItems.filter((i) => i.isUnderReview).length;

  return (
    <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-line px-4 sm:px-6 py-3 transition-all">
      <div className="flex items-center justify-between gap-3">
        {/* Mobile: Logo & Admin badge | Desktop: Campus Brand */}
        <div className="flex items-center gap-3">
          <div className="lg:hidden flex items-center gap-2">
            <Logo variant="compact" href="/admin" />
            <span className="hidden xs:inline-flex items-center px-2 py-0.5 rounded-lg bg-primary-soft/60 text-primary-ink text-[10px] font-bold border border-primary/20">
              لوحة الإدارة
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs font-body text-ink-soft">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span className="font-bold text-ink">جامعة سفنكس</span>
            <span>·</span>
            <span>منصة التحكم المركزية</span>
          </div>
        </div>

        {/* Right Action Tools: Pending Items Alert, Avatar, Menu Toggle */}
        <div className="flex items-center gap-2.5">
          {/* Admin Notifications Bell with Badge */}
          <Link
            href="/admin/notifications"
            className="relative w-9 h-9 rounded-full bg-surface border border-line flex items-center justify-center text-ink hover:bg-canvas transition-colors"
            aria-label="إشعارات الإدارة"
            title="إشعارات الإدارة"
          >
            <Bell className="w-4 h-4 text-ink" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-danger text-white text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center border border-white animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </Link>

          {/* Pending Menu Items Review Alert */}
          {underReviewCount > 0 && (
            <Link
              href="/admin/menu-review"
              className="relative w-9 h-9 rounded-full bg-surface border border-line flex items-center justify-center text-ink hover:bg-canvas transition-colors"
              aria-label="أصناف بانتظار الاعتماد"
              title={`${underReviewCount} أصناف بانتظار الاعتماد`}
            >
              <ClipboardCheck className="w-4 h-4 text-primary-ink" />
              <span className="absolute -top-1 -right-1 bg-primary text-primary-ink text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center border border-white animate-pulse">
                {underReviewCount}
              </span>
            </Link>
          )}

          {/* Admin Profile Display */}
          <div className="flex items-center gap-2">
            <div className="text-left hidden sm:block">
              <p className="font-body font-bold text-xs text-ink">{admin?.name || 'محمد خيري'}</p>
              <p className="font-body text-[10px] text-ink-soft">{admin?.email || 'admin@sphinx.edu.eg'}</p>
            </div>
            <Avatar name={admin?.name || 'مدير'} size="sm" />
          </div>

          {/* Mobile Drawer Menu Toggle (Hamburger) */}
          <button
            type="button"
            onClick={toggleDrawer}
            className="lg:hidden w-9 h-9 rounded-full bg-surface border border-line flex items-center justify-center text-ink hover:bg-canvas transition-colors focus:outline-none"
            aria-label="فتح القائمة الإدارية الكاملة"
          >
            <Menu className="w-5 h-5 text-ink" />
          </button>
        </div>
      </div>
    </header>
  );
};

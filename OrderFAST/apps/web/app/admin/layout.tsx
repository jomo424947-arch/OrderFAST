'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useKioskStore } from '@/stores/useKioskStore';
import { LayoutDashboard, Store, ClipboardCheck, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { menuItems } = useKioskStore();
  const underReviewCount = menuItems.filter((i) => i.isUnderReview).length;

  const mobileTabs = [
    { href: '/admin', label: 'الرئيسية', icon: LayoutDashboard },
    { href: '/admin/kiosks', label: 'الأكشاك', icon: Store },
    { href: '/admin/menu-review', label: 'المراجعة', icon: ClipboardCheck, count: underReviewCount },
    { href: '/admin/students', label: 'الطلاب', icon: Users },
  ];

  return (
    <RoleGuard allowedRole="admin">
      <div className="min-h-screen bg-canvas flex flex-col lg:flex-row">
        {/* Desktop Sidebar */}
        <AdminSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader />

          {/* Mobile / Tablet Tab Strip */}
          <div className="p-4 pb-0 lg:hidden max-w-xl mx-auto w-full">
            <div className="flex bg-surface border border-line rounded-xl p-1 shadow-sm select-none">
              {mobileTabs.map((t) => {
                const isActive = pathname === t.href;
                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-body font-bold rounded-lg transition-all text-center whitespace-nowrap',
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

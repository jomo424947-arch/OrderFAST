import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/branding/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { Bell, ShoppingBag, Store, UserCheck } from 'lucide-react';

export const StudentHeader: React.FC = () => {
  const { student, role, setRole } = useAuthStore();
  const { getUnreadCount } = useNotificationStore();
  const unreadCount = getUnreadCount('student');

  return (
    <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-line/80 px-4 py-3 transition-all">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Logo and Campus Brand */}
        <div className="flex items-center gap-3">
          <Logo variant="compact" href="/student" />
        </div>

        {/* Right Action Tools: Role Switcher Demo, Notifications, Avatar */}
        <div className="flex items-center gap-2.5">
          {/* Quick Demo Switcher to Cashier Dashboard */}
          <Link
            href="/kiosk"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-canvas hover:bg-line/40 border border-line text-xs font-body text-ink-soft transition-colors"
            title="التبديل إلى لوحة تحكم الكاشير"
          >
            <Store className="w-3.5 h-3.5 text-primary-ink" />
            <span>لوحة الكاشير</span>
          </Link>

          {/* Notifications Button with Red Dot */}
          <Link
            href="/student/notifications"
            className="relative w-9 h-9 rounded-full bg-surface border border-line flex items-center justify-center text-ink hover:bg-canvas transition-colors"
            aria-label="الإشعارات"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-danger ring-2 ring-surface" />
            )}
          </Link>

          {/* User Profile Avatar */}
          <Link href="/student/profile" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Avatar name={student.name} size="sm" />
          </Link>
        </div>
      </div>
    </header>
  );
};

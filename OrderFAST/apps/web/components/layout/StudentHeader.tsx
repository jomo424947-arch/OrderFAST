'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/branding/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { Bell, GraduationCap } from 'lucide-react';

export const StudentHeader: React.FC = () => {
  const { student } = useAuthStore();
  const { getUnreadCount } = useNotificationStore();
  const unreadCount = getUnreadCount('student');

  return (
    <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-line px-4 sm:px-6 py-3 transition-all">
      <div className="flex items-center justify-between gap-3">
        {/* Mobile: Logo | Desktop: Campus Brand */}
        <div className="flex items-center gap-3">
          <div className="lg:hidden">
            <Logo variant="compact" href="/student" />
          </div>
          <div className="hidden lg:flex items-center gap-2 text-xs font-body text-ink-soft">
            <GraduationCap className="w-4 h-4 text-accent" />
            <span className="font-bold text-ink">جامعة سفنكس</span>
            <span>·</span>
            <span>{student?.college || 'كلية الحاسبات والذكاء الاصطناعي'}</span>
          </div>
        </div>

        {/* Right Action Tools: Notifications, Avatar */}
        <div className="flex items-center gap-3">
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

          {/* User Profile Avatar with Name on larger screens */}
          <Link href="/student/profile" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="text-left hidden sm:block">
              <p className="font-body font-bold text-xs text-ink">{student?.name || 'طالب'}</p>
              <p className="font-body text-[10px] text-ink-soft">{student?.universityId || 'جامعة سفنكس'}</p>
            </div>
            <Avatar name={student?.name || 'طالب'} size="sm" />
          </Link>
        </div>
      </div>
    </header>
  );
};

'use client';

import React from 'react';
import Link from 'next/link';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatArabicTime } from '@/lib/formatters';
import { Bell, CheckCheck, Clock, Store, AlertTriangle, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StudentNotificationsPage() {
  const router = useRouter();
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();

  const studentNotifs = notifications.filter(
    (n) => n.userRole === 'student' || !n.userRole
  );

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-line/60">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full bg-surface border border-line flex items-center justify-center text-ink hover:bg-canvas transition-colors"
            aria-label="الرجوع"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div>
            <h2 className="font-display font-bold text-xl text-ink">
              الإشعارات
            </h2>
            <p className="font-body text-xs text-ink-soft">
              تحديثات أوردراتك وتنبيهات الأكشاك
            </p>
          </div>
        </div>

        {studentNotifs.length > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-xs font-body font-semibold text-accent hover:underline"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>تحديد الكل كمقروء</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5 pt-1">
        {studentNotifs.length > 0 ? (
          studentNotifs.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markAsRead(notif.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                notif.isRead
                  ? 'bg-surface/70 border-line/60'
                  : 'bg-surface border-primary/40 shadow-warm'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      notif.type === 'order_status'
                        ? 'bg-primary-soft text-primary-ink'
                        : notif.type === 'warning'
                        ? 'bg-danger-soft text-danger'
                        : 'bg-accent-soft text-accent'
                    }`}
                  >
                    {notif.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-body font-bold text-sm text-ink mb-1">
                      {notif.title}
                    </h4>
                    <p className="font-body text-xs text-ink-soft leading-relaxed">
                      {notif.body}
                    </p>
                  </div>
                </div>

                {!notif.isRead && (
                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                )}
              </div>

              <div className="mt-2 text-left">
                <span className="font-mono text-[10px] text-ink-soft opacity-75">
                  {formatArabicTime(notif.createdAt)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon={<Bell className="w-8 h-8" />}
            title="لا توجد إشعارات جديدة"
            description="ستصلك إشعارات وتحديثات فورية بمجرد قيام الكشك بتجهيز طلبك."
          />
        )}
      </div>
    </div>
  );
}

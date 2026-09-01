'use client';

import React from 'react';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatArabicTime } from '@/lib/formatters';
import { Bell, CheckCheck, Inbox, AlertTriangle } from 'lucide-react';

export default function CashierNotificationsPage() {
  const { notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();

  React.useEffect(() => {
    fetchNotifications('', 'cashier');
  }, [fetchNotifications]);

  const cashierNotifs = notifications.filter(
    (n) => n.userRole === 'cashier' || n.userRole === 'student'
  );

  return (
    <div className="space-y-4 max-w-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-line/60">
        <div>
          <h2 className="font-display font-bold text-2xl text-ink">
            تنبيهات الكاشير
          </h2>
          <p className="font-body text-xs text-ink-soft">
            إشعارات الأوردرات الجديدة وتحديثات نظام الكشك
          </p>
        </div>

        {cashierNotifs.length > 0 && (
          <button
            type="button"
            onClick={() => markAllAsRead()}
            className="flex items-center gap-1 text-xs font-body font-semibold text-accent hover:underline"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>تحديد الكل كمقروء</span>
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-3 pt-2">
        {cashierNotifs.length > 0 ? (
          cashierNotifs.map((notif) => (
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
                  <div className="w-9 h-9 rounded-xl bg-primary-soft text-primary-ink flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Inbox className="w-4 h-4" />
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
            title="لا توجد تنبيهات جديدة"
            description="ستصلك إشعارات وتنبيهات فورية عند وصول طلبات طلاب جديدة."
          />
        )}
      </div>
    </div>
  );
}

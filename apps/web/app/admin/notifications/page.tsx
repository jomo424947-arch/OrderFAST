'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatArabicTime } from '@/lib/formatters';
import { Bell, CheckCheck, ChevronRight, Zap, ShoppingBag, AlertTriangle } from 'lucide-react';

export default function AdminNotificationsPage() {
  const router = useRouter();
  const { admin } = useAuthStore();
  const { notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    if (admin?.id) {
      fetchNotifications(admin.id, 'admin');
    }
  }, [admin?.id, fetchNotifications]);

  const adminNotifs = notifications.filter(
    (n) => (admin?.id ? n.userId === admin.id : true) || n.userRole === 'admin'
  );

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
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
              إشعارات الإدارة
            </h2>
            <p className="font-body text-xs text-ink-soft">
              تنبيهات فورية بجميع طلبات الأكشاك في الحرم الجامعي
            </p>
          </div>
        </div>

        {adminNotifs.length > 0 && (
          <button
            type="button"
            onClick={() => markAllAsRead(admin?.id)}
            className="flex items-center gap-1.5 text-xs font-body font-semibold text-primary-ink bg-primary-soft/50 hover:bg-primary-soft px-3 py-1.5 rounded-xl border border-primary/20 transition-all"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>تحديد الكل كمقروء</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5 pt-1">
        {adminNotifs.length > 0 ? (
          adminNotifs.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                markAsRead(notif.id);
                router.push('/admin');
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer hover:border-primary/50 ${
                notif.isRead
                  ? 'bg-surface/70 border-line/60'
                  : 'bg-surface border-primary/40 shadow-warm ring-1 ring-primary/20'
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
                    {notif.type === 'order_status' ? (
                      <Zap className="w-4 h-4 text-primary-ink" />
                    ) : notif.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-body font-bold text-sm text-ink mb-1 flex items-center gap-2">
                      {notif.title}
                      {!notif.isRead && (
                        <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                      )}
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

              <div className="mt-2.5 flex items-center justify-between text-xs text-ink-soft">
                <span className="font-mono text-[10px] opacity-75">
                  {formatArabicTime(notif.createdAt)}
                </span>
                <span className="text-[11px] text-accent font-medium hover:underline flex items-center gap-1">
                  عرض التفاصيل في لوحة الإدارة
                  <ChevronRight className="w-3 h-3 rotate-180" />
                </span>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon={<Bell className="w-8 h-8 text-ink-soft" />}
            title="لا توجد إشعارات جديدة"
            description="ستصلك تنبيهات فورية هنا وعلى هاتفك فور قيام أي طالب بطلب أوردر من أي كشك."
          />
        )}
      </div>
    </div>
  );
}

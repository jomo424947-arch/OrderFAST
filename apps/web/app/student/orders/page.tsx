'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useOrderStore } from '@/stores/useOrderStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Tabs } from '@/components/ui/Tabs';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatEGP, formatArabicTime } from '@/lib/formatters';
import { Clock, Store, ChevronLeft, ArrowLeft, ShoppingBag, CheckCircle2, AlertCircle } from 'lucide-react';

export default function StudentOrdersPage() {
  const router = useRouter();
  const { student } = useAuthStore();
  const { orders } = useOrderStore();
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const studentOrders = orders.filter((o) => (student?.id ? o.studentId === student.id : true) || !o.studentId);

  const activeOrders = studentOrders.filter(
    (o) =>
      o.status === 'placed' ||
      o.status === 'pending_review' ||
      o.status === 'accepted' ||
      o.status === 'preparing' ||
      o.status === 'ready_for_pickup'
  );

  const pastOrders = studentOrders.filter(
    (o) =>
      o.status === 'picked_up' ||
      o.status === 'rejected' ||
      o.status === 'no_show' ||
      o.status === 'expired'
  );

  const displayedOrders = activeTab === 'active' ? activeOrders : pastOrders;

  const tabs = [
    { id: 'active', label: 'الطلبات النشطة', count: activeOrders.length },
    { id: 'history', label: 'طلباتي السابقة', count: pastOrders.length },
  ];

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="pb-2 border-b border-line/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="font-display font-bold text-2xl text-ink">
            سجل الطلبات
          </h2>
          <p className="font-body text-xs text-ink-soft mt-0.5">
            متابعة الطلبات الجارية وتاريخ طلباتك السابقة في الحرم الجامعي
          </p>
        </div>

        <Link href="/student/kiosks">
          <button
            type="button"
            className="text-xs font-body font-bold text-primary-ink bg-primary-soft hover:bg-primary px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Store className="w-3.5 h-3.5" />
            <span>طلب جديد</span>
          </button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as 'active' | 'history')}
      />

      {/* Orders List */}
      <div className="space-y-3 pt-1">
        {displayedOrders.length > 0 ? (
          displayedOrders.map((order) => {
            const pillStatus =
              order.status === 'preparing'
                ? 'preparing'
                : order.status === 'ready_for_pickup'
                ? 'ready'
                : order.status === 'picked_up'
                ? 'picked_up'
                : order.status === 'rejected'
                ? 'rejected'
                : order.status === 'no_show'
                ? 'no_show'
                : 'pending';

            return (
              <Link
                key={order.id}
                href={`/student/orders/${order.id}`}
                className="block bg-surface border border-line/70 hover:border-primary/50 rounded-2xl p-4 shadow-warm hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-ink font-mono-nums">
                      #{order.orderNumber}
                    </span>
                    <span className="font-body text-xs text-ink-soft">
                      · {order.kioskName}
                    </span>
                  </div>
                  <StatusPill status={pillStatus} />
                </div>

                <p className="font-body text-xs text-ink-soft leading-relaxed line-clamp-1 mb-2">
                  {order.items.map((it) => `${it.name} × ${it.quantity}`).join('، ')}
                </p>

                <div className="flex items-center justify-between pt-2.5 border-t border-line/50 text-xs font-body">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-ink font-mono-nums">
                      {formatEGP(order.total)}
                    </span>
                    {order.createdAt && (
                      <span className="text-[11px] text-ink-soft">
                        · {formatArabicTime(order.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-accent font-bold group-hover:-translate-x-1 transition-transform">
                    <span>عرض التذكرة</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <EmptyState
            icon={<Clock className="w-8 h-8" />}
            title={activeTab === 'active' ? 'لا توجد طلبات نشطة حالياً' : 'لا توجد طلبات سابقة'}
            description={
              activeTab === 'active'
                ? 'اطلب الآن من أي كشك بالجامعة واستلم طلبك بكل سهولة وتتبع خطوات التحضير.'
                : 'الطلبات التي تكتمل أو تستلمها ستظهر هنا في سجلك الدائم.'
            }
            actionLabel={activeTab === 'active' ? 'تصفح الأكشاك' : undefined}
            onAction={activeTab === 'active' ? () => router.push('/student/kiosks') : undefined}
          />
        )}
      </div>
    </div>
  );
}

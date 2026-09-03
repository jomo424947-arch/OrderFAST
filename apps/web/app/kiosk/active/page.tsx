'use client';

import React, { useState, useEffect } from 'react';
import { useOrderStore } from '@/stores/useOrderStore';
import { useKioskStore } from '@/stores/useKioskStore';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatEGP, formatArabicTime } from '@/lib/formatters';
import { Clock, CheckCheck, AlertOctagon, UserCheck, ChefHat, PackageCheck, AlertTriangle } from 'lucide-react';
import { OrderStatus } from '@/types';

export default function CashierActiveOrdersPage() {
  const { activeKioskId } = useKioskStore();
  const { getKioskActiveOrders, fetchKioskOrders, setOrderStatus } = useOrderStore();

  useEffect(() => {
    if (activeKioskId) {
      fetchKioskOrders(activeKioskId);
    }
  }, [activeKioskId, fetchKioskOrders]);

  const activeOrders = getKioskActiveOrders(activeKioskId);

  const [activeFilter, setActiveFilter] = useState<'all' | 'preparing' | 'ready'>('all');

  const filteredOrders = activeOrders.filter((o) => {
    if (activeFilter === 'preparing') return o.status === 'ACCEPTED' || o.status === 'PREPARING';
    if (activeFilter === 'ready') return o.status === 'READY';
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-line/60">
        <div>
          <h2 className="font-display font-bold text-2xl text-ink">
            الأوردرات النشطة
          </h2>
          <p className="font-body text-xs text-ink-soft">
            إدارة وتحديث مراحل التحضير وتسليم الطلبات
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-body font-bold border transition-all ${activeFilter === 'all'
                ? 'bg-primary text-primary-ink border-primary'
                : 'bg-surface text-ink-soft border-line hover:bg-canvas'
              }`}
          >
            الكل ({activeOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('preparing')}
            className={`px-3 py-1.5 rounded-xl text-xs font-body font-bold border transition-all ${activeFilter === 'preparing'
                ? 'bg-primary text-primary-ink border-primary'
                : 'bg-surface text-ink-soft border-line hover:bg-canvas'
              }`}
          >
            جاري التجهيز ({activeOrders.filter((o) => o.status === 'ACCEPTED' || o.status === 'PREPARING').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('ready')}
            className={`px-3 py-1.5 rounded-xl text-xs font-body font-bold border transition-all ${activeFilter === 'ready'
                ? 'bg-accent text-white border-accent'
                : 'bg-surface text-ink-soft border-line hover:bg-canvas'
              }`}
          >
            جاهز للاستلام ({activeOrders.filter((o) => o.status === 'READY').length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            return (
              <div
                key={order.id}
                className="bg-surface rounded-2xl p-5 border border-line/80 shadow-warm space-y-3.5 flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-black text-ink font-mono-nums">
                        {order.orderNumber}
                      </span>
                      <span className="font-body text-xs text-ink-soft">
                        ({order.studentName} - {order.studentCollege})
                      </span>
                    </div>
                    <StatusPill status={order.status} />
                  </div>

                  {/* Items */}
                  <div className="bg-canvas/60 rounded-xl p-3 text-xs font-body text-ink space-y-1 border border-line/50">
                    {order.items.map((it) => (
                      <div key={it.id} className="flex justify-between">
                        <span>{it.name}</span>
                        <span className="font-mono font-bold">× {it.quantity}</span>
                      </div>
                    ))}
                    <div className="pt-2 mt-2 border-t border-line/60 flex justify-between font-bold text-ink">
                      <span>المطلوب تحصيله كاش / محفظة:</span>
                      <span className="font-mono text-primary-ink">{formatEGP(order.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Operations Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line/60">
                  {(order.status === 'ACCEPTED' || order.status === 'PREPARING') && (
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => setOrderStatus(order.id, 'READY')}
                      className="flex-1 shadow-sm"
                    >
                      <PackageCheck className="w-4 h-4 ml-1.5" />
                      <span>جاهز للاستلام</span>
                    </Button>
                  )}

                  {order.status === 'READY' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setOrderStatus(order.id, 'COMPLETED')}
                      className="flex-1 shadow-sm"
                    >
                      <CheckCheck className="w-4 h-4 ml-1.5" />
                      <span>تم تسليم الطلب وتحصيل المبلغ</span>
                    </Button>
                  )}

                  {/* No-show Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('هل أنت متأكد من تسجيل عدم حضور الطالب لهذا الطلب؟')) {
                        setOrderStatus(order.id, 'NO_SHOW');
                      }
                    }}
                    className="text-danger hover:bg-danger-soft px-3"
                    title="تسجيل عدم الحضور"
                  >
                    <AlertTriangle className="w-4 h-4 ml-1 text-danger" />
                    <span className="hidden sm:inline">لم يحضر</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<ChefHat className="w-8 h-8" />}
          title="لا توجد أوردرات نشطة حالياً"
          description="الأوردرات التي تقبلها من قائمة 'الواردة' ستنتقل إلى هنا لمتابعة التحضير والتسليم."
        />
      )}
    </div>
  );
}

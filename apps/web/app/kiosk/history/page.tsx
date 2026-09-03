'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useOrderStore } from '@/stores/useOrderStore';
import { useKioskStore } from '@/stores/useKioskStore';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/ui/SearchInput';
import { formatEGP, formatArabicTime } from '@/lib/formatters';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  CheckCheck,
  Archive,
  Search,
  Receipt,
  User,
  Building2,
  Calendar,
} from 'lucide-react';
import { Order } from '@/types';

export default function KioskTodayOrdersPage() {
  const { activeKioskId, kiosks } = useKioskStore();
  const { orders, fetchKioskOrders } = useOrderStore();

  const [filter, setFilter] = useState<'all' | 'completed' | 'active' | 'cancelled' | 'no_show'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (activeKioskId) {
      fetchKioskOrders(activeKioskId);
    }
  }, [activeKioskId, fetchKioskOrders]);

  const currentKiosk = kiosks.find((k) => k.id === activeKioskId);

  // Filter strictly by today's date
  const todayStr = new Date().toDateString();
  const todayOrders = useMemo(() => {
    return orders.filter((o) => {
      if (o.kioskId !== activeKioskId) return false;
      if (o.createdAt) {
        return new Date(o.createdAt).toDateString() === todayStr;
      }
      return true;
    });
  }, [orders, activeKioskId, todayStr]);

  // Counts for each status category today
  const completedOrders = useMemo(
    () => todayOrders.filter((o) => o.status === 'COMPLETED'),
    [todayOrders]
  );
  const activeKitchenOrders = useMemo(
    () =>
      todayOrders.filter(
        (o) =>
          o.status === 'PENDING_KIOSK' ||
          o.status === 'ACCEPTED' ||
          o.status === 'PREPARING' ||
          o.status === 'READY'
      ),
    [todayOrders]
  );
  const cancelledOrders = useMemo(
    () =>
      todayOrders.filter(
        (o) => o.status === 'CANCELLED' || o.status === 'REJECTED'
      ),
    [todayOrders]
  );
  const noShowOrders = useMemo(
    () =>
      todayOrders.filter(
        (o) => o.status === 'NO_SHOW' || o.status === 'EXPIRED'
      ),
    [todayOrders]
  );

  const totalCollectedRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);

  // Filtered orders list based on active tab and search
  const filteredOrders = useMemo(() => {
    return todayOrders.filter((order) => {
      // Tab Filter
      if (filter === 'completed' && order.status !== 'COMPLETED') return false;
      if (
        filter === 'active' &&
        order.status !== 'PENDING_KIOSK' &&
        order.status !== 'ACCEPTED' &&
        order.status !== 'PREPARING' &&
        order.status !== 'READY'
      )
        return false;
      if (
        filter === 'cancelled' &&
        order.status !== 'CANCELLED' &&
        order.status !== 'REJECTED'
      )
        return false;
      if (
        filter === 'no_show' &&
        order.status !== 'NO_SHOW' &&
        order.status !== 'EXPIRED'
      )
        return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNum = order.orderNumber.toLowerCase().includes(q);
        const matchesStudent = (order.studentName || '').toLowerCase().includes(q);
        const matchesItems = order.items.some((it) =>
          it.name.toLowerCase().includes(q)
        );
        if (!matchesNum && !matchesStudent && !matchesItems) return false;
      }

      return true;
    });
  }, [todayOrders, filter, searchQuery]);

  // Formatted date string for today
  const todayArabicDate = useMemo(() => {
    return new Date().toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with Date Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line/60">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1">
            <h2 className="font-display font-bold text-2xl text-ink">
              أوردرات اليوم
            </h2>
            <div className="inline-flex items-center gap-1.5 text-xs font-body font-bold text-accent bg-accent-soft px-3 py-1 rounded-full border border-accent/25 shadow-xs">
              <Calendar className="w-3.5 h-3.5" />
              <span>{todayArabicDate}</span>
            </div>
          </div>
          <p className="font-body text-xs text-ink-soft">
            {currentKiosk?.name || 'الكشك'} · سجل ومتابعة كافة أوردرات الكشك المسجلة لتاريخ اليوم فقط
          </p>
        </div>

        {/* Search */}
        <div className="w-full sm:w-64">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder="بحث برقم الأوردر أو الطالب..."
          />
        </div>
      </div>

      {/* Summary Metrics of Today */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface border border-line/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-ink-soft mb-1.5">
            <span className="font-body">إجمالي أوردرات اليوم</span>
            <Archive className="w-4 h-4 text-ink-soft" />
          </div>
          <p className="font-display font-black text-2xl text-ink font-mono-nums">
            {todayOrders.length}
          </p>
        </div>

        <div className="bg-surface border border-line/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-accent mb-1.5">
            <span className="font-body font-bold">مكتملة ومستلمة</span>
            <CheckCheck className="w-4 h-4 text-accent" />
          </div>
          <p className="font-display font-black text-2xl text-accent font-mono-nums">
            {completedOrders.length}
          </p>
          <span className="text-[11px] font-mono text-ink-soft mt-1 block">
            المحصل: {formatEGP(totalCollectedRevenue)}
          </span>
        </div>

        <div className="bg-surface border border-line/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-primary-ink mb-1.5">
            <span className="font-body font-bold">قيد التحضير والتسليم</span>
            <Clock className="w-4 h-4 text-primary-ink" />
          </div>
          <p className="font-display font-black text-2xl text-primary-ink font-mono-nums">
            {activeKitchenOrders.length}
          </p>
        </div>

        <div className="bg-surface border border-line/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-danger mb-1.5">
            <span className="font-body font-bold">ملغية ومرفوضة</span>
            <XCircle className="w-4 h-4 text-danger" />
          </div>
          <p className="font-display font-black text-2xl text-danger font-mono-nums">
            {cancelledOrders.length}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-body font-bold border transition-all ${
            filter === 'all'
              ? 'bg-primary text-primary-ink border-primary shadow-sm'
              : 'bg-surface text-ink-soft border-line hover:bg-canvas'
          }`}
        >
          الكل ({todayOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('completed')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-body font-bold border transition-all ${
            filter === 'completed'
              ? 'bg-accent text-white border-accent shadow-sm'
              : 'bg-surface text-ink-soft border-line hover:bg-canvas'
          }`}
        >
          مكتملة ومستلمة ({completedOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('active')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-body font-bold border transition-all ${
            filter === 'active'
              ? 'bg-primary text-primary-ink border-primary shadow-sm'
              : 'bg-surface text-ink-soft border-line hover:bg-canvas'
          }`}
        >
          قيد التحضير ({activeKitchenOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('cancelled')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-body font-bold border transition-all ${
            filter === 'cancelled'
              ? 'bg-danger text-white border-danger shadow-sm'
              : 'bg-surface text-ink-soft border-line hover:bg-canvas'
          }`}
        >
          ملغية ومرفوضة ({cancelledOrders.length})
        </button>
        {noShowOrders.length > 0 && (
          <button
            type="button"
            onClick={() => setFilter('no_show')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-body font-bold border transition-all ${
              filter === 'no_show'
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-surface text-ink-soft border-line hover:bg-canvas'
            }`}
          >
            لم يحضر ({noShowOrders.length})
          </button>
        )}
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-surface rounded-3xl p-5 border border-line/80 shadow-warm flex flex-col justify-between space-y-4 hover:border-line transition-all"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl font-black text-ink font-mono-nums">
                      {order.orderNumber}
                    </span>
                    <span className="font-body text-xs text-ink-soft">
                      {order.createdAt ? formatArabicTime(order.createdAt) : ''}
                    </span>
                  </div>
                  <StatusPill status={order.status} />
                </div>

                {/* Student Info */}
                <div className="flex items-center justify-between text-xs font-body bg-canvas/60 px-3 py-2 rounded-xl border border-line/50">
                  <div className="flex items-center gap-1.5 text-ink font-semibold">
                    <User className="w-3.5 h-3.5 text-ink-soft" />
                    <span>{order.studentName || 'طالب'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-ink-soft">
                    <Building2 className="w-3 h-3" />
                    <span className="truncate max-w-[140px]">
                      {order.studentCollege || 'الجامعة'}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-1.5 pt-1">
                  {order.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs font-body py-1 border-b border-line/40 last:border-0"
                    >
                      <span className="text-ink font-medium">
                        {it.name} <span className="text-ink-soft font-mono font-bold">× {it.quantity}</span>
                      </span>
                      <span className="font-mono font-bold text-ink font-mono-nums">
                        {formatEGP(it.price * it.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Rejection / Cancellation Reason Note */}
                {(order.rejectionReason || order.cancellationReason) && (
                  <div className="bg-danger-soft/60 border border-danger/30 rounded-xl p-2.5 text-xs font-body text-danger">
                    <span className="font-bold block mb-0.5">سبب الرفض / الإلغاء:</span>
                    <span>{order.rejectionReason || order.cancellationReason}</span>
                  </div>
                )}
              </div>

              {/* Total & Breakdown Footer */}
              <div className="pt-3 border-t border-line/60 flex items-center justify-between text-xs font-body">
                <span className="text-ink-soft">
                  (شامل رسوم الخدمة 1 ج.م)
                </span>
                <div className="text-left">
                  <span className="text-[11px] text-ink-soft ml-1.5">الإجمالي:</span>
                  <span className="font-mono text-base font-black text-ink font-mono-nums">
                    {formatEGP(order.total)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Archive className="w-8 h-8 stroke-[2]" />}
          title={
            searchQuery
              ? 'لا توجد نتائج مطابقة لبحثك'
              : filter === 'all'
              ? 'لا توجد أي أوردرات مسجلة لتاريخ اليوم حتى الآن'
              : 'لا توجد أوردرات في هذا القسم لتاريخ اليوم'
          }
          description={
            searchQuery
              ? 'تأكد من رقم الأوردر أو اسم الطالب وحاول مجدداً'
              : 'الطلبات التي يقدمها الطلاب اليوم ستظهر هنا بحالتها تلقائياً.'
          }
        />
      )}
    </div>
  );
}

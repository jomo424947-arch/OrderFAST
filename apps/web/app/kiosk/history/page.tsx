'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useOrderStore } from '@/stores/useOrderStore';
import { useKioskStore } from '@/stores/useKioskStore';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/ui/SearchInput';
import { Modal } from '@/components/ui/Modal';
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
  Smartphone,
  Banknote,
  MessageSquareQuote,
  Eye,
  ExternalLink,
  CreditCard,
  CalendarRange,
} from 'lucide-react';
import { Order } from '@/types';

export default function KioskOrdersHistoryPage() {
  const { activeKioskId, kiosks } = useKioskStore();
  const { orders, fetchKioskOrders } = useOrderStore();

  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [filter, setFilter] = useState<'all' | 'completed' | 'active' | 'cancelled' | 'no_show'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewReceiptOrder, setPreviewReceiptOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (activeKioskId) {
      fetchKioskOrders(activeKioskId);
    }
  }, [activeKioskId, fetchKioskOrders]);

  const currentKiosk = kiosks.find((k) => k.id === activeKioskId);

  // Filter orders by the selected Time Range (اليوم / أسبوع / شهر / الكل)
  const timeFilteredOrders = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneWeekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    return orders.filter((o) => {
      if (o.kioskId !== activeKioskId) return false;
      if (!o.createdAt) return true;
      const orderTime = new Date(o.createdAt).getTime();

      if (timeRange === 'today') {
        return orderTime >= todayStart;
      }
      if (timeRange === 'week') {
        return orderTime >= oneWeekAgo;
      }
      if (timeRange === 'month') {
        return orderTime >= oneMonthAgo;
      }
      return true; // 'all'
    });
  }, [orders, activeKioskId, timeRange]);

  // Dynamic KPI Counts for the selected time range
  const completedOrders = useMemo(
    () => timeFilteredOrders.filter((o) => o.status === 'COMPLETED'),
    [timeFilteredOrders]
  );
  const activeKitchenOrders = useMemo(
    () =>
      timeFilteredOrders.filter(
        (o) =>
          o.status === 'PENDING_KIOSK' ||
          o.status === 'ACCEPTED' ||
          o.status === 'PREPARING' ||
          o.status === 'READY'
      ),
    [timeFilteredOrders]
  );
  const cancelledOrders = useMemo(
    () =>
      timeFilteredOrders.filter(
        (o) => o.status === 'CANCELLED' || o.status === 'REJECTED'
      ),
    [timeFilteredOrders]
  );
  const noShowOrders = useMemo(
    () =>
      timeFilteredOrders.filter(
        (o) => o.status === 'NO_SHOW' || o.status === 'EXPIRED'
      ),
    [timeFilteredOrders]
  );

  const totalCollectedRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);

  // Filtered orders list based on status tab and live search
  const filteredOrders = useMemo(() => {
    return timeFilteredOrders.filter((order) => {
      // Status Tab Filter
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

      // Search Filter (Order Number, Student Name, or Sender Phone)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesNum = order.orderNumber.toLowerCase().includes(query);
        const matchesName = (order.studentName || '').toLowerCase().includes(query);
        const matchesPhone = (order.transferSenderPhone || '').toLowerCase().includes(query);
        return matchesNum || matchesName || matchesPhone;
      }

      return true;
    });
  }, [timeFilteredOrders, filter, searchQuery]);

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'today':
        return 'اليوم';
      case 'week':
        return 'آخر 7 أيام (أسبوع)';
      case 'month':
        return 'آخر 30 يوم (شهر)';
      case 'all':
        return 'جميع الفترات';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-line/60">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-display font-bold text-2xl text-ink">
              سجل الأوردرات والمبيعات
            </h2>
            <span className="flex items-center gap-1 bg-primary-soft text-primary-ink px-2.5 py-0.5 rounded-full text-xs font-bold">
              <CalendarRange className="w-3.5 h-3.5" />
              <span>{getTimeRangeLabel()}</span>
            </span>
          </div>
          <p className="font-body text-xs text-ink-soft mt-0.5">
            {currentKiosk?.name} · سجل شامل لجميع الطلبات والمبيعات مع تفاصيل الدفع الإلكتروني
          </p>
        </div>

        {/* Live Search Bar */}
        <div className="w-full sm:w-72">
          <SearchInput
            placeholder="بحث برقم الأوردر، الطالب، أو رقم المحفظة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 1. Time Range Selector Strip (اليوم | آخر 7 أيام | آخر 30 يوم | كل الأوردرات) */}
      <div className="bg-surface border border-line/80 rounded-2xl p-2.5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <span className="text-xs font-display font-bold text-ink-soft px-1 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-accent" />
          <span>تحديد النطاق الزمني للسجل:</span>
        </span>

        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setTimeRange('today')}
            className={`px-3.5 py-2 rounded-xl text-xs font-display font-bold transition-all text-center cursor-pointer ${
              timeRange === 'today'
                ? 'bg-primary text-primary-ink shadow-sm ring-1 ring-primary/30'
                : 'bg-canvas text-ink-soft hover:text-ink hover:bg-line/40'
            }`}
          >
            اليوم
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('week')}
            className={`px-3.5 py-2 rounded-xl text-xs font-display font-bold transition-all text-center cursor-pointer ${
              timeRange === 'week'
                ? 'bg-primary text-primary-ink shadow-sm ring-1 ring-primary/30'
                : 'bg-canvas text-ink-soft hover:text-ink hover:bg-line/40'
            }`}
          >
            آخر أسبوع (7 أيام)
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('month')}
            className={`px-3.5 py-2 rounded-xl text-xs font-display font-bold transition-all text-center cursor-pointer ${
              timeRange === 'month'
                ? 'bg-primary text-primary-ink shadow-sm ring-1 ring-primary/30'
                : 'bg-canvas text-ink-soft hover:text-ink hover:bg-line/40'
            }`}
          >
            آخر شهر (30 يوم)
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-display font-bold transition-all text-center cursor-pointer ${
              timeRange === 'all'
                ? 'bg-primary text-primary-ink shadow-sm ring-1 ring-primary/30'
                : 'bg-canvas text-ink-soft hover:text-ink hover:bg-line/40'
            }`}
          >
            جميع الأوردرات
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface border border-line/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-ink-soft mb-1.5">
            <span className="font-body font-bold truncate">إجمالي الأوردرات ({getTimeRangeLabel()})</span>
            <Receipt className="w-4 h-4 text-primary flex-shrink-0" />
          </div>
          <p className="font-display font-black text-2xl text-ink font-mono-nums">
            {timeFilteredOrders.length}
          </p>
        </div>

        <div className="bg-surface border border-line/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-accent mb-1.5">
            <span className="font-body font-bold">تم تسليمها بنجاح</span>
            <CheckCheck className="w-4 h-4 text-accent flex-shrink-0" />
          </div>
          <p className="font-display font-black text-2xl text-accent font-mono-nums">
            {completedOrders.length}
          </p>
        </div>

        <div className="bg-surface border border-line/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-ink-soft mb-1.5">
            <span className="font-body font-bold">إجمالي الإيرادات المحصلة</span>
            <Archive className="w-4 h-4 text-accent flex-shrink-0" />
          </div>
          <p className="font-display font-black text-xl text-ink font-mono-nums truncate">
            {formatEGP(totalCollectedRevenue)}
          </p>
        </div>

        <div className="bg-surface border border-line/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-danger mb-1.5">
            <span className="font-body font-bold">ملغية ومرفوضة</span>
            <XCircle className="w-4 h-4 text-danger flex-shrink-0" />
          </div>
          <p className="font-display font-black text-2xl text-danger font-mono-nums">
            {cancelledOrders.length}
          </p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-body font-bold border transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-primary text-primary-ink border-primary shadow-sm'
              : 'bg-surface text-ink-soft border-line hover:bg-canvas'
          }`}
        >
          الكل ({timeFilteredOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('completed')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-body font-bold border transition-all cursor-pointer ${
            filter === 'completed'
              ? 'bg-accent text-white border-accent shadow-sm'
              : 'bg-surface text-ink-soft border-line hover:bg-canvas'
          }`}
        >
          مكتملة ومستلمة ({completedOrders.length})
        </button>
        {activeKitchenOrders.length > 0 && (
          <button
            type="button"
            onClick={() => setFilter('active')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-body font-bold border transition-all cursor-pointer ${
              filter === 'active'
                ? 'bg-primary text-primary-ink border-primary shadow-sm'
                : 'bg-surface text-ink-soft border-line hover:bg-canvas'
            }`}
          >
            قيد التحضير ({activeKitchenOrders.length})
          </button>
        )}
        <button
          type="button"
          onClick={() => setFilter('cancelled')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-body font-bold border transition-all cursor-pointer ${
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
            className={`px-3.5 py-1.5 rounded-xl text-xs font-body font-bold border transition-all cursor-pointer ${
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
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl font-black text-ink font-mono-nums">
                      {order.orderNumber}
                    </span>
                    <span className="font-body text-xs text-ink-soft">
                      {order.createdAt ? formatArabicTime(order.createdAt) : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {order.paymentMethod === 'digital_wallet' ? (
                      <span className="inline-flex items-center gap-1 font-body text-[10px] font-bold text-accent bg-accent-soft px-2.5 py-0.5 rounded-full border border-accent/30">
                        <Smartphone className="w-3 h-3" />
                        <span>{order.onlinePaymentType === 'instapay' ? 'انستا باي' : 'محفظة إلكترونية'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-body text-[10px] font-bold text-primary-ink bg-primary-soft px-2.5 py-0.5 rounded-full border border-primary/20">
                        <Banknote className="w-3 h-3" />
                        <span>كاش عند الاستلام</span>
                      </span>
                    )}
                    <StatusPill status={order.status} />
                  </div>
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

                {/* Student Order Notes (ملاحظة الطالب على الأوردر) */}
                {order.orderNotes && (
                  <div className="bg-primary-soft/40 border border-primary/40 rounded-2xl p-3 text-xs font-body text-primary-ink flex items-start gap-2 shadow-2xs">
                    <MessageSquareQuote className="w-4 h-4 flex-shrink-0 text-primary-ink mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <span className="font-black block text-[11px] text-primary-ink">ملاحظة الطالب على الأوردر:</span>
                      <p className="font-bold text-xs text-ink mt-0.5 leading-relaxed break-words">
                        &quot;{order.orderNotes}&quot;
                      </p>
                    </div>
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-1.5 pt-1">
                  {order.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="text-xs font-body py-1.5 border-b border-line/40 last:border-0 space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-ink font-bold">
                          {it.name} <span className="text-ink-soft font-mono font-bold">× {it.quantity}</span>
                        </span>
                        <span className="font-mono font-bold text-ink font-mono-nums">
                          {formatEGP(it.price * it.quantity)}
                        </span>
                      </div>
                      {it.specialInstructions && (
                        <p className="text-[11px] font-body text-ink-soft italic pr-2">
                          ملاحظة: {it.specialInstructions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Electronic Payment Details (تفاصيل الدفع الإلكتروني) */}
                {(order.paymentMethod === 'digital_wallet' || order.onlinePaymentType || order.transferImageUrl || order.transferSenderPhone) && (
                  <div className={`rounded-2xl p-3.5 space-y-2.5 border text-right ${
                    order.paymentStatus === 'paid'
                      ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                      : 'bg-accent-soft/30 border-accent/40 text-ink'
                  }`}>
                    <div className="flex items-center justify-between pb-2 border-b border-line/40">
                      <span className="font-body text-xs font-black flex items-center gap-1.5 text-ink">
                        <CreditCard className="w-4 h-4 text-accent" />
                        <span>تفاصيل التحويل الإلكتروني</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-body font-bold px-2 py-0.5 rounded-full ${
                          order.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {order.paymentStatus === 'paid' ? 'تم تأكيد الدفع' : 'بانتظار التحقق'}
                        </span>
                        <span className="font-mono text-xs font-black text-accent bg-surface px-2 py-0.5 rounded-lg border border-line/60 font-mono-nums">
                          {formatEGP(order.transferAmount || order.total)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-0.5">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div>
                          <span className="font-body text-[11px] text-ink-soft block">
                            {order.onlinePaymentType === 'instapay' ? 'عنوان أو رقم انستا باي المحول منه:' : 'رقم المحفظة المحول منها:'}
                          </span>
                          <span className="font-mono text-xs font-black text-ink font-mono-nums dir-ltr text-right block truncate mt-0.5">
                            {order.transferSenderPhone || 'غير مسجل'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] font-body text-ink-soft">طريقة الدفع:</span>
                          <span className="text-[10px] font-body font-bold text-ink">
                            {order.onlinePaymentType === 'instapay' ? 'انستا باي (InstaPay)' : 'محفظة إلكترونية'}
                          </span>
                        </div>
                      </div>

                      {/* Receipt Thumbnail & Preview Trigger */}
                      {order.transferImageUrl ? (
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewReceiptOrder(order)}
                            className="group relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-accent/40 hover:border-accent shadow-xs transition-all active:scale-95 bg-surface cursor-pointer"
                            title="اضغط لمعاينة وتكبير صورة الإيصال"
                          >
                            <Image
                              src={order.transferImageUrl}
                              alt="صورة تحويل الدفع"
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/15 flex items-center justify-center text-white transition-colors">
                              <Eye className="w-4 h-4 drop-shadow" />
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewReceiptOrder(order)}
                            className="text-[10px] font-body font-bold text-accent hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>معاينة الإيصال</span>
                          </button>
                        </div>
                      ) : (
                        <div className="px-2.5 py-1.5 bg-canvas rounded-xl border border-line/60 text-center flex-shrink-0">
                          <span className="text-[10px] font-body text-ink-soft block">صورة التحويل:</span>
                          <span className="text-[10px] font-body font-bold text-danger">لم ترفق صورة</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                  (شامل رسوم الخدمة {order.fees !== undefined ? formatEGP(order.fees) : '3 ج.م'})
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
              : `لا توجد أي أوردرات مسجلة لنطاق (${getTimeRangeLabel()})`
          }
          description={
            searchQuery
              ? 'تأكد من رقم الأوردر أو اسم الطالب أو رقم المحفظة وحاول مجدداً'
              : 'يمكنك التبديل بين النطاقات الزمنية (أسبوع أو شهر أو جميع الفترات) من الشريط أعلاه.'
          }
        />
      )}

      {/* Receipt Full Preview Modal */}
      {previewReceiptOrder && previewReceiptOrder.transferImageUrl && (
        <Modal
          isOpen={!!previewReceiptOrder}
          onClose={() => setPreviewReceiptOrder(null)}
          title={`إيصال التحويل الإلكتروني - طلب ${previewReceiptOrder.orderNumber}`}
          maxWidth="lg"
        >
          <div className="space-y-4 pt-1 text-right">
            <div className="relative w-full h-[60vh] max-h-[480px] bg-black/5 rounded-2xl overflow-hidden border border-line flex items-center justify-center">
              <Image
                src={previewReceiptOrder.transferImageUrl}
                alt="إيصال التحويل الكامل"
                fill
                className="object-contain"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-line/60">
              <div className="text-xs font-body text-ink-soft space-y-1 text-right w-full sm:w-auto">
                <p>
                  <span className="text-ink font-bold">المبلغ المحول:</span>{' '}
                  <span className="font-mono font-black font-mono-nums text-ink">
                    {formatEGP(previewReceiptOrder.transferAmount || previewReceiptOrder.total)}
                  </span>
                </p>
                <p>
                  <span className="text-ink font-bold">رقم / حساب المحول منه:</span>{' '}
                  <span className="font-mono font-bold font-mono-nums dir-ltr text-ink">
                    {previewReceiptOrder.transferSenderPhone || 'غير مسجل'}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <a
                  href={previewReceiptOrder.transferImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-body font-bold text-accent hover:underline inline-flex items-center gap-1.5 bg-accent-soft px-3 py-2 rounded-xl border border-accent/30 transition-colors"
                >
                  <span>فتح الصورة بحجمها الأصلي</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewReceiptOrder(null)}
                  className="px-4 py-2 bg-line/60 hover:bg-line text-ink rounded-xl text-xs font-body font-bold transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

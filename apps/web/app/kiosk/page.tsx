'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useOrderStore } from '@/stores/useOrderStore';
import { useKioskStore } from '@/stores/useKioskStore';
import { CashierIncomingOrderCard } from '@/components/orders/CashierIncomingOrderCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatEGP } from '@/lib/formatters';
import {
  Inbox,
  Clock,
  UtensilsCrossed,
  DollarSign,
  ArrowLeft,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  Store,
  Settings,
  Sparkles,
  Zap,
  ChefHat,
  PackageCheck,
  CheckCheck,
} from 'lucide-react';

import { useAuthStore } from '@/stores/useAuthStore';

export default function CashierDashboardPage() {
  const { cashier, logout } = useAuthStore();
  const { activeKioskId, kiosks, menuItems, kioskStats, fetchKiosks, fetchMenu, fetchKioskStats } = useKioskStore();
  const {
    getKioskIncomingOrders,
    getKioskActiveOrders,
    orders,
    fetchKioskOrders,
    acceptOrder,
    rejectOrder,
    setOrderStatus,
  } = useOrderStore();

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetOrderId, setTargetOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('نفاد بعض المكونات المطلوبة');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const isUnassigned = cashier && !cashier.kioskId && (!activeKioskId || !kiosks.some((k) => k.id === activeKioskId));

  const currentKiosk = kiosks.find((k) => k.id === activeKioskId) || kiosks[0] || {
    id: activeKioskId,
    name: 'الكشك',
    collegeLocation: 'كلية الهندسة',
    openingHours: '8:00 ص - 4:00 م',
    isOpen: true,
    category: 'مشروبات وسناكس',
    rating: 4.8,
    estimatedWaitMins: 15,
  };

  useEffect(() => {
    fetchKiosks();
  }, [fetchKiosks]);

  useEffect(() => {
    if (activeKioskId) {
      fetchKioskOrders(activeKioskId);
      fetchMenu(activeKioskId, true);
      fetchKioskStats(activeKioskId);
    }
  }, [activeKioskId, fetchKioskOrders, fetchMenu, fetchKioskStats]);

  const incomingOrders = getKioskIncomingOrders(activeKioskId);
  const activeOrders = getKioskActiveOrders(activeKioskId);

  // Kiosk menu items
  const kioskMenuItems = useMemo(() => {
    return menuItems.filter((i) => i.kioskId === activeKioskId || !i.kioskId);
  }, [menuItems, activeKioskId]);

  const unavailableItemsCount = kioskMenuItems.filter((i) => !i.isAvailable).length;

  const currentKioskDbStats = kioskStats[activeKioskId];

  // Today's total sales for this kiosk
  const todayKioskOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.kioskId === activeKioskId &&
        (o.status === 'COMPLETED' ||
          o.status === 'READY' ||
          o.status === 'PREPARING' ||
          o.status === 'ACCEPTED')
    );
  }, [orders, activeKioskId]);

  const todaySales = useMemo(() => {
    if (currentKioskDbStats?.todaySalesPiasters !== undefined) {
      return currentKioskDbStats.todaySalesPiasters / 100;
    }
    return todayKioskOrders.reduce((sum, o) => sum + o.total, 0);
  }, [todayKioskOrders, currentKioskDbStats]);

  const todayCompletedCount = currentKioskDbStats?.todayCompletedCount ?? todayKioskOrders.length;

  // Urgent 2 incoming orders preview
  const urgentIncomingOrders = incomingOrders.slice(0, 2);

  const handleAccept = (orderId: string) => {
    acceptOrder(orderId);
    setActionFeedback('تم قبول الأوردر ونقله لقائمة التحضير!');
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleOpenReject = (orderId: string) => {
    setTargetOrderId(orderId);
    setRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (targetOrderId) {
      rejectOrder(targetOrderId, rejectReason);
      setRejectModalOpen(false);
      setTargetOrderId(null);
      setActionFeedback('تم رفض الأوردر وإخطار الطالب.');
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  if (isUnassigned) {
    return (
      <div className="max-w-md mx-auto my-12 bg-surface border border-line rounded-3xl p-8 text-center space-y-4 shadow-floating animate-in fade-in duration-300">
        <div className="w-14 h-14 rounded-2xl bg-accent-soft text-accent flex items-center justify-center mx-auto">
          <Store className="w-7 h-7" />
        </div>
        <h2 className="font-display font-bold text-xl text-ink">
          مرحباً بك {cashier?.name}! 👋
        </h2>
        <div className="bg-canvas border border-line rounded-2xl p-4 text-xs font-body text-ink-soft leading-relaxed text-right">
          <p className="font-bold text-ink mb-1 flex items-center gap-1.5">
            <span>⏳</span>
            <span>حسابك بانتظار التعيين لكشك</span>
          </p>
          تم إنشاء حسابك كموظف كاشير بنجاح! يرجى التواصل مع مدير النظام (الأدمن) لتعيينك للكشك أو الكافيه التابع لك من لوحة التحكم، لتتمكن من استقبال الطلبات وإدارة المنيو فوراً.
        </div>
        <Button variant="outline" size="sm" onClick={logout} className="w-full mt-2">
          تسجيل الخروج
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header / Kiosk Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-line/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-display font-bold text-2xl text-ink">
              {currentKiosk.name}
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-body font-bold ${
                currentKiosk.isOpen
                  ? 'bg-accent-soft text-accent'
                  : 'bg-danger-soft text-danger'
              }`}
            >
              {currentKiosk.isOpen ? 'مفتوح لاستقبال الطلبات' : 'مغلق مؤقتاً'}
            </span>
          </div>
          <p className="font-body text-xs text-ink-soft mt-0.5">
            {currentKiosk.collegeLocation} · {currentKiosk.openingHours}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/kiosk/incoming">
            <Button
              variant={incomingOrders.length > 0 ? 'primary' : 'outline'}
              size="sm"
              className="shadow-warm relative"
            >
              <Inbox className="w-4 h-4 ml-1.5" />
              <span>الأوردرات الواردة</span>
              {incomingOrders.length > 0 && (
                <span className="font-mono text-xs font-bold bg-danger text-white px-2 py-0.2 rounded-full mr-1.5 animate-pulse">
                  {incomingOrders.length}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionFeedback && (
        <div className="bg-accent-soft border border-accent/30 text-accent rounded-2xl p-3.5 text-xs font-body font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* 4 Core Statistics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Incoming Orders Stat */}
        <Link href="/kiosk/incoming">
          <Card
            hoverable
            className={`p-4 sm:p-5 h-full border-2 transition-all ${
              incomingOrders.length > 0
                ? 'border-danger/50 bg-danger-soft/10 shadow-warm'
                : 'border-line/70'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  incomingOrders.length > 0
                    ? 'bg-danger text-white animate-pulse'
                    : 'bg-canvas text-ink-soft border border-line'
                }`}
              >
                <Inbox className="w-5 h-5" />
              </div>
              {incomingOrders.length > 0 ? (
                <span className="text-[11px] font-body font-bold text-danger bg-danger-soft px-2 py-0.5 rounded-md">
                  رد فوري
                </span>
              ) : (
                <span className="text-[11px] font-body font-bold text-accent bg-accent-soft px-2 py-0.5 rounded-md">
                  لا يوجد
                </span>
              )}
            </div>
            <p className="font-display font-black text-2xl text-ink font-mono-nums">
              {incomingOrders.length}
            </p>
            <p className="font-body text-xs text-ink-soft mt-1">
              أوردرات واردة الآن
            </p>
          </Card>
        </Link>

        {/* Active Orders Stat */}
        <Link href="/kiosk/active">
          <Card hoverable className="p-4 sm:p-5 h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-soft text-primary-ink flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-body font-bold text-primary-ink bg-primary-soft px-2 py-0.5 rounded-md">
                قيد التنفيذ
              </span>
            </div>
            <p className="font-display font-black text-2xl text-ink font-mono-nums">
              {activeOrders.length}
            </p>
            <p className="font-body text-xs text-ink-soft mt-1">
              أوردرات نشطة (تحضير وجاهز)
            </p>
          </Card>
        </Link>

        {/* Today Sales Stat */}
        <Card className="p-4 sm:p-5 h-full">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-accent-soft text-accent flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-body font-bold text-ink-soft bg-canvas px-2 py-0.5 rounded-md border border-line">
              اليوم
            </span>
          </div>
          <p className="font-display font-black text-xl sm:text-2xl text-ink font-mono-nums">
            {formatEGP(todaySales)}
          </p>
          <p className="font-body text-xs text-ink-soft mt-1">
            إجمالي مبيعات اليوم ({todayCompletedCount} طلب)
          </p>
        </Card>

        {/* Unavailable Menu Items Stat */}
        <Link href="/kiosk/menu">
          <Card hoverable className="p-4 sm:p-5 h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-canvas text-ink-soft border border-line flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              {unavailableItemsCount > 0 ? (
                <span className="text-[11px] font-body font-bold text-danger bg-danger-soft px-2 py-0.5 rounded-md">
                  {unavailableItemsCount} صنف نفد
                </span>
              ) : (
                <span className="text-[11px] font-body font-bold text-accent bg-accent-soft px-2 py-0.5 rounded-md">
                  الكل متاح
                </span>
              )}
            </div>
            <p className="font-display font-black text-2xl text-ink font-mono-nums">
              {kioskMenuItems.length}
            </p>
            <p className="font-body text-xs text-ink-soft mt-1">
              أصناف المنيو المسجلة
            </p>
          </Card>
        </Link>
      </div>

      {/* Urgent Incoming Orders Preview Section */}
      <div className="bg-surface border border-line/80 rounded-3xl p-5 sm:p-6 shadow-warm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-line/60">
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-danger" />
            <h3 className="font-display font-bold text-base text-ink">
              معاينة الأوردرات الواردة العاجلة
            </h3>
          </div>
          <Link
            href="/kiosk/incoming"
            className="text-xs font-body font-bold text-accent hover:underline flex items-center gap-1"
          >
            <span>عرض كل الواردة ({incomingOrders.length})</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        {incomingOrders.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {urgentIncomingOrders.map((order) => (
                <CashierIncomingOrderCard
                  key={order.id}
                  order={order}
                  onAccept={handleAccept}
                  onReject={handleOpenReject}
                />
              ))}
            </div>

            {incomingOrders.length > 2 && (
              <div className="text-center pt-2">
                <Link href="/kiosk/incoming">
                  <Button variant="outline" size="sm">
                    <span>يوجد {incomingOrders.length - 2} أوردرات واردة إضافية — عرض الكل</span>
                    <ArrowLeft className="w-4 h-4 mr-1" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="py-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="font-body font-bold text-sm text-ink">
              تم الرد على جميع الأوردرات الواردة!
            </p>
            <p className="font-body text-xs text-ink-soft max-w-sm mx-auto">
              أي أوردر جديد يطلبه الطلاب سيظهر هنا فوراً مع عد تنازلي وتنبيه صوتي.
            </p>
          </div>
        )}
      </div>

      {/* Two Columns: Active Orders Quick Glimpse + Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Orders Summary (2 cols on lg) */}
        <div className="lg:col-span-2 bg-surface border border-line/80 rounded-3xl p-5 sm:p-6 shadow-warm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line/60">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-ink" />
              <h3 className="font-display font-bold text-base text-ink">
                أحدث الأوردرات النشطة في المطبخ
              </h3>
            </div>
            <Link
              href="/kiosk/active"
              className="text-xs font-body font-bold text-accent hover:underline flex items-center gap-1"
            >
              <span>لوحة التحضير ({activeOrders.length})</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {activeOrders.length > 0 ? (
            <div className="divide-y divide-line/60">
              {activeOrders.slice(0, 4).map((order) => (
                <div
                  key={order.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-ink">
                        #{order.orderNumber}
                      </span>
                      <span className="font-body font-bold text-xs text-ink">
                        {order.studentName}
                      </span>
                    </div>
                    <p className="font-body text-[11px] text-ink-soft mt-0.5">
                      {order.items.map((i) => `${i.name} × ${i.quantity}`).join('، ')}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
                    <StatusPill status={order.status} />

                    {(order.status === 'ACCEPTED' || order.status === 'PREPARING') && (
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={() => setOrderStatus(order.id, 'READY')}
                        className="text-[11px] py-1 px-2.5 h-auto shadow-sm"
                      >
                        <PackageCheck className="w-3.5 h-3.5 ml-1" />
                        <span>جاهز للاستلام</span>
                      </Button>
                    )}

                    {order.status === 'READY' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setOrderStatus(order.id, 'COMPLETED')}
                        className="text-[11px] py-1 px-2.5 h-auto shadow-sm"
                      >
                        <CheckCheck className="w-3.5 h-3.5 ml-1" />
                        <span>تسليم الطلب</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs font-body text-ink-soft text-center py-4">
              لا توجد أوردرات قيد التحضير حالياً.
            </p>
          )}
        </div>

        {/* Quick Shortcuts (1 col on lg) */}
        <div className="space-y-4">
          <div className="bg-surface border border-line/80 rounded-3xl p-5 sm:p-6 shadow-warm space-y-3">
            <h3 className="font-display font-bold text-base text-ink pb-2 border-b border-line/60 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary-ink" />
              <span>إجراءات سريعة</span>
            </h3>

            <div className="space-y-2.5">
              <Link
                href="/kiosk/incoming"
                className="flex items-center justify-between p-3 bg-canvas hover:bg-primary-soft/30 border border-line rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <Inbox className="w-4 h-4 text-danger" />
                  <span className="font-body font-bold text-xs text-ink">استقبال الأوردرات</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-ink-soft group-hover:-translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/kiosk/active"
                className="flex items-center justify-between p-3 bg-canvas hover:bg-primary-soft/30 border border-line rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-primary-ink" />
                  <span className="font-body font-bold text-xs text-ink">شاشة التحضير والتسليم</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-ink-soft group-hover:-translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/kiosk/menu"
                className="flex items-center justify-between p-3 bg-canvas hover:bg-primary-soft/30 border border-line rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <UtensilsCrossed className="w-4 h-4 text-accent" />
                  <span className="font-body font-bold text-xs text-ink">تعديل أسعار والمنيو</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-ink-soft group-hover:-translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/kiosk/settings"
                className="flex items-center justify-between p-3 bg-canvas hover:bg-primary-soft/30 border border-line rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-ink-soft" />
                  <span className="font-body font-bold text-xs text-ink">إعدادات الكشك والتنبيهات</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-ink-soft group-hover:-translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Reason Dialog Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="تأكيد رفض الأوردر"
        description="يرجى اختيار سبب الرفض لإبلاغ الطالب بشكل واضح:"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            {[
              'نفاد بعض المكونات المطلوبة',
              'ضغط طلبات وازدحام شديد بالكشك',
              'الكشك على وشك الإغلاق',
              'عطل فني في معدات التحضير',
            ].map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  rejectReason === reason
                    ? 'bg-danger-soft/40 border-danger/40 font-bold text-danger'
                    : 'bg-surface border-line hover:bg-canvas text-ink'
                }`}
              >
                <input
                  type="radio"
                  name="reject_reason"
                  value={reason}
                  checked={rejectReason === reason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-4 h-4 accent-danger"
                />
                <span className="text-xs font-body">{reason}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-line/60">
            <Button
              variant="danger"
              size="md"
              onClick={handleConfirmReject}
              className="flex-1"
            >
              تأكيد الرفض
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => setRejectModalOpen(false)}
              className="flex-1"
            >
              تراجع
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

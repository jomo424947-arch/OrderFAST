'use client';

import React, { useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useKioskStore } from '@/stores/useKioskStore';
import { useCartStore } from '@/stores/useCartStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatEGP } from '@/lib/formatters';
import {
  Store,
  ShoppingBag,
  Clock,
  ArrowLeft,
  ChevronLeft,
  Wallet,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

export default function StudentDashboardPage() {
  const { student, studentStatus } = useAuthStore();
  const { orders, fetchStudentOrders } = useOrderStore();
  const { fetchKiosks } = useKioskStore();
  const { getTotalItems } = useCartStore();

  const cartCount = getTotalItems();

  useEffect(() => {
    fetchKiosks();
    if (student?.id) {
      fetchStudentOrders(student.id);
    }
  }, [student?.id, fetchKiosks, fetchStudentOrders]);

  // Filter orders for the current student
  const studentOrders = useMemo(() => {
    return orders.filter(
      (o) => (student?.id ? o.studentId === student.id : true) || !o.studentId
    );
  }, [orders, student?.id]);

  // Find any active student order for floating banner
  const activeOrder = useMemo(() => {
    return studentOrders.find(
      (o) =>
        o.status === 'PENDING_KIOSK' ||
        o.status === 'ACCEPTED' ||
        o.status === 'PREPARING' ||
        o.status === 'READY'
    );
  }, [studentOrders]);

  // Calculate statistics
  const completedOrders = useMemo(() => {
    return studentOrders.filter((o) => o.status === 'COMPLETED');
  }, [studentOrders]);

  const totalSpent = useMemo(() => {
    return completedOrders.reduce((sum, o) => sum + o.total, 0);
  }, [completedOrders]);

  const totalOrdersCount = studentOrders.length;
  const noShowCount = student?.noShowCount || 0;

  // 3 most recent orders
  const recentOrders = useMemo(() => {
    return studentOrders.slice(0, 3);
  }, [studentOrders]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-line/60">
        <div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-ink">
            أهلاً {student?.name ? student.name.split(' ')[0] : 'طالب'} 👋
          </h2>
          <p className="font-body text-xs sm:text-sm text-ink-soft mt-0.5">
            {student?.college || 'كلية الحاسبات والذكاء الاصطناعي'} · جامعة سفنكس
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/student/kiosks">
            <Button variant="primary" size="sm" className="shadow-warm">
              <Store className="w-4 h-4 ml-1.5" />
              <span>تصفح الأكشاك</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Account restriction warning banner if user has account warning/restriction */}
      {studentStatus === 'restricted' && (
        <div className="bg-danger-soft border border-danger/30 rounded-2xl p-4 text-xs font-body text-danger flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>
              <strong>تنبيه بالحساب:</strong> حسابك مقيد مؤقتاً لعدم الحضور لاستلام أوردر سابق. يرجى التواصل مع إدارة الكشك.
            </span>
          </div>
          <Link href="/student/profile" className="font-bold underline whitespace-nowrap mr-2">
            تفاصيل الحساب
          </Link>
        </div>
      )}

      {/* Active Order Highlight Banner */}
      {activeOrder && (
        <Link
          href={`/student/orders/${activeOrder.id}`}
          className="block bg-surface border-2 border-primary/50 hover:border-primary rounded-3xl p-4 sm:p-5 shadow-warm hover:shadow-md transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-primary text-primary-ink flex items-center justify-center flex-shrink-0">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-ink opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-ink" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm sm:text-base font-bold text-ink font-mono-nums">
                    أوردر نشط #{activeOrder.orderNumber}
                  </span>
                  <StatusPill
                    status={
                      activeOrder.status === 'READY'
                        ? 'READY'
                        : activeOrder.status === 'PREPARING'
                        ? 'PREPARING'
                        : 'PENDING_KIOSK'
                    }
                  />
                </div>
                <p className="font-body text-xs text-ink-soft mt-0.5">
                  {activeOrder.kioskName} ·{' '}
                  {activeOrder.status === 'READY'
                    ? 'جاهز للاستلام الآن من الكشك!'
                    : 'جاري تحضير طلبك بعناية'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-primary-ink font-body text-xs sm:text-sm font-bold bg-primary-soft px-3 py-1.5 rounded-xl group-hover:bg-primary transition-colors">
              <span>تتبع الأوردر</span>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      )}

      {/* Personal Statistics Grid */}
      <div>
        <h3 className="font-display font-bold text-sm text-ink mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent" />
          <span>ملخص نشاطك في الجامعة</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {/* Total Spent */}
          <Card className="p-4 sm:p-5 h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-accent-soft text-accent flex items-center justify-center">
                <Wallet className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[11px] font-body font-bold text-accent bg-accent-soft px-2 py-0.5 rounded-md">
                مكتمل
              </span>
            </div>
            <p className="font-display font-black text-xl sm:text-2xl text-ink font-mono-nums">
              {formatEGP(totalSpent)}
            </p>
            <p className="font-body text-xs text-ink-soft font-medium mt-1">
              إجمالي المصروفات ({completedOrders.length} طلب مستلم)
            </p>
          </Card>

          {/* Total Orders */}
          <Link href="/student/orders">
            <Card hoverable className="p-4 sm:p-5 h-full">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-primary-soft text-primary-ink flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-body font-bold text-ink bg-canvas px-2 py-0.5 rounded-md border border-line">
                  السجل
                </span>
              </div>
              <p className="font-display font-black text-xl sm:text-2xl text-ink font-mono-nums">
                {totalOrdersCount}
              </p>
              <p className="font-body text-xs text-ink-soft font-medium mt-1">
                إجمالي كل الطلبات
              </p>
            </Card>
          </Link>

          {/* Active Orders */}
          <Link href="/student/orders">
            <Card hoverable className="p-4 sm:p-5 h-full">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-primary-soft text-primary-ink flex items-center justify-center">
                  <Clock className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-body font-bold text-primary-ink bg-primary px-2 py-0.5 rounded-md">
                  نشط
                </span>
              </div>
              <p className="font-display font-black text-xl sm:text-2xl text-ink font-mono-nums">
                {activeOrder ? 1 : 0}
              </p>
              <p className="font-body text-xs text-ink-soft font-medium mt-1">
                الطلبات النشطة حالياً
              </p>
            </Card>
          </Link>

          {/* No Show Count (Only displayed if > 0) */}
          {noShowCount > 0 && (
            <Card className="p-4 sm:p-5 h-full border-2 border-danger/40 bg-danger-soft/20">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-danger-soft text-danger flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-body font-bold text-danger bg-danger-soft px-2 py-0.5 rounded-md">
                  تنبيه
                </span>
              </div>
              <p className="font-display font-black text-xl sm:text-2xl text-danger font-mono-nums">
                {noShowCount}
              </p>
              <p className="font-body text-xs text-danger mt-1">
                مرات عدم الاستلام
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Two Columns: Recent Orders + Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders (Takes 2 cols on lg) */}
        <div className="lg:col-span-2 bg-surface border border-line/80 rounded-3xl p-5 sm:p-6 shadow-warm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line/60">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-ink" />
              <h3 className="font-display font-bold text-base text-ink">
                أحدث الطلبات
              </h3>
            </div>
            <Link
              href="/student/orders"
              className="text-xs font-body font-bold text-accent hover:underline flex items-center gap-1"
            >
              <span>عرض كل الطلبات</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => {
                return (
                  <Link
                    key={order.id}
                    href={`/student/orders/${order.id}`}
                    className="block bg-canvas border border-line hover:border-primary/50 rounded-2xl p-3.5 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-ink font-mono-nums">
                          #{order.orderNumber}
                        </span>
                        <span className="font-body text-xs text-ink-soft">
                          · {order.kioskName}
                        </span>
                      </div>
                      <StatusPill status={order.status} />
                    </div>

                    <p className="font-body text-xs text-ink-soft line-clamp-1 mb-2">
                      {order.items.map((it) => `${it.name} × ${it.quantity}`).join('، ')}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-line/50 text-xs font-body">
                      <span className="font-mono font-bold text-ink font-mono-nums">
                        {formatEGP(order.total)}
                      </span>
                      <div className="flex items-center gap-1 text-accent font-bold group-hover:-translate-x-1 transition-transform">
                        <span>تفاصيل الفاتورة</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<ShoppingBag className="w-8 h-8" />}
              title="لم تقم بأي طلبات بعد"
              description="اختر من أكشاك الحرم الجامعي واطلب أكلك ومشروباتك واستلمها بدون طوابير."
              actionLabel="تصفح الأكشاك الآن"
              onAction={() => {}}
            />
          )}
        </div>

        {/* Quick Shortcuts (Takes 1 col on lg) */}
        <div className="space-y-4">
          <div className="bg-surface border border-line/80 rounded-3xl p-5 sm:p-6 shadow-warm space-y-4">
            <h3 className="font-display font-bold text-base text-ink flex items-center gap-2 pb-3 border-b border-line/60">
              <Sparkles className="w-4 h-4 text-primary-ink" />
              <span>اختصارات سريعة</span>
            </h3>

            <div className="space-y-3">
              {/* Browse Kiosks Shortcut */}
              <Link
                href="/student/kiosks"
                className="flex items-center justify-between p-3.5 bg-canvas hover:bg-primary-soft/30 border border-line hover:border-primary/40 rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-accent-soft text-accent flex items-center justify-center">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-body font-bold text-xs text-ink">دليل الأكشاك</p>
                    <p className="font-body text-[11px] text-ink-soft">تصفح قوائم ومنيو الكافيهات</p>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-ink-soft group-hover:text-ink group-hover:-translate-x-1 transition-all" />
              </Link>

              {/* Cart Shortcut */}
              <Link
                href="/student/cart"
                className="flex items-center justify-between p-3.5 bg-canvas hover:bg-primary-soft/30 border border-line hover:border-primary/40 rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-soft text-primary-ink flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-body font-bold text-xs text-ink">سلة الطلبات</p>
                    <p className="font-body text-[11px] text-ink-soft">
                      {cartCount > 0 ? `${cartCount} أصناف بانتظار التأكيد` : 'السلة فارغة'}
                    </p>
                  </div>
                </div>
                {cartCount > 0 ? (
                  <span className="font-mono text-xs font-bold bg-primary text-primary-ink px-2 py-0.5 rounded-full font-mono-nums">
                    {cartCount}
                  </span>
                ) : (
                  <ChevronLeft className="w-4 h-4 text-ink-soft group-hover:text-ink group-hover:-translate-x-1 transition-all" />
                )}
              </Link>

              {/* Order History Shortcut */}
              <Link
                href="/student/orders"
                className="flex items-center justify-between p-3.5 bg-canvas hover:bg-primary-soft/30 border border-line hover:border-primary/40 rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-soft text-primary-ink flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-body font-bold text-xs text-ink">سجل الطلبات</p>
                    <p className="font-body text-[11px] text-ink-soft">الطلبات النشطة والسابقة</p>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-ink-soft group-hover:text-ink group-hover:-translate-x-1 transition-all" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

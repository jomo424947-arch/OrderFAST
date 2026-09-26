'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useKioskStore } from '@/stores/useKioskStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useStudentStore } from '@/stores/useStudentStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  Store,
  Users,
  ShoppingBag,
  ClipboardCheck,
  ArrowLeft,
  AlertCircle,
  Coins,
  Clock,
  ChevronLeft,
  Filter,
} from 'lucide-react';
import { formatEGP, formatArabicTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export default function AdminDashboardPage() {
  const {
    kiosks,
    kiosksWithStaff,
    menuItems,
    fetchKiosksWithStaff,
    fetchUnderReviewItems,
    toggleKioskOpen,
  } = useKioskStore();
  const { adminOrders, adminStats, fetchAdminOrders, fetchAdminStats } = useOrderStore();
  const { students, fetchStudents } = useStudentStore();

  const [activeMobileSection, setActiveMobileSection] = useState<'both' | 'orders' | 'kiosks'>('both');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'completed' | 'active' | 'cancelled'>('all');

  useEffect(() => {
    fetchKiosksWithStaff();
    fetchStudents();
    fetchAdminOrders();
    fetchAdminStats();
    fetchUnderReviewItems();
  }, [fetchKiosksWithStaff, fetchStudents, fetchAdminOrders, fetchAdminStats, fetchUnderReviewItems]);

  const displayedKiosks = kiosksWithStaff.length > 0 ? kiosksWithStaff : kiosks;
  const openKiosksCount = displayedKiosks.filter((k) => k.isOpen).length;
  const underReviewItems = menuItems.filter((i) => i.isUnderReview);

  // All orders for today (no 5 items limit, fully scrollable)
  const filteredOrders = useMemo(() => {
    return adminOrders.filter((o) => {
      const statusUpper = String(o.status).toUpperCase();
      if (orderStatusFilter === 'completed') {
        return statusUpper === 'COMPLETED';
      }
      if (orderStatusFilter === 'active') {
        return ['PENDING_KIOSK', 'ACCEPTED', 'PREPARING', 'READY'].includes(statusUpper);
      }
      if (orderStatusFilter === 'cancelled') {
        return ['CANCELLED', 'REJECTED', 'EXPIRED', 'NO_SHOW'].includes(statusUpper);
      }
      return true;
    });
  }, [adminOrders, orderStatusFilter]);

  const totalTodayOrders = adminStats?.todayOrdersCount ?? adminOrders.length;
  const totalStaffCount = displayedKiosks.reduce((sum, k) => sum + (k.staff?.length || 1), 0);

  return (
    <div className="space-y-5 sm:space-y-7 pb-10">
      {/* Header */}
      <div className="pb-2 border-b border-line/60 flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-ink">
            لوحة التحكم المركزية
          </h2>
          <p className="font-body text-xs text-ink-soft mt-0.5">
            متابعة حية لجميع الأكشاك، الطلبات، الكاشيرات، وحسابات الطلاب
          </p>
        </div>
      </div>

      {/* Financial Service Fee Revenue Callout Banner */}
      <div className="bg-gradient-to-l from-amber-500/10 via-accent/5 to-surface border border-amber-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-warm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md flex-shrink-0">
              <Coins className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base sm:text-lg text-ink">
                  أرباح المنصة من رسوم الخدمة
                </h3>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                  حساب دقيق
                </span>
              </div>
              <p className="font-body text-[11px] sm:text-xs text-ink-soft mt-0.5">
                مجموع رسوم الخدمة المحصلة من كل أوردر مكتمل في الحرم الجامعي
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-amber-500/20">
            {/* Quick Metrics Columns */}
            <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-6">
              <div className="bg-surface/80 p-2.5 sm:p-0 rounded-xl sm:bg-transparent border sm:border-0 border-line/60">
                <span className="font-body text-[10px] sm:text-[11px] text-ink-soft block">أرباح اليوم</span>
                <span className="font-mono text-base sm:text-lg font-black text-accent font-mono-nums">
                  {formatEGP((adminStats?.todayFeeRevenuePiasters ?? 0) / 100)}
                </span>
              </div>
              <div className="h-8 w-px bg-line hidden sm:block" />
              <div className="bg-surface/80 p-2.5 sm:p-0 rounded-xl sm:bg-transparent border sm:border-0 border-line/60">
                <span className="font-body text-[10px] sm:text-[11px] text-ink-soft block">إجمالي أرباح الرسوم</span>
                <span className="font-mono text-base sm:text-xl font-black text-amber-700 font-mono-nums">
                  {formatEGP((adminStats?.totalFeeRevenuePiasters ?? 0) / 100)}
                </span>
              </div>
            </div>

            <Link href="/admin/analytics" className="w-full sm:w-auto">
              <Button variant="primary" size="sm" className="w-full sm:w-auto font-bold text-xs shadow-sm py-2">
                <span>صفحة الإحصائيات الكاملة</span>
                <ArrowLeft className="w-4 h-4 mr-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid (2 cols on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Kiosks Stat */}
        <Link href="/admin/kiosks">
          <Card hoverable className="p-3 sm:p-5 h-full">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-accent-soft text-accent flex items-center justify-center">
                <Store className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-body font-bold text-accent bg-accent-soft px-1.5 sm:px-2 py-0.5 rounded-md">
                {openKiosksCount} مفتوح
              </span>
            </div>
            <p className="font-display font-black text-xl sm:text-2xl text-ink">
              {displayedKiosks.length}
            </p>
            <p className="font-body text-[11px] sm:text-xs text-ink-soft mt-0.5">
              إجمالي الأكشاك ({totalStaffCount} كاشير)
            </p>
          </Card>
        </Link>

        {/* Students Stat */}
        <Link href="/admin/students">
          <Card hoverable className="p-3 sm:p-5 h-full">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-primary-soft text-primary-ink flex items-center justify-center">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-body font-bold text-primary-ink bg-primary-soft px-1.5 sm:px-2 py-0.5 rounded-md">
                طلاب نشطين
              </span>
            </div>
            <p className="font-display font-black text-xl sm:text-2xl text-ink">
              {students.length}
            </p>
            <p className="font-body text-[11px] sm:text-xs text-ink-soft mt-0.5">
              حسابات الطلاب المسجلين
            </p>
          </Card>
        </Link>

        {/* Orders Stat */}
        <Card className="p-3 sm:p-5 h-full">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-accent-soft text-accent flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-body font-bold text-ink-soft bg-canvas px-1.5 sm:px-2 py-0.5 rounded-md border border-line">
              اليوم
            </span>
          </div>
          <p className="font-display font-black text-xl sm:text-2xl text-ink">
            {totalTodayOrders}
          </p>
          <p className="font-body text-[11px] sm:text-xs text-ink-soft mt-0.5">
            إجمالي الطلبات المنفذة
          </p>
        </Card>

        {/* Menu Review Stat */}
        <Link href="/admin/menu-review">
          <Card
            hoverable
            className={`p-3 sm:p-5 h-full border-2 ${
              underReviewItems.length > 0
                ? 'border-primary/60 bg-primary-soft/10'
                : 'border-line/70'
            }`}
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-primary-soft text-primary-ink flex items-center justify-center">
                <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              {underReviewItems.length > 0 ? (
                <span className="text-[10px] sm:text-[11px] font-body font-bold text-primary-ink bg-primary px-1.5 sm:px-2 py-0.5 rounded-md animate-pulse">
                  مطلوب مراجعة
                </span>
              ) : (
                <span className="text-[10px] sm:text-[11px] font-body font-bold text-accent bg-accent-soft px-1.5 sm:px-2 py-0.5 rounded-md">
                  مكتمل
                </span>
              )}
            </div>
            <p className="font-display font-black text-xl sm:text-2xl text-ink">
              {underReviewItems.length}
            </p>
            <p className="font-body text-[11px] sm:text-xs text-ink-soft mt-0.5">
              أصناف قيد المراجعة والاعتماد
            </p>
          </Card>
        </Link>
      </div>

      {/* Pending Items Approval Preview Alert */}
      {underReviewItems.length > 0 && (
        <div className="bg-primary-soft/30 border border-primary/40 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-warm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-primary text-primary-ink flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-display font-bold text-xs sm:text-sm text-ink">
                يوجد {underReviewItems.length} صنف جديد بانتظار اعتمادك
              </p>
              <p className="font-body text-[11px] sm:text-xs text-ink-soft mt-0.5">
                الكاشيرات أضافوا أصناف جديدة للمنيو ولا تظهر للطلاب حتى تقوم باعتمادها.
              </p>
            </div>
          </div>
          <Link href="/admin/menu-review" className="w-full sm:w-auto">
            <Button variant="primary" size="sm" className="w-full sm:w-auto whitespace-nowrap text-xs">
              <span>مراجعة الأصناف الآن</span>
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* Mobile Section View Selector Tabs (Visible only on mobile) */}
      <div className="lg:hidden flex bg-surface border border-line rounded-xl p-1 shadow-xs select-none">
        <button
          type="button"
          onClick={() => setActiveMobileSection('both')}
          className={cn(
            'flex-1 py-1.5 text-xs font-body font-bold rounded-lg transition-all text-center',
            activeMobileSection === 'both'
              ? 'bg-ink text-white shadow-xs'
              : 'text-ink-soft hover:text-ink'
          )}
        >
          عرض الكل
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileSection('orders')}
          className={cn(
            'flex-1 py-1.5 text-xs font-body font-bold rounded-lg transition-all text-center flex items-center justify-center gap-1',
            activeMobileSection === 'orders'
              ? 'bg-ink text-white shadow-xs'
              : 'text-ink-soft hover:text-ink'
          )}
        >
          <span>أحدث الطلبات</span>
          <span className="font-mono text-[10px] bg-white/20 px-1 rounded-sm">({adminOrders.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileSection('kiosks')}
          className={cn(
            'flex-1 py-1.5 text-xs font-body font-bold rounded-lg transition-all text-center flex items-center justify-center gap-1',
            activeMobileSection === 'kiosks'
              ? 'bg-ink text-white shadow-xs'
              : 'text-ink-soft hover:text-ink'
          )}
        >
          <span>حالة الأكشاك</span>
          <span className="font-mono text-[10px] bg-white/20 px-1 rounded-sm">({displayedKiosks.length})</span>
        </button>
      </div>

      {/* Two Columns: Recent Orders + Kiosks Quick Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Orders List - SCROLLABLE FOR ALL ORDERS */}
        {(activeMobileSection === 'both' || activeMobileSection === 'orders') && (
          <div className="bg-surface border border-line/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-warm flex flex-col">
            {/* Header with Title and Count */}
            <div className="flex items-center justify-between pb-3 border-b border-line/60">
              <h3 className="font-display font-bold text-sm sm:text-base text-ink flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-primary-ink" />
                <span>أحدث الطلبات في الحرم</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="font-body text-xs text-primary-ink font-bold bg-primary-soft/50 px-2 py-0.5 rounded-full border border-primary/20">
                  {filteredOrders.length} طلب
                </span>
                <Link
                  href="/admin/analytics"
                  className="text-xs font-body font-bold text-ink-soft hover:text-ink flex items-center gap-0.5"
                >
                  <span>الكل</span>
                  <ChevronLeft className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Quick Status Filter Tabs inside Orders Box */}
            <div className="flex items-center gap-1 py-2.5 border-b border-line/40 overflow-x-auto scrollbar-none text-[11px] font-body font-bold">
              <button
                type="button"
                onClick={() => setOrderStatusFilter('all')}
                className={cn(
                  'px-2.5 py-1 rounded-lg transition-all whitespace-nowrap',
                  orderStatusFilter === 'all'
                    ? 'bg-ink text-white shadow-xs'
                    : 'bg-canvas text-ink-soft hover:text-ink'
                )}
              >
                الكل ({adminOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setOrderStatusFilter('completed')}
                className={cn(
                  'px-2.5 py-1 rounded-lg transition-all whitespace-nowrap',
                  orderStatusFilter === 'completed'
                    ? 'bg-accent text-white shadow-xs'
                    : 'bg-canvas text-ink-soft hover:text-ink'
                )}
              >
                المكتملة
              </button>
              <button
                type="button"
                onClick={() => setOrderStatusFilter('active')}
                className={cn(
                  'px-2.5 py-1 rounded-lg transition-all whitespace-nowrap',
                  orderStatusFilter === 'active'
                    ? 'bg-primary text-primary-ink shadow-xs'
                    : 'bg-canvas text-ink-soft hover:text-ink'
                )}
              >
                النشطة
              </button>
              <button
                type="button"
                onClick={() => setOrderStatusFilter('cancelled')}
                className={cn(
                  'px-2.5 py-1 rounded-lg transition-all whitespace-nowrap',
                  orderStatusFilter === 'cancelled'
                    ? 'bg-danger text-white shadow-xs'
                    : 'bg-canvas text-ink-soft hover:text-ink'
                )}
              >
                الملغية
              </button>
            </div>

            {/* Scrollable Orders Container: Allows scrolling through ALL orders */}
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-ink-soft">
                <ShoppingBag className="w-8 h-8 mx-auto text-line mb-2" />
                <p className="text-xs font-body">لا توجد طلبات في هذا التصنيف حالياً</p>
              </div>
            ) : (
              <div className="max-h-[460px] sm:max-h-[520px] overflow-y-auto divide-y divide-line/60 scrollbar-thin px-1 py-1">
                {filteredOrders.map((order) => {
                  const cleanOrderNumber = order.orderNumber.replace(/^#+/, '');
                  return (
                    <div
                      key={order.id}
                      className="py-3 flex items-center justify-between gap-3 first:pt-1 last:pb-1 hover:bg-canvas/50 px-1 rounded-xl transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs text-ink bg-canvas px-1.5 py-0.5 rounded border border-line">
                            #{cleanOrderNumber}
                          </span>
                          <span className="font-body text-xs text-ink font-semibold truncate max-w-[130px] sm:max-w-none">
                            {order.studentName}
                          </span>
                          {order.createdAt && (
                            <span className="text-[10px] font-body text-ink-soft flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{formatArabicTime(order.createdAt)}</span>
                            </span>
                          )}
                        </div>
                        <p className="font-body text-[11px] text-ink-soft mt-1 truncate">
                          {order.kioskName} · {order.items.length} صنف ·{' '}
                          <span className="font-mono font-bold text-ink">{formatEGP(order.total)}</span>
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <StatusPill status={order.status as any} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Kiosks Status Quick Card with Direct Open/Close Toggle */}
        {(activeMobileSection === 'both' || activeMobileSection === 'kiosks') && (
          <div className="bg-surface border border-line/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-warm space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-line/60">
              <h3 className="font-display font-bold text-sm sm:text-base text-ink flex items-center gap-2">
                <Store className="w-4 h-4 text-accent" />
                <span>حالة الأكشاك الحالية</span>
              </h3>
              <Link
                href="/admin/kiosks"
                className="text-xs font-body font-bold text-accent hover:underline flex items-center gap-1"
              >
                <span>إدارة الأكشاك</span>
                <ArrowLeft className="w-3 h-3" />
              </Link>
            </div>

            <div className="max-h-[500px] overflow-y-auto divide-y divide-line/60 scrollbar-thin">
              {displayedKiosks.map((kiosk) => (
                <div
                  key={kiosk.id}
                  className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-body font-bold text-xs text-ink truncate">
                      {kiosk.name}
                    </p>
                    <p className="font-body text-[11px] text-ink-soft mt-0.5 truncate">
                      {kiosk.collegeLocation} · {kiosk.category}
                    </p>
                  </div>

                  {/* Direct interactive toggle button */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleKioskOpen(kiosk.id)}
                      title={kiosk.isOpen ? 'انقر لإغلاق الكشك' : 'انقر لفتح الكشك'}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body font-bold border transition-all active:scale-95 shadow-2xs',
                        kiosk.isOpen
                          ? 'bg-accent-soft text-accent border-accent/40 hover:bg-accent/15'
                          : 'bg-danger-soft text-danger border-danger/40 hover:bg-danger/15'
                      )}
                    >
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full',
                          kiosk.isOpen ? 'bg-accent animate-pulse' : 'bg-danger'
                        )}
                      />
                      <span>{kiosk.isOpen ? 'مفتوح' : 'مغلق'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

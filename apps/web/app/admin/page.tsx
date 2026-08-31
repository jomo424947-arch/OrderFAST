'use client';

import React from 'react';
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
  CheckCircle2,
  Clock,
  ArrowLeft,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { formatEGP } from '@/lib/formatters';

export default function AdminDashboardPage() {
  const { kiosks, cashiers, menuItems, approveMenuItem } = useKioskStore();
  const { orders } = useOrderStore();
  const { students } = useStudentStore();

  const openKiosksCount = kiosks.filter((k) => k.isOpen).length;
  const underReviewItems = menuItems.filter((i) => i.isUnderReview);
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="pb-2 border-b border-line/60">
        <h2 className="font-display font-bold text-2xl text-ink">
          لوحة التحكم المركزية
        </h2>
        <p className="font-body text-xs text-ink-soft mt-0.5">
          متابعة حية لجميع الأكشاك، الطلبات، الكاشيرات، وحسابات الطلاب
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Kiosks Stat */}
        <Link href="/admin/kiosks">
          <Card hoverable className="p-4 sm:p-5 h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-accent-soft text-accent flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-body font-bold text-accent bg-accent-soft px-2 py-0.5 rounded-md">
                {openKiosksCount} مفتوح
              </span>
            </div>
            <p className="font-display font-black text-2xl text-ink">
              {kiosks.length}
            </p>
            <p className="font-body text-xs text-ink-soft mt-1">
              إجمالي الأكشاك ({cashiers.length} كاشير)
            </p>
          </Card>
        </Link>

        {/* Students Stat */}
        <Link href="/admin/students">
          <Card hoverable className="p-4 sm:p-5 h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-soft text-primary-ink flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-body font-bold text-primary-ink bg-primary-soft px-2 py-0.5 rounded-md">
                طلاب نشطين
              </span>
            </div>
            <p className="font-display font-black text-2xl text-ink">
              {students.length}
            </p>
            <p className="font-body text-xs text-ink-soft mt-1">
              حسابات الطلاب المسجلين
            </p>
          </Card>
        </Link>

        {/* Orders Stat */}
        <Card className="p-4 sm:p-5 h-full">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-accent-soft text-accent flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-body font-bold text-ink-soft bg-canvas px-2 py-0.5 rounded-md border border-line">
              اليوم
            </span>
          </div>
          <p className="font-display font-black text-2xl text-ink">
            {orders.length}
          </p>
          <p className="font-body text-xs text-ink-soft mt-1">
            إجمالي الطلبات المنفذة
          </p>
        </Card>

        {/* Menu Review Stat */}
        <Link href="/admin/menu-review">
          <Card
            hoverable
            className={`p-4 sm:p-5 h-full border-2 ${
              underReviewItems.length > 0
                ? 'border-primary/60 bg-primary-soft/10'
                : 'border-line/70'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-soft text-primary-ink flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              {underReviewItems.length > 0 ? (
                <span className="text-[11px] font-body font-bold text-primary-ink bg-primary px-2 py-0.5 rounded-md animate-pulse">
                  مطلوب مراجعة
                </span>
              ) : (
                <span className="text-[11px] font-body font-bold text-accent bg-accent-soft px-2 py-0.5 rounded-md">
                  مكتمل
                </span>
              )}
            </div>
            <p className="font-display font-black text-2xl text-ink">
              {underReviewItems.length}
            </p>
            <p className="font-body text-xs text-ink-soft mt-1">
              أصناف قيد المراجعة والاعتماد
            </p>
          </Card>
        </Link>
      </div>

      {/* Pending Items Approval Preview Alert */}
      {underReviewItems.length > 0 && (
        <div className="bg-primary-soft/30 border border-primary/40 rounded-3xl p-5 shadow-warm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-primary text-primary-ink flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-display font-bold text-sm text-ink">
                يوجد {underReviewItems.length} صنف جديد بانتظار اعتمادك
              </p>
              <p className="font-body text-xs text-ink-soft mt-0.5">
                الكاشيرات أضافوا أصناف جديدة للمنيو ولا تظهر للطلاب حتى تقوم باعتمادها.
              </p>
            </div>
          </div>
          <Link href="/admin/menu-review">
            <Button variant="primary" size="sm" className="whitespace-nowrap">
              <span>مراجعة الأصناف الآن</span>
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* Two Columns: Recent Orders + Kiosks Quick Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders List */}
        <div className="bg-surface border border-line/80 rounded-3xl p-5 shadow-warm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line/60">
            <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary-ink" />
              <span>أحدث الطلبات في الحرم</span>
            </h3>
            <span className="font-body text-xs text-ink-soft font-semibold">
              آخر {recentOrders.length} طلبات
            </span>
          </div>

          <div className="divide-y divide-line/60">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-ink">
                      #{order.orderNumber}
                    </span>
                    <span className="font-body text-xs text-ink font-semibold">
                      {order.studentName}
                    </span>
                  </div>
                  <p className="font-body text-[11px] text-ink-soft mt-0.5">
                    {order.kioskName} · {order.items.length} صنف · {formatEGP(order.total)}
                  </p>
                </div>
                <StatusPill status={order.status as any} />
              </div>
            ))}
          </div>
        </div>

        {/* Kiosks Status Quick Card */}
        <div className="bg-surface border border-line/80 rounded-3xl p-5 shadow-warm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line/60">
            <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
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

          <div className="divide-y divide-line/60">
            {kiosks.map((kiosk) => (
              <div
                key={kiosk.id}
                className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-body font-bold text-xs text-ink">
                    {kiosk.name}
                  </p>
                  <p className="font-body text-[11px] text-ink-soft mt-0.5">
                    {kiosk.collegeLocation} · {kiosk.category}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      kiosk.isOpen ? 'bg-accent animate-pulse' : 'bg-danger'
                    }`}
                  />
                  <span className="font-body text-xs font-semibold text-ink-soft">
                    {kiosk.isOpen ? 'مفتوح' : 'مغلق'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

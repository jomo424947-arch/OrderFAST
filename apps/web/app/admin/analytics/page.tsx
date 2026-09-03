'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useOrderStore } from '@/stores/useOrderStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatEGP } from '@/lib/formatters';
import {
  TrendingUp,
  Coins,
  Store,
  CreditCard,
  ShoppingBag,
  ArrowLeft,
  Calendar,
  RefreshCw,
  Star,
  Sparkles,
  Wallet,
  Banknote,
  CheckCircle2,
  Clock,
  PieChart,
  Percent,
  Layers,
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const { adminAnalytics, fetchAdminAnalytics } = useOrderStore();
  const [timeframe, setTimeframe] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async (tf: 'all' | 'today' | 'week' | 'month') => {
    setIsLoading(true);
    await fetchAdminAnalytics(tf);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData(timeframe);
  }, [timeframe]);

  const summary = adminAnalytics?.summary;
  const kiosks = adminAnalytics?.kioskBreakdown || [];
  const paymentMethods = adminAnalytics?.paymentBreakdown || [];
  const dailyTimeline = adminAnalytics?.dailyTimeline || [];

  // Derived calculations
  const totalFeePiasters = summary?.totalFeeRevenuePiasters ?? 0;
  const totalKioskSalesPiasters = summary?.totalKioskSalesPiasters ?? 0;
  const totalGrossPiasters = summary?.totalGrossVolumePiasters ?? 0;
  const completedOrders = summary?.completedOrdersCount ?? 0;
  const totalOrders = summary?.totalOrdersCount ?? completedOrders;
  const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 100;

  const timeframes: { id: 'all' | 'today' | 'week' | 'month'; label: string }[] = [
    { id: 'all', label: 'كافة الفترات (الكل)' },
    { id: 'today', label: 'اليوم فقط' },
    { id: 'week', label: 'آخر 7 أيام' },
    { id: 'month', label: 'آخر 30 يوم' },
  ];

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-line/60">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink">
                الإحصائيات والأرباح المالية
              </h1>
              <p className="font-body text-xs text-ink-soft mt-0.5">
                حساب حقيقي ودقيق لأرباح رسوم الخدمة ومبيعات الأكشاك المنفذة في الحرم الجامعي
              </p>
            </div>
          </div>
        </div>

        {/* Timeframe Filter Buttons & Refresh */}
        <div className="flex items-center gap-2">
          <div className="bg-canvas border border-line p-1 rounded-2xl flex items-center gap-1 shadow-sm">
            {timeframes.map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-body font-bold transition-all ${
                  timeframe === tf.id
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-ink-soft hover:text-ink hover:bg-surface'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(timeframe)}
            disabled={isLoading}
            className="h-9 w-9 p-0 flex items-center justify-center rounded-2xl"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 text-ink-soft ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Accuracy Verification Banner */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs font-body text-amber-900 flex items-start gap-3 shadow-sm">
        <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
          <Coins className="w-3.5 h-3.5" />
        </div>
        <div className="space-y-0.5">
          <p className="font-bold text-amber-950">
            أرباحك من رسوم الخدمة محسوبة بدقة 100% من قاعدة البيانات
          </p>
          <p className="text-amber-800 leading-relaxed text-[11px]">
            تعتمد هذه الإحصائيات على تجميع حقل رسوم الخدمة الفعلي المخزن مع كل أوردر (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-950">orders.fees</code>)، حتى لو تغيرت قيمة الرسم مستقبلاً بين الطلبات أو الأكشاك، فإن كل معاملة تظل محسوبة بقيمتها الحقيقية.
          </p>
        </div>
      </div>

      {/* 4 Core Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Platform Service Fee Profits */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white rounded-3xl p-5 sm:p-6 shadow-warm flex flex-col justify-between">
          <div className="absolute -left-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md">
                أرباح المنصة
              </span>
            </div>
            <p className="text-white/80 text-xs font-body font-medium">
              أرباحك من رسوم الخدمة
            </p>
            <p className="font-mono text-3xl sm:text-4xl font-black mt-1 font-mono-nums tracking-tight">
              {formatEGP(totalFeePiasters / 100)}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-[11px] text-white/90">
            <span>أرباح اليوم: <strong>{formatEGP((summary?.todayFeeRevenuePiasters ?? 0) / 100)}</strong></span>
            <span>متوسط الرسم: <strong>{formatEGP((summary?.avgFeePiasters ?? 0) / 100)}</strong></span>
          </div>
        </div>

        {/* KPI 2: Kiosks Food Sales (GMV) */}
        <Card className="p-5 sm:p-6 flex flex-col justify-between border border-line/80 shadow-warm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-2xl bg-accent-soft text-accent flex items-center justify-center">
                <Store className="w-6 h-6" />
              </div>
              <span className="bg-accent-soft text-accent text-[10px] font-bold px-2.5 py-1 rounded-full">
                صافي المبيعات
              </span>
            </div>
            <p className="text-ink-soft text-xs font-body font-medium">
              إجمالي مبيعات الأكشاك (الطعام والمشروبات)
            </p>
            <p className="font-mono text-2xl sm:text-3xl font-black text-ink mt-1 font-mono-nums tracking-tight">
              {formatEGP(totalKioskSalesPiasters / 100)}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-[11px] text-ink-soft">
            <span>مبيعات اليوم: <strong className="text-ink">{formatEGP((summary?.todaySalesPiasters ?? 0) / 100)}</strong></span>
            <span>عدد الأكشاك: <strong className="text-ink">{kiosks.length}</strong></span>
          </div>
        </Card>

        {/* KPI 3: Total Gross Flow Volume */}
        <Card className="p-5 sm:p-6 flex flex-col justify-between border border-line/80 shadow-warm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-2xl bg-primary-soft text-primary-ink flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <span className="bg-primary-soft text-primary-ink text-[10px] font-bold px-2.5 py-1 rounded-full">
                التدفق المالي الكلي
              </span>
            </div>
            <p className="text-ink-soft text-xs font-body font-medium">
              إجمالي المبالغ المحصلة (المبيعات + الرسوم)
            </p>
            <p className="font-mono text-2xl sm:text-3xl font-black text-ink mt-1 font-mono-nums tracking-tight">
              {formatEGP(totalGrossPiasters / 100)}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-[11px] text-ink-soft">
            <span>متوسط قيمة الأوردر: <strong className="text-ink">{formatEGP((summary?.avgOrderTotalPiasters ?? 0) / 100)}</strong></span>
          </div>
        </Card>

        {/* KPI 4: Orders Completed Count */}
        <Card className="p-5 sm:p-6 flex flex-col justify-between border border-line/80 shadow-warm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                الطلبات الناجحة
              </span>
            </div>
            <p className="text-ink-soft text-xs font-body font-medium">
              إجمالي الطلبات المستلمة
            </p>
            <p className="font-mono text-2xl sm:text-3xl font-black text-ink mt-1 font-mono-nums tracking-tight">
              {completedOrders}{' '}
              <span className="text-xs font-body font-normal text-ink-soft">
                من أصل {totalOrders}
              </span>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-[11px] text-ink-soft">
            <span>معدل الإتمام: <strong className="text-emerald-700">{completionRate}%</strong></span>
            <span>طلبات اليوم: <strong className="text-ink">{summary?.todayCompletedCount ?? 0}</strong></span>
          </div>
        </Card>
      </div>

      {/* Kiosks Financial Breakdown Section */}
      <div className="bg-surface border border-line/80 rounded-3xl p-5 sm:p-6 shadow-warm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-line/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent-soft text-accent flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-ink">
                أداء ومبيعات الأكشاك وأرباح الرسوم لكل كشك
              </h2>
              <p className="font-body text-xs text-ink-soft">
                تفصيل مبيعات كل كشك وقيمة أرباح رسوم الخدمة التي حققها للمنصة
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-canvas border border-line px-3 py-1 rounded-xl text-ink-soft">
            {kiosks.length} أكشاك
          </span>
        </div>

        {kiosks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-line/60 text-[11px] font-body text-ink-soft bg-canvas/50">
                  <th className="py-3 px-4 font-bold">اسم الكشك</th>
                  <th className="py-3 px-4 font-bold">التقييم</th>
                  <th className="py-3 px-4 font-bold text-center">الطلبات المكتملة</th>
                  <th className="py-3 px-4 font-bold">مبيعات الكشك</th>
                  <th className="py-3 px-4 font-bold text-amber-700 bg-amber-50/50">أرباح رسوم المنصة</th>
                  <th className="py-3 px-4 font-bold">نسبة المساهمة</th>
                  <th className="py-3 px-4 font-bold text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40 text-xs font-body">
                {kiosks.map((kiosk) => {
                  const sharePercentage =
                    totalFeePiasters > 0
                      ? Math.round((kiosk.feeRevenuePiasters / totalFeePiasters) * 100)
                      : 0;

                  return (
                    <tr key={kiosk.kioskId} className="hover:bg-canvas/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-canvas border border-line flex items-center justify-center font-bold text-ink text-xs">
                            {kiosk.kioskName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-ink">{kiosk.kioskName}</p>
                            <p className="text-[10px] text-ink-soft">{kiosk.kioskCategory || 'عام'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {kiosk.kioskRatingCount > 0 && kiosk.kioskRating > 0 ? (
                          <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg text-[11px] font-bold text-amber-800">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                            <span className="font-mono">{kiosk.kioskRating.toFixed(1)}</span>
                            <span className="text-[9px] text-amber-700 font-mono">
                              ({kiosk.kioskRatingCount})
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-lg text-[11px] font-bold text-emerald-800">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>جديد</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-ink">
                        {kiosk.completedOrdersCount}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-ink">
                        {formatEGP(kiosk.kioskSalesPiasters / 100)}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-black text-amber-700 bg-amber-50/40 text-sm">
                        {formatEGP(kiosk.feeRevenuePiasters / 100)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-canvas rounded-full overflow-hidden border border-line">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{ width: `${Math.min(100, Math.max( sharePercentage, 5 ))}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-bold text-ink-soft">
                            {sharePercentage}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Link href={`/student/kiosks/${kiosk.kioskId}`} target="_blank">
                          <Button variant="outline" size="sm" className="h-7 px-2.5 text-[11px]">
                            <span>عرض الكشك</span>
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-ink-soft text-xs">
            لا توجد بيانات متاحة للأكشاك في الفترة المختارة.
          </div>
        )}
      </div>

      {/* Two Columns: Payment Breakdown + Daily Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods Breakdown (1 Col) */}
        <div className="bg-surface border border-line/80 rounded-3xl p-5 sm:p-6 shadow-warm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-line/60">
            <Wallet className="w-5 h-5 text-primary-ink" />
            <h3 className="font-display font-bold text-base text-ink">
              طرق الدفع والأرباح
            </h3>
          </div>

          <div className="space-y-3">
            {paymentMethods.length > 0 ? (
              paymentMethods.map((pm) => {
                const isCash = pm.paymentMethod === 'cash';
                const label = isCash ? 'كاش عند الاستلام' : 'محفظة إلكترونية (فودافون كاش)';
                const icon = isCash ? Banknote : Wallet;
                const IconComp = icon;

                return (
                  <div
                    key={pm.paymentMethod}
                    className="p-4 rounded-2xl bg-canvas border border-line space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-surface border border-line flex items-center justify-center text-ink">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs text-ink">{label}</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-ink-soft">
                        {pm.ordersCount} أوردر
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-line/40 text-[11px]">
                      <span className="text-ink-soft">المبيعات: <strong>{formatEGP(pm.kioskSalesPiasters / 100)}</strong></span>
                      <span className="text-amber-800 font-bold">أرباح الرسوم: {formatEGP(pm.feeRevenuePiasters / 100)}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 rounded-2xl bg-canvas border border-line space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-surface border border-line flex items-center justify-center text-ink">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-ink">كاش عند الاستلام</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-ink-soft">
                    {completedOrders} أوردر
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-line/40 text-[11px]">
                  <span className="text-ink-soft">المبيعات: <strong>{formatEGP(totalKioskSalesPiasters / 100)}</strong></span>
                  <span className="text-amber-800 font-bold">أرباح الرسوم: {formatEGP(totalFeePiasters / 100)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Daily Timeline History (2 Cols) */}
        <div className="lg:col-span-2 bg-surface border border-line/80 rounded-3xl p-5 sm:p-6 shadow-warm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line/60">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              <h3 className="font-display font-bold text-base text-ink">
                سجل الأداء والأرباح اليومية
              </h3>
            </div>
            <span className="text-[11px] font-body text-ink-soft">
              تطور المبيعات وأرباح الرسوم بالأيام
            </span>
          </div>

          {dailyTimeline.length > 0 ? (
            <div className="space-y-2.5">
              {dailyTimeline.map((item) => (
                <div
                  key={item.date}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-canvas border border-line hover:border-amber-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface border border-line flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] text-ink-soft font-mono">
                        {item.date.split('-')[1]}/{item.date.split('-')[2]}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-xs text-ink font-mono">{item.date}</p>
                      <p className="text-[10px] text-ink-soft">
                        {item.completedOrders} أوردر مكتمل
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end">
                    <div className="text-right">
                      <span className="text-[10px] text-ink-soft block">مبيعات الأكشاك</span>
                      <span className="font-mono text-xs font-bold text-ink">
                        {formatEGP(item.kioskSalesPiasters / 100)}
                      </span>
                    </div>

                    <div className="text-right bg-amber-50 border border-amber-200/80 px-3 py-1 rounded-xl">
                      <span className="text-[10px] text-amber-800 font-bold block">أرباح الرسوم</span>
                      <span className="font-mono text-xs font-black text-amber-900">
                        {formatEGP(item.feeRevenuePiasters / 100)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-ink-soft text-xs">
              لا توجد بيانات للأيام السابقة حتى الآن.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

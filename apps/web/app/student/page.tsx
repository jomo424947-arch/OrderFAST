'use client';

import React, { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useKioskStore } from '@/stores/useKioskStore';
import { useFavoriteStore } from '@/stores/useFavoriteStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { SearchInput } from '@/components/ui/SearchInput';
import { KioskCard } from '@/components/kiosk/KioskCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { KioskCardSkeleton } from '@/components/ui/LoadingSkeleton';
import { formatEGP } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import {
  Clock,
  ArrowLeft,
  ChevronLeft,
  Wallet,
  AlertTriangle,
  Zap,
  RotateCcw,
  SlidersHorizontal,
  ShoppingBag,
} from 'lucide-react';

type FilterTab = 'all' | 'highest_rated' | 'fastest' | 'favorites';

export default function StudentDashboardPage() {
  const { student, studentStatus } = useAuthStore();
  const { orders, fetchStudentOrders } = useOrderStore();
  const { kiosks, fetchKiosks, isLoading } = useKioskStore();
  const { favoriteKioskIds, isFavorite } = useFavoriteStore();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  useEffect(() => {
    fetchKiosks();
    if (student?.id) {
      fetchStudentOrders(student.id);
    }
  }, [student?.id, fetchKiosks, fetchStudentOrders]);

  // Orders for current student
  const studentOrders = useMemo(() => {
    return orders.filter(
      (o) => (student?.id ? o.studentId === student.id : true) || !o.studentId
    );
  }, [orders, student?.id]);

  // Active student order (if any is pending/preparing/ready)
  const activeOrder = useMemo(() => {
    return studentOrders.find(
      (o) =>
        o.status === 'PENDING_KIOSK' ||
        o.status === 'ACCEPTED' ||
        o.status === 'PREPARING' ||
        o.status === 'READY'
    );
  }, [studentOrders]);

  // Completed orders & stats
  const completedOrders = useMemo(() => {
    return studentOrders.filter((o) => o.status === 'COMPLETED');
  }, [studentOrders]);

  const totalSpent = useMemo(() => {
    return completedOrders.reduce((sum, o) => sum + o.total, 0);
  }, [completedOrders]);

  // Last order ONLY (MAX 1)
  const lastOrder = useMemo(() => {
    return studentOrders.length > 0 ? studentOrders[0] : null;
  }, [studentOrders]);

  // Filtered kiosks based on search and tab filter
  const filteredKiosks = useMemo(() => {
    const q = search.trim().toLowerCase();

    return kiosks
      .filter((k) => {
        if (k.isHidden) return false;

        // Search query filter
        if (q) {
          const matchName = k.name.toLowerCase().includes(q);
          const matchLoc = k.collegeLocation.toLowerCase().includes(q);
          const matchZone = k.campusZone ? k.campusZone.toLowerCase().includes(q) : false;
          const matchCat = k.category.toLowerCase().includes(q);
          if (!matchName && !matchLoc && !matchZone && !matchCat) {
            return false;
          }
        }

        // Tab filter
        if (activeTab === 'favorites') {
          return isFavorite(k.id);
        }

        return true;
      })
      .sort((a, b) => {
        if (activeTab === 'highest_rated') {
          return (Number(b.rating) || 0) - (Number(a.rating) || 0);
        }
        if (activeTab === 'fastest') {
          return (a.estimatedWaitMins || 15) - (b.estimatedWaitMins || 15);
        }
        return 0;
      });
  }, [kiosks, search, activeTab, isFavorite]);

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-10">
      {/* 1. Modern Search & Quick Filter Bar */}
      <div className="flex items-center gap-2.5 pt-1">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            placeholder="ابحث عن كشك، قهوة، وجبة، أو كلية..."
            className="rounded-2xl bg-surface shadow-xs border-line/80 focus:border-primary py-3"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setActiveTab(activeTab === 'all' ? 'highest_rated' : 'all');
          }}
          className={cn(
            'w-11 h-11 rounded-2xl border flex items-center justify-center transition-all flex-shrink-0 shadow-xs',
            activeTab !== 'all'
              ? 'bg-primary text-primary-ink border-primary font-bold shadow-glow'
              : 'bg-surface border-line text-ink-soft hover:text-ink hover:border-line/80'
          )}
          aria-label="تصفية"
          title="خيارات الفرز السريع"
        >
          <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
        </button>
      </div>

      {/* Account restriction warning banner if restricted */}
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

      {/* 2. Hero Promotional Banner - Tight Cropped, Bold & Large */}
      <Link
        href="/student/kiosks"
        className="block relative w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-ticket hover:shadow-floating transition-all duration-300 group select-none active:scale-[0.99]"
        aria-label="الطلب المسبق السريع - اطلب الآن"
      >
        <div className="relative w-full aspect-[972/430]">
          <Image
            src="/images/student_hero_banner.png"
            alt="وفر وقتك في الجامعة واستلم فريشك - الطلب المسبق السريع - اطلب الآن"
            fill
            className="object-cover group-hover:scale-[1.01] transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 1000px"
            priority
          />
        </div>
      </Link>

      {/* 3. Active Order Highlight Banner (If any) */}
      {activeOrder && (
        <Link
          href={`/student/orders/${activeOrder.id}`}
          className="block bg-surface border-2 border-primary/50 hover:border-primary rounded-3xl p-4 sm:p-5 shadow-warm hover:shadow-ticket transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-primary text-primary-ink flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-ink opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-ink" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm sm:text-base font-bold text-ink font-mono-nums">
                    أوردر نشط #{String(activeOrder.orderNumber).replace(/^#+/, '')}
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
                    ? 'جاهز للاستلام الآن من الكشك'
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

      {/* 4. Order Again Section (MAX 1 Order - Single most recent order) */}
      {lastOrder && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-primary stroke-[2.2]" />
              <h3 className="font-display font-bold text-base text-ink">
                أطلب مجدداً
              </h3>
            </div>
            <Link
              href="/student/orders"
              className="text-xs font-body font-bold text-accent hover:underline flex items-center gap-1"
            >
              <span>عرض السجل</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Link
            href={`/student/orders/${lastOrder.id}`}
            className="bg-surface border border-line/80 hover:border-primary/50 rounded-2xl p-4 transition-all group block shadow-xs hover:shadow-warm"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-display font-bold text-base text-ink group-hover:text-primary transition-colors">
                {lastOrder.kioskName}
              </span>
              <span className="font-mono text-sm font-bold text-ink font-mono-nums">
                {formatEGP(lastOrder.total)}
              </span>
            </div>

            <p className="font-body text-xs text-ink-soft line-clamp-1 mb-2.5">
              {lastOrder.items.map((it) => `${it.name} × ${it.quantity}`).join('، ')}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-line/50 text-xs">
              <span className="text-[11px] font-mono text-ink-soft">
                أحدث طلب #{String(lastOrder.orderNumber).replace(/^#+/, '')}
              </span>
              <div className="inline-flex items-center gap-1 text-primary font-bold group-hover:-translate-x-1 transition-transform">
                <span>تفاصيل الأوردر</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* 5. Kiosks Filter Tabs & Directory (Strictly NO Emojis) */}
      <div className="space-y-4 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-line/60">
          <div>
            <h3 className="font-display font-bold text-lg sm:text-xl text-ink">
              أكشاك الحرم الجامعي
            </h3>
            <p className="font-body text-xs text-ink-soft mt-0.5">
              منافذ البيع والكافيهات المتاحة للطلب والاستلام المباشر
            </p>
          </div>

          {/* Clean Text-Only Filter Tabs - Zero Emojis */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-body font-bold transition-all whitespace-nowrap',
                activeTab === 'all'
                  ? 'bg-ink text-white shadow-xs'
                  : 'bg-surface border border-line text-ink-soft hover:text-ink hover:border-line/80'
              )}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('highest_rated')}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-body font-bold transition-all whitespace-nowrap',
                activeTab === 'highest_rated'
                  ? 'bg-ink text-white shadow-xs'
                  : 'bg-surface border border-line text-ink-soft hover:text-ink hover:border-line/80'
              )}
            >
              الأعلى تقييماً
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('fastest')}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-body font-bold transition-all whitespace-nowrap',
                activeTab === 'fastest'
                  ? 'bg-ink text-white shadow-xs'
                  : 'bg-surface border border-line text-ink-soft hover:text-ink hover:border-line/80'
              )}
            >
              الأسرع تحضيراً
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('favorites')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-body font-bold transition-all whitespace-nowrap',
                activeTab === 'favorites'
                  ? 'bg-ink text-white shadow-xs'
                  : 'bg-surface border border-line text-ink-soft hover:text-ink hover:border-line/80'
              )}
            >
              <span>المفضلة</span>
              {favoriteKioskIds.length > 0 && (
                <span
                  className={cn(
                    'font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                    activeTab === 'favorites'
                      ? 'bg-white/20 text-white'
                      : 'bg-primary-soft text-primary-ink'
                  )}
                >
                  {favoriteKioskIds.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Kiosks Grid */}
        <div>
          {isLoading && kiosks.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <KioskCardSkeleton />
              <KioskCardSkeleton />
              <KioskCardSkeleton />
              <KioskCardSkeleton />
            </div>
          ) : filteredKiosks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {filteredKiosks.map((kiosk) => (
                <KioskCard key={kiosk.id} kiosk={kiosk} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="لا توجد أكشاك مطابقة"
              description="جرب البحث بكلمات أخرى أو اختر تبويباً مختلفاً."
              actionLabel="عرض جميع الأكشاك"
              onAction={() => {
                setSearch('');
                setActiveTab('all');
              }}
            />
          )}
        </div>
      </div>

      {/* 6. Compact Student Spending & Activity Summary */}
      <div className="pt-4 border-t border-line/60">
        <h4 className="font-display font-bold text-xs text-ink-soft mb-3 flex items-center gap-1.5">
          <Wallet className="w-3.5 h-3.5 text-accent" />
          <span>ملخص نشاطك الجامعي</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card className="p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-body text-ink-soft">إجمالي المصروفات</span>
              <Wallet className="w-3.5 h-3.5 text-accent" />
            </div>
            <p className="font-display font-bold text-base sm:text-lg text-ink font-mono-nums">
              {formatEGP(totalSpent)}
            </p>
            <span className="text-[10px] font-body text-ink-soft">
              {completedOrders.length} طلب مستلم
            </span>
          </Card>

          <Link href="/student/orders">
            <Card hoverable className="p-3.5 h-full">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-body text-ink-soft">إجمالي الطلبات</span>
                <ShoppingBag className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="font-display font-bold text-base sm:text-lg text-ink font-mono-nums">
                {studentOrders.length}
              </p>
              <span className="text-[10px] font-body text-accent font-semibold">
                عرض كل السجل
              </span>
            </Card>
          </Link>

          <Link href="/student/orders" className="col-span-2 sm:col-span-1">
            <Card hoverable className="p-3.5 h-full">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-body text-ink-soft">الطلبات النشطة</span>
                <Clock className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="font-display font-bold text-base sm:text-lg text-ink font-mono-nums">
                {activeOrder ? 1 : 0}
              </p>
              <span className="text-[10px] font-body text-ink-soft">
                {activeOrder ? 'جاري التحضير أو جاهز' : 'لا توجد طلبات جارية'}
              </span>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

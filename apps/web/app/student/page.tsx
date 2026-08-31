'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/useAuthStore';
import { useKioskStore } from '@/stores/useKioskStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { SearchInput } from '@/components/ui/SearchInput';
import { Tabs } from '@/components/ui/Tabs';
import { KioskCard } from '@/components/kiosk/KioskCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { CATEGORIES } from '@/lib/constants';
import { ArrowLeft, Clock, Sparkles } from 'lucide-react';
import { formatWaitTime } from '@/lib/formatters';

export default function StudentHomePage() {
  const { student, studentStatus } = useAuthStore();
  const { kiosks } = useKioskStore();
  const { orders } = useOrderStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isPending, startTransition] = React.useTransition();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    startTransition(() => {
      setSearchQuery(val);
    });
  };

  // Find any active student order to display an urgent floating tracking pill
  const activeOrder = useMemo(() => {
    return orders.find(
      (o) =>
        o.studentId === student.id &&
        (o.status === 'pending_review' ||
          o.status === 'accepted' ||
          o.status === 'preparing' ||
          o.status === 'ready_for_pickup')
    );
  }, [orders, student.id]);

  // Filter kiosks
  const filteredKiosks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return kiosks.filter((kiosk) => {
      const matchesSearch =
        !q ||
        kiosk.name.toLowerCase().includes(q) ||
        kiosk.collegeLocation.toLowerCase().includes(q) ||
        kiosk.category.toLowerCase().includes(q);

      const matchesCat =
        selectedCategory === 'all' ||
        (selectedCategory === 'my_college' &&
          kiosk.collegeLocation.includes('الحاسبات')) ||
        (selectedCategory === 'drinks' &&
          kiosk.category.includes('مشروبات')) ||
        (selectedCategory === 'sandwiches' &&
          (kiosk.category.includes('ساندوتشات') ||
            kiosk.category.includes('سناكس'))) ||
        (selectedCategory === 'sweets' &&
          kiosk.category.includes('حلويات'));

      return matchesSearch && matchesCat;
    });
  }, [kiosks, searchQuery, selectedCategory]);

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      {/* Top Greeting Header matching visual reference */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-ink">
            أهلاً {student.name.split(' ')[0]} 👋
          </h2>
          <p className="font-body text-xs text-ink-soft mt-0.5">
            {student.college}
          </p>
        </div>
      </div>

      {/* Warning banner if user has account warning/restriction */}
      {studentStatus === 'restricted' && (
        <div className="bg-danger-soft border border-danger/30 rounded-2xl p-3.5 text-xs font-body text-danger flex items-center justify-between">
          <span>⚠️ حسابك مقيد مؤقتاً لعدم استلام أوردر سابق.</span>
          <Link href="/student/profile" className="font-bold underline">
            التفاصيل
          </Link>
        </div>
      )}

      {/* Active Order Highlight Banner */}
      {activeOrder && (
        <Link
          href={`/student/orders/${activeOrder.id}`}
          className="block bg-surface border-2 border-primary/40 rounded-2xl p-3.5 shadow-warm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
              <div>
                <span className="font-mono text-sm font-bold text-ink">
                  أوردر نشط #{activeOrder.orderNumber}
                </span>
                <p className="font-body text-xs text-ink-soft">
                  {activeOrder.kioskName} · {activeOrder.status === 'ready_for_pickup' ? 'جاهز للاستلام الآن!' : 'جاري التحضير'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-primary-ink font-body text-xs font-bold">
              <span>تتبع الأوردر</span>
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      )}

      {/* Search Input Bar matching design */}
      <SearchInput
        value={searchQuery}
        onChange={handleSearchChange}
        onClear={() => {
          startTransition(() => {
            setSearchQuery('');
          });
        }}
        placeholder="دور على كشك أو صنف"
      />

      {/* Category Filter Chips matching design */}
      <Tabs
        variant="chips"
        tabs={CATEGORIES}
        activeTab={selectedCategory}
        onChange={setSelectedCategory}
      />

      {/* Section Title */}
      <div className="pt-2">
        <h3 className="font-body font-semibold text-xs text-ink-soft mb-3">
          الأكشاك المتاحة دلوقتي
        </h3>

        {/* Kiosks List */}
        {filteredKiosks.length > 0 ? (
          <div className="space-y-2.5">
            {filteredKiosks.map((kiosk) => (
              <KioskCard key={kiosk.id} kiosk={kiosk} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="مفيش أكشاك مطابقة للبحث"
            description="جرب تبحث باسم كشك تاني أو اختار تصنيف 'الكل'."
            actionLabel="عرض كل الأكشاك"
            onAction={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
          />
        )}
      </div>
    </div>
  );
}

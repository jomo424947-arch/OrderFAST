'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useKioskStore } from '@/stores/useKioskStore';
import { SearchInput } from '@/components/ui/SearchInput';
import { KioskCard } from '@/components/kiosk/KioskCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { KioskCardSkeleton } from '@/components/ui/LoadingSkeleton';
import { Store } from 'lucide-react';

export default function KiosksListPage() {
  const { kiosks, fetchKiosks, isLoading } = useKioskStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchKiosks();
  }, [fetchKiosks]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return kiosks.filter((k) => {
      if (!q) return true;
      return (
        k.name.toLowerCase().includes(q) ||
        k.collegeLocation.toLowerCase().includes(q) ||
        (k.campusZone && k.campusZone.toLowerCase().includes(q)) ||
        k.category.toLowerCase().includes(q)
      );
    });
  }, [kiosks, search]);

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-line/50">
        <div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-ink">
            دليل أكشاك الجامعة
          </h2>
          <p className="font-body text-xs sm:text-sm text-ink-soft mt-0.5">
            تصفح جميع الأكشاك ومنافذ البيع في الحرم الجامعي واطلب مسبقاً
          </p>
        </div>

        {/* Available Kiosks Count Pill */}
        <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-xl bg-surface border border-line/70 text-xs font-body font-semibold text-ink-soft shadow-xs">
          <Store className="w-3.5 h-3.5 text-accent" />
          <span>
            {filtered.length} {filtered.length === 1 ? 'منفذ متاح' : 'منافذ متاحة'}
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div>
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          placeholder="ابحث بالاسم، الكلية، أو نوع المأكولات والمشروبات..."
        />
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
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {filtered.map((kiosk) => (
              <KioskCard key={kiosk.id} kiosk={kiosk} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="لا توجد أكشاك مطابقة"
            description="جرب البحث بكلمات أخرى أو اسم كلية مختلفة."
            actionLabel="عرض جميع الأكشاك"
            onAction={() => setSearch('')}
          />
        )}
      </div>
    </div>
  );
}


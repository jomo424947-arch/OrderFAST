'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useKioskStore } from '@/stores/useKioskStore';
import { SearchInput } from '@/components/ui/SearchInput';
import { KioskCard } from '@/components/kiosk/KioskCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { COLLEGES } from '@/lib/constants';

export default function KiosksListPage() {
  const { kiosks, fetchKiosks } = useKioskStore();
  const [search, setSearch] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('all');

  useEffect(() => {
    fetchKiosks();
  }, [fetchKiosks]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return kiosks.filter((k) => {
      const matchSearch =
        !q ||
        k.name.toLowerCase().includes(q) ||
        k.collegeLocation.toLowerCase().includes(q) ||
        k.category.toLowerCase().includes(q);

      const matchCollege =
        selectedCollege === 'all' || k.collegeLocation.includes(selectedCollege);

      return matchSearch && matchCollege;
    });
  }, [kiosks, search, selectedCollege]);

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <div>
        <h2 className="font-display font-bold text-2xl text-ink">
          دليل أكشاك الجامعة
        </h2>
        <p className="font-body text-xs text-ink-soft mt-0.5">
          تصفح جميع الأكشاك ومنافذ البيع في الحرم الجامعي
        </p>
      </div>

      {/* Search Input */}
      <SearchInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onClear={() => setSearch('')}
        placeholder="ابحث عن كشك بالاسم أو الموقع..."
      />

      {/* College Dropdown Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-body text-ink-soft whitespace-nowrap">
          تصفية بالكلية:
        </span>
        <select
          value={selectedCollege}
          onChange={(e) => setSelectedCollege(e.target.value)}
          className="bg-surface border border-line rounded-xl px-3 py-1.5 text-xs font-body text-ink focus:outline-none focus:border-primary cursor-pointer w-full"
        >
          <option value="all">جميع كليات الجامعة</option>
          {COLLEGES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="space-y-2.5 pt-2">
        {filtered.length > 0 ? (
          filtered.map((kiosk) => <KioskCard key={kiosk.id} kiosk={kiosk} />)
        ) : (
          <EmptyState
            title="لا توجد أكشاك مطابقة"
            description="جرب البحث بكلمات أخرى أو اختر جميع الكليات."
            actionLabel="عرض كل الأكشاك"
            onAction={() => {
              setSearch('');
              setSelectedCollege('all');
            }}
          />
        )}
      </div>
    </div>
  );
}

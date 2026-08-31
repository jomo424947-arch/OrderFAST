'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useKioskStore } from '@/stores/useKioskStore';
import { useCartStore } from '@/stores/useCartStore';
import { MenuItemRow } from '@/components/menu/MenuItemRow';
import { CartBar } from '@/components/menu/CartBar';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChevronRight, Clock, Store, AlertCircle } from 'lucide-react';
import { formatWaitTime } from '@/lib/formatters';

export default function KioskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const kioskId = params.id as string;

  const { kiosks, menuItems, categories } = useKioskStore();
  const { addItem, items: cartItems, getSubtotal, getTotalItems, kiosk: cartKiosk } = useCartStore();

  const kiosk = kiosks.find((k) => k.id === kioskId) || kiosks[0];

  // Group items by category for this kiosk
  const kioskItems = useMemo(() => {
    return menuItems.filter((i) => i.kioskId === kiosk.id || !i.kioskId);
  }, [menuItems, kiosk.id]);

  const kioskCategories = useMemo(() => {
    return categories.filter((c) => c.kioskId === kiosk.id || !c.kioskId);
  }, [categories, kiosk.id]);

  const totalCartCount = getTotalItems();
  const totalCartAmount = getSubtotal();

  return (
    <div className="max-w-xl mx-auto pb-24 space-y-4">
      {/* Screen Header matching design reference */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full bg-surface border border-line flex items-center justify-center text-ink hover:bg-canvas transition-colors"
            aria-label="الرجوع"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-lg text-ink">
                {kiosk.name}
              </h3>
              <StatusPill status={kiosk.isOpen ? 'open' : 'closed'} />
            </div>
            <p className="font-body text-xs text-ink-soft mt-0.5">
              {kiosk.collegeLocation} · {kiosk.openingHours}
            </p>
          </div>
        </div>

        {kiosk.isOpen && (
          <span className="flex items-center gap-1 font-mono text-xs text-ink-soft font-semibold bg-surface border border-line px-2.5 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            {formatWaitTime(kiosk.estimatedWaitMins, true)}
          </span>
        )}
      </div>

      {/* Warning if Kiosk is Closed */}
      {!kiosk.isOpen && (
        <div className="bg-canvas border border-line rounded-2xl p-3.5 text-xs font-body text-ink-soft flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-ink-soft flex-shrink-0" />
          <span>الكشك مغلق حالياً ولا يستقبل طلبات جديدة في الوقت الحالي.</span>
        </div>
      )}

      {/* Menu Categories and Item Lists */}
      <div className="space-y-6 pt-2">
        {kioskCategories.map((cat) => {
          const itemsInCat = kioskItems.filter((i) => i.categoryId === cat.id);
          if (itemsInCat.length === 0) return null;

          return (
            <div key={cat.id} className="space-y-1">
              {/* Category Header */}
              <h4 className="font-display font-bold text-sm text-ink pb-2 border-b-[1.5px] border-line/80">
                {cat.name}
              </h4>

              {/* Items */}
              <div className="divide-y divide-line/60">
                {itemsInCat.map((item) => (
                  <MenuItemRow
                    key={item.id}
                    item={item}
                    disabled={!kiosk.isOpen}
                    onAdd={(it) => addItem(it, kiosk)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Sticky Cart Bar */}
      {totalCartCount > 0 && (
        <CartBar
          itemCount={totalCartCount}
          totalAmount={totalCartAmount}
          href="/student/cart"
        />
      )}
    </div>
  );
}

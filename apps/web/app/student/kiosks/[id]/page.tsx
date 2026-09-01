'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useKioskStore } from '@/stores/useKioskStore';
import { useCartStore } from '@/stores/useCartStore';
import { MenuItemRow } from '@/components/menu/MenuItemRow';
import { CartBar } from '@/components/menu/CartBar';
import { StatusPill } from '@/components/ui/StatusPill';
import { Button } from '@/components/ui/Button';
import { formatEGP, formatWaitTime } from '@/lib/formatters';
import {
  ChevronRight,
  Clock,
  Store,
  AlertCircle,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Receipt,
  ArrowLeft,
} from 'lucide-react';

export default function KioskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const kioskId = params.id as string;

  const { kiosks, menuItems, categories, fetchKioskById, fetchMenu } = useKioskStore();
  const {
    addItem,
    items: cartItems,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotal,
    getTotalItems,
    kiosk: cartKiosk,
  } = useCartStore();

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  useEffect(() => {
    if (kioskId) {
      fetchKioskById(kioskId);
      fetchMenu(kioskId, false);
    }
  }, [kioskId, fetchKioskById, fetchMenu]);

  const kiosk = kiosks.find((k) => k.id === kioskId) || kiosks[0] || {
    id: kioskId,
    name: 'الكشك',
    collegeLocation: '',
    category: '',
    isOpen: true,
    openingHours: '',
    estimatedWaitMins: 15,
  };

  // Group items by category for this kiosk (exclude items under review)
  const kioskItems = useMemo(() => {
    return menuItems.filter(
      (i) => (i.kioskId === kiosk.id || !i.kioskId) && !i.isUnderReview
    );
  }, [menuItems, kiosk.id]);

  const kioskCategories = useMemo(() => {
    return categories.filter((c) => c.kioskId === kiosk.id || !c.kioskId);
  }, [categories, kiosk.id]);

  const totalCartCount = getTotalItems();
  const totalCartAmount = getSubtotal();

  // If cart has items from another kiosk
  const isDifferentKioskCart = cartKiosk && cartKiosk.id !== kiosk.id && totalCartCount > 0;

  return (
    <div className="max-w-5xl mx-auto pb-24 space-y-6">
      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line/70">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-surface border border-line flex items-center justify-center text-ink hover:bg-canvas transition-colors"
            aria-label="الرجوع"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-xl sm:text-2xl text-ink">
                {kiosk.name}
              </h2>
              <StatusPill status={kiosk.isOpen ? 'open' : 'closed'} />
            </div>
            <p className="font-body text-xs text-ink-soft mt-0.5">
              {kiosk.collegeLocation} · {kiosk.openingHours} · {kiosk.category}
            </p>
          </div>
        </div>

        {kiosk.isOpen && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-mono text-xs text-ink font-semibold bg-surface border border-line px-3 py-1.5 rounded-full shadow-sm">
              <Clock className="w-3.5 h-3.5 text-accent" />
              <span>وقت الانتظار التقريبي: {formatWaitTime(kiosk.estimatedWaitMins, true)}</span>
            </span>
          </div>
        )}
      </div>

      {/* Warning if Kiosk is Closed */}
      {!kiosk.isOpen && (
        <div className="bg-danger-soft/20 border border-danger/30 rounded-2xl p-4 text-xs font-body text-danger flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>الكشك مغلق حالياً ولا يستقبل طلبات جديدة في الوقت الحالي. يمكنك تصفح الأصناف والأسعار.</span>
        </div>
      )}

      {/* Cart Conflict Notice */}
      {isDifferentKioskCart && (
        <div className="bg-accent-soft/30 border border-accent/40 rounded-2xl p-4 text-xs font-body text-ink flex items-center justify-between gap-3">
          <span>
            لديك أصناف في السلة من <strong>{cartKiosk.name}</strong>. إضافة أصناف من هنا ستستبدل طلبك السابق.
          </span>
          <button
            type="button"
            onClick={() => clearCart()}
            className="text-xs font-bold text-danger hover:underline whitespace-nowrap"
          >
            تفريغ السلة
          </button>
        </div>
      )}

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveCategoryFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-body font-bold transition-all whitespace-nowrap ${
            activeCategoryFilter === 'all'
              ? 'bg-primary text-primary-ink shadow-sm'
              : 'bg-surface border border-line text-ink-soft hover:text-ink'
          }`}
        >
          كل الأصناف ({kioskItems.length})
        </button>
        {kioskCategories.map((cat) => {
          const count = kioskItems.filter((i) => i.categoryId === cat.id).length;
          if (count === 0) return null;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategoryFilter(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-body font-bold transition-all whitespace-nowrap ${
                activeCategoryFilter === cat.id
                  ? 'bg-primary text-primary-ink shadow-sm'
                  : 'bg-surface border border-line text-ink-soft hover:text-ink'
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Main Grid: Menu list (2 cols) + Live Bill summary (1 col on lg) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Menu Items List */}
        <div className="lg:col-span-2 space-y-6">
          {kioskCategories
            .filter(
              (cat) =>
                activeCategoryFilter === 'all' || activeCategoryFilter === cat.id
            )
            .map((cat) => {
              const itemsInCat = kioskItems.filter((i) => i.categoryId === cat.id);
              if (itemsInCat.length === 0) return null;

              return (
                <div
                  key={cat.id}
                  className="bg-surface border border-line/80 rounded-3xl p-5 shadow-warm space-y-3"
                >
                  {/* Category Title */}
                  <h3 className="font-display font-bold text-base text-ink pb-2 border-b border-line/60 flex items-center justify-between">
                    <span>{cat.name}</span>
                    <span className="text-xs font-body font-normal text-ink-soft">
                      {itemsInCat.length} صنف
                    </span>
                  </h3>

                  {/* Items list */}
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

        {/* Live Bill / Order Summary (الفاتورة) on larger screens */}
        <div className="sticky top-20 space-y-4">
          <div className="bg-surface border border-line/80 rounded-3xl p-5 sm:p-6 shadow-warm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line/60">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary-ink" />
                <h3 className="font-display font-bold text-base text-ink">
                  فاتورة الطلب الحالية
                </h3>
              </div>
              {totalCartCount > 0 && (
                <span className="font-mono text-xs font-bold bg-primary-soft text-primary-ink px-2 py-0.5 rounded-full font-mono-nums">
                  {totalCartCount} أصناف
                </span>
              )}
            </div>

            {totalCartCount > 0 ? (
              <div className="space-y-4">
                {/* Items breakdown list */}
                <div className="divide-y divide-line/60 max-h-60 overflow-y-auto pr-1">
                  {cartItems.map((ci) => (
                    <div
                      key={ci.menuItem.id}
                      className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-body font-semibold text-xs text-ink truncate">
                          {ci.menuItem.name}
                        </p>
                        <p className="font-mono text-[11px] text-ink-soft">
                          {formatEGP(ci.menuItem.price)} × {ci.quantity}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Stepper */}
                        <div className="flex items-center gap-1.5 bg-canvas px-1.5 py-0.5 rounded-lg border border-line">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(ci.menuItem.id, ci.quantity - 1)
                            }
                            className="w-5 h-5 rounded flex items-center justify-center text-ink-soft hover:text-ink"
                            aria-label="تقليل"
                          >
                            {ci.quantity === 1 ? (
                              <Trash2 className="w-3 h-3 text-danger" />
                            ) : (
                              <Minus className="w-3 h-3" />
                            )}
                          </button>
                          <span className="font-mono text-xs font-bold min-w-[14px] text-center">
                            {ci.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(ci.menuItem.id, ci.quantity + 1)
                            }
                            className="w-5 h-5 rounded flex items-center justify-center text-ink-soft hover:text-ink"
                            aria-label="زيادة"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-mono text-xs font-bold text-ink min-w-[50px] text-left font-mono-nums">
                          {formatEGP(ci.menuItem.price * ci.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal Calculation */}
                <div className="pt-3 border-t border-line/60 space-y-2">
                  <div className="flex items-center justify-between text-xs font-body text-ink-soft">
                    <span>إجمالي الأصناف</span>
                    <span className="font-mono font-semibold font-mono-nums">{formatEGP(totalCartAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-bold font-body text-ink pt-1 border-t border-line/40">
                    <span>المطلوب عند الاستلام</span>
                    <span className="font-mono text-base text-primary-ink font-mono-nums font-black">
                      {formatEGP(totalCartAmount)}
                    </span>
                  </div>
                  <p className="text-[10px] font-body text-ink-soft text-center leading-relaxed">
                    الدفع عند استلام الأوردر من الكشك (كاش / محفظة)
                  </p>
                </div>

                {/* Checkout Link Button */}
                <Link href="/student/cart" className="block">
                  <Button variant="primary" size="md" className="w-full shadow-warm">
                    <span>إتمام وتأكيد الطلب</span>
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-canvas border border-line flex items-center justify-center mx-auto text-ink-soft">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <p className="font-body font-bold text-xs text-ink">
                  لم تختر أي أصناف بعد
                </p>
                <p className="font-body text-[11px] text-ink-soft">
                  اضغط على أي صنف من القائمة لإضافته للفاتورة مباشرة.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Bottom Sticky Cart Bar on Mobile */}
      {totalCartCount > 0 && (
        <div className="lg:hidden">
          <CartBar
            itemCount={totalCartCount}
            totalAmount={totalCartAmount}
            href="/student/cart"
          />
        </div>
      )}
    </div>
  );
}

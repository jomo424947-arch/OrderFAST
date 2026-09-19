'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useKioskStore } from '@/stores/useKioskStore';
import { useCartStore } from '@/stores/useCartStore';
import { MenuItemRow } from '@/components/menu/MenuItemRow';
import { FloatingCartBill } from '@/components/menu/FloatingCartBill';
import { StatusPill } from '@/components/ui/StatusPill';
import { Button } from '@/components/ui/Button';
import { formatEGP, formatWaitTime } from '@/lib/formatters';
import { getServiceFeeEGP } from '@/lib/constants';
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
  Tag,
  Flame,
  Sparkles,
  Star,
  EyeOff,
  ChevronDown,
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
    getItemQuantity,
    kiosk: cartKiosk,
  } = useCartStore();

  const [activeSection, setActiveSection] = useState<'food' | 'drinks'>('food');
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

  const offerItems = useMemo(() => {
    return kioskItems.filter((i) => i.originalPrice && i.originalPrice > i.price);
  }, [kioskItems]);

  // Map category to main section ('food' = فطار وغدا, 'drinks' = مشروبات)
  const getCategorySection = (categoryName: string): 'food' | 'drinks' => {
    const name = (categoryName || '').trim().toLowerCase();
    if (
      name.includes('مشروب') ||
      name.includes('ساخنة') ||
      name.includes('باردة') ||
      name.includes('عصائر') ||
      name.includes('عصير') ||
      name.includes('ميلك شيك') ||
      name.includes('فرابيه') ||
      name.includes('حلويات') ||
      name.includes('آيس كريم') ||
      name.includes('إضافات المشروبات') ||
      name.includes('قهوة') ||
      name.includes('شاي')
    ) {
      return 'drinks';
    }
    return 'food';
  };

  const sectionCounts = useMemo(() => {
    let food = 0;
    let drinks = 0;

    for (const item of kioskItems) {
      const cat = kioskCategories.find((c) => c.id === item.categoryId);
      const sec = getCategorySection(cat?.name || '');
      if (sec === 'food') food++;
      else if (sec === 'drinks') drinks++;
    }

    return {
      food,
      drinks,
      all: kioskItems.length,
      offers: offerItems.length,
    };
  }, [kioskItems, kioskCategories, offerItems.length]);

  const availableCategoriesForSection = useMemo(() => {
    return kioskCategories.filter((c) => getCategorySection(c.name) === activeSection);
  }, [kioskCategories, activeSection]);

  const currentSectionOfferItems = useMemo(() => {
    return offerItems.filter((i) => {
      const cat = kioskCategories.find((c) => c.id === i.categoryId);
      return getCategorySection(cat?.name || '') === activeSection;
    });
  }, [offerItems, kioskCategories, activeSection]);

  const handleSelectSection = (section: 'food' | 'drinks') => {
    setActiveSection(section);
    setActiveCategoryFilter('all');
  };

  const totalCartCount = getTotalItems();
  const totalCartAmount = getSubtotal();
  const serviceFee = getServiceFeeEGP(totalCartAmount);
  const totalWithFees = totalCartAmount + serviceFee;

  // If cart has items from another kiosk
  const isDifferentKioskCart = cartKiosk && cartKiosk.id !== kiosk.id && totalCartCount > 0;

  if (kiosk.isHidden) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <EyeOff className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-ink">هذا الكشك غير متاح حالياً</h2>
        <p className="text-sm text-ink-soft leading-relaxed">
          عذراً، هذا الكشك مخفي أو غير متاح للطلبات في الوقت الحالي.
        </p>
        <div className="pt-2">
          <Link href="/student">
            <Button variant="primary" size="md">
              العودة لقائمة الأكشاك
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
              {Boolean(kiosk.ratingCount && kiosk.ratingCount > 0 && Number(kiosk.rating) > 0) ? (
                <div
                  className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-lg text-xs font-bold text-amber-800"
                  title={`${kiosk.ratingCount} تقييم`}
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span className="font-mono">{Number(kiosk.rating).toFixed(1)}</span>
                  <span className="text-[10px] text-amber-700/80 font-mono font-normal mr-0.5">
                    ({kiosk.ratingCount})
                  </span>
                </div>
              ) : (
                <div
                  className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-lg text-xs font-bold text-emerald-800"
                  title="كشك جديد - لم يحصل على تقييمات بعد"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 fill-emerald-200" />
                  <span>جديد</span>
                </div>
              )}
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

      {/* 1. Main Sections (تصنيفين رئيسيين فقط: فطار وغدا | مشروبات) */}
      <div className="grid grid-cols-2 p-1.5 bg-surface border border-line/90 rounded-2xl shadow-xs gap-1.5">
        <button
          type="button"
          onClick={() => handleSelectSection('food')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-display font-bold text-xs sm:text-sm transition-all ${activeSection === 'food'
            ? 'bg-primary text-primary-ink shadow-sm ring-2 ring-primary/25 scale-[1.01]'
            : 'text-ink-soft hover:text-ink hover:bg-canvas'
            }`}
        >
          <span>فطار وغدا</span>
          <span
            className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${activeSection === 'food'
              ? 'bg-black/10 text-primary-ink'
              : 'bg-canvas border border-line/60 text-ink-soft'
              }`}
          >
            {sectionCounts.food}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectSection('drinks')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-display font-bold text-xs sm:text-sm transition-all ${activeSection === 'drinks'
            ? 'bg-primary text-primary-ink shadow-sm ring-2 ring-primary/25 scale-[1.01]'
            : 'text-ink-soft hover:text-ink hover:bg-canvas'
            }`}
        >
          <span>مشروبات</span>
          <span
            className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${activeSection === 'drinks'
              ? 'bg-black/10 text-primary-ink'
              : 'bg-canvas border border-line/60 text-ink-soft'
              }`}
          >
            {sectionCounts.drinks}
          </span>
        </button>
      </div>

      {/* 2. Subcategories Dropdown (قائمة منسدلة احترافية بدون أي إيموجي) */}
      <div className="space-y-1.5">
        <label htmlFor="subcategory-select" className="block text-xs font-display font-bold text-ink-soft px-1">
          اختر القسم الفرعي:
        </label>
        <div className="relative">
          <select
            id="subcategory-select"
            value={activeCategoryFilter}
            onChange={(e) => setActiveCategoryFilter(e.target.value)}
            className="w-full bg-surface border border-line text-ink font-display font-bold text-xs sm:text-sm rounded-2xl py-3 px-4 pl-10 shadow-xs hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer appearance-none"
            dir="rtl"
          >
            <option value="all">
              {activeSection === 'food'
                ? `كل الفطار والغدا (${sectionCounts.food} صنف)`
                : `كل المشروبات (${sectionCounts.drinks} صنف)`}
            </option>

            {currentSectionOfferItems.length > 0 && (
              <option value="offers">
                العروض الحصرية ({currentSectionOfferItems.length} صنف)
              </option>
            )}

            {availableCategoriesForSection.map((cat) => {
              const count = kioskItems.filter((i) => i.categoryId === cat.id).length;
              if (count === 0) return null;
              return (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({count} صنف)
                </option>
              );
            })}
          </select>

          {/* Left Arrow Icon for RTL Dropdown */}
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-soft">
            <ChevronDown className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Main Grid: Menu list (2 cols) + Live Bill summary (1 col on lg) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Menu Items List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Special Offers Section if active and has offers */}
          {currentSectionOfferItems.length > 0 &&
            (activeCategoryFilter === 'offers' || activeCategoryFilter === 'all') && (
              <div className="bg-gradient-to-br from-amber-500/10 via-surface to-accent-soft/20 border-2 border-accent/40 rounded-3xl p-5 shadow-warm space-y-3 relative overflow-hidden">
                <div className="absolute -left-6 -top-6 text-accent/5 pointer-events-none select-none">
                  <Tag className="w-32 h-32 stroke-[1]" />
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-accent/20 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-accent text-white flex items-center justify-center shadow-xs">
                      <Tag className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-black text-base sm:text-lg text-ink">
                          عروض {activeSection === 'food' ? 'الفطار والغداء' : 'المشروبات'} الحصرية
                        </h3>
                        <span className="text-[10px] font-body font-bold bg-danger text-white px-2 py-0.5 rounded-full shadow-xs">
                          خصومات خاصة
                        </span>
                      </div>
                      <p className="font-body text-[11px] text-ink-soft">
                        تخفيضات محدودة ومميزة على أصناف مختارة بالكشك
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-body font-bold text-accent bg-accent-soft px-2.5 py-1 rounded-xl border border-accent/30 font-mono-nums">
                    {currentSectionOfferItems.length} عروض
                  </span>
                </div>

                <div className="divide-y divide-line/60 relative z-10">
                  {currentSectionOfferItems.map((item) => (
                    <MenuItemRow
                      key={`offer-${item.id}`}
                      item={item}
                      kioskWaitTime={kiosk.estimatedWaitMins}
                      cartQuantity={getItemQuantity(item.id)}
                      disabled={!kiosk.isOpen}
                      onAdd={(it) => addItem(it, kiosk)}
                      onUpdateQuantity={(itemId, q) => updateQuantity(itemId, q)}
                    />
                  ))}
                </div>
              </div>
            )}

          {/* Subcategories belonging to active section */}
          {availableCategoriesForSection
            .filter((cat) => activeCategoryFilter === 'all' || activeCategoryFilter === cat.id)
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
                        kioskWaitTime={kiosk.estimatedWaitMins}
                        cartQuantity={getItemQuantity(item.id)}
                        disabled={!kiosk.isOpen}
                        onAdd={(it) => addItem(it, kiosk)}
                        onUpdateQuantity={(itemId, q) => updateQuantity(itemId, q)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Live Bill / Order Summary (الفاتورة) on larger screens (Hidden on mobile) */}
        <div className="hidden lg:block sticky top-20 space-y-4">
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
                  <div className="flex items-center justify-between text-xs font-body text-ink-soft font-medium">
                    <span>إجمالي الأصناف</span>
                    <span className="font-mono font-semibold font-mono-nums">{formatEGP(totalCartAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-body text-ink-soft font-medium">
                    <span>رسوم الخدمة</span>
                    <span className="font-mono font-semibold font-mono-nums">{formatEGP(serviceFee)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-bold font-body text-ink pt-1.5 border-t border-line/40">
                    <span>المطلوب عند الاستلام</span>
                    <span className="font-mono text-base text-primary-ink font-mono-nums font-black">
                      {formatEGP(totalWithFees)}
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

      {/* Floating Bill on Mobile (ظاهرة فقط عند إضافة شيء وتطفو فوق المحتوى) */}
      <FloatingCartBill
        kiosk={kiosk}
        cartItems={cartItems}
        totalCartCount={totalCartCount}
        totalCartAmount={totalCartAmount}
        updateQuantity={updateQuantity}
        checkoutHref="/student/cart"
      />
    </div>
  );
}

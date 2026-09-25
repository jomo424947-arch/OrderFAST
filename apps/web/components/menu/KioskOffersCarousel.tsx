'use client';

import React, { useRef, useState, useEffect } from 'react';
import { MenuItem, Kiosk } from '@/types';
import { formatEGP } from '@/lib/formatters';
import {
  Tag,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Clock,
  Sparkles,
  Package,
} from 'lucide-react';
import { BrandFoodIcon } from './MenuItemRow';
import { cn } from '@/lib/utils';

export interface KioskOffersCarouselProps {
  offers: MenuItem[];
  kiosk: Kiosk;
  cartQuantityMap?: Record<string, number>;
  onAdd: (item: MenuItem) => void;
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  activeSection?: 'food' | 'drinks';
}

export const KioskOffersCarousel: React.FC<KioskOffersCarouselProps> = ({
  offers,
  kiosk,
  cartQuantityMap = {},
  onAdd,
  onUpdateQuantity,
  activeSection,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const currentScroll = Math.abs(el.scrollLeft);

    setCanScrollLeft(currentScroll > 10);
    setCanScrollRight(currentScroll < maxScroll - 10);

    const firstCard = el.querySelector('[data-offer-card]') as HTMLElement | null;
    const cardWidth = firstCard ? firstCard.offsetWidth + 12 : 300;
    const newIndex = Math.round(currentScroll / cardWidth);
    setActiveIndex(Math.min(Math.max(newIndex, 0), offers.length - 1));
  };

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [offers.length]);

  const scrollToOffer = (index: number) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const cards = el.querySelectorAll('[data-offer-card]');
    if (cards[index]) {
      (cards[index] as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        inline: 'start',
        block: 'nearest',
      });
      setActiveIndex(index);
    }
  };

  const handleScroll = (direction: 'next' | 'prev') => {
    const nextIdx =
      direction === 'next'
        ? Math.min(activeIndex + 1, offers.length - 1)
        : Math.max(activeIndex - 1, 0);
    scrollToOffer(nextIdx);
  };

  // Mouse Drag-to-Scroll handlers for desktop / mouse users
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = x - startXRef.current;
    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
  };

  if (!offers || offers.length === 0) return null;

  return (
    <section className="bg-surface border border-line/80 rounded-3xl p-3 sm:p-5 shadow-warm space-y-3">
      {/* Sleek, clean single-line header with swipe cue & nav arrows */}
      <div className="flex items-center justify-between pb-2 border-b border-line/60">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none select-none">🔥</span>
          <h3 className="font-display font-black text-base sm:text-lg text-ink whitespace-nowrap">
            عروض الكشك
          </h3>
          <span className="text-[11px] sm:text-xs font-mono font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20 font-mono-nums whitespace-nowrap">
            {offers.length} {offers.length === 1 ? 'عرض' : 'عروض'}
          </span>
        </div>

        {/* Always-Visible Navigation Arrows */}
        {offers.length > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleScroll('prev')}
              disabled={activeIndex === 0}
              className="w-7 h-7 rounded-full bg-canvas hover:bg-surface border border-line text-ink flex items-center justify-center shadow-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              aria-label="العرض السابق"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.2]" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('next')}
              disabled={activeIndex === offers.length - 1}
              className="w-7 h-7 rounded-full bg-canvas hover:bg-surface border border-line text-ink flex items-center justify-center shadow-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              aria-label="العرض التالي"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>
        )}
      </div>

      {/* Swipeable Horizontal Scroll Container with Mouse Drag & Peek enabled */}
      <div
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className="flex gap-3 sm:gap-4 overflow-x-auto pb-1.5 pt-1 -mx-1 px-1 sm:mx-0 sm:px-0 scroll-smooth snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {offers.map((item) => {
          const qty = cartQuantityMap[item.id] || 0;
          const isAvailable = item.isAvailable && kiosk.isOpen;
          const hasOffer = !!(item.originalPrice && item.originalPrice > item.price);
          const discountAmount = hasOffer ? item.originalPrice! - item.price : 0;
          const discountPercent = hasOffer
            ? Math.round((discountAmount / item.originalPrice!) * 100)
            : 0;
          const prepTime = kiosk.estimatedWaitMins || item.preparationTimeMins || 5;

          return (
            <div
              key={`carousel-offer-${item.id}`}
              data-offer-card
              className={cn(
                'snap-start flex-shrink-0 w-[74vw] max-w-[285px] sm:w-[330px] md:w-[360px] min-h-[210px] h-[215px] sm:h-[225px] bg-surface rounded-2xl border border-line/80 shadow-xs hover:shadow-warm hover:border-accent/60 transition-all duration-200 flex flex-row items-stretch p-2.5 sm:p-3 gap-2.5 sm:gap-3 overflow-hidden group',
                !isAvailable && 'opacity-65'
              )}
            >
              {/* Right Side (in RTL): Untouched Full Height Poster / Image */}
              <div className="relative w-[105px] sm:w-[125px] shrink-0 h-full bg-canvas/70 overflow-hidden rounded-xl border border-line/60">
                {item.imageUrl ? (
                  <>
                    {/* Blurred ambient backdrop */}
                    <img
                      src={item.imageUrl}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover blur-sm scale-110 opacity-35 pointer-events-none"
                    />
                    {/* Main crisp picture */}
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="relative z-10 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-500/10 via-surface to-accent/5 p-3">
                    <div className="w-12 h-12 rounded-2xl bg-surface border border-line shadow-xs flex items-center justify-center text-accent">
                      {item.isCombo ? (
                        <Package className="w-7 h-7 stroke-[1.8] text-accent" />
                      ) : (
                        <BrandFoodIcon item={item} />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Left Side (in RTL): Roomy Details Column */}
              <div className="flex-1 py-0.5 flex flex-col justify-between min-w-0 text-right h-full">
                <div className="space-y-1.5 min-w-0">
                  {/* Badges / Meta row (Combo & Discount badges - single clean line) */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {item.isCombo && (
                      <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-800 border border-amber-500/30 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap">
                        <Package className="w-2.5 h-2.5 text-amber-600 stroke-[2.2]" />
                        كومبو
                      </span>
                    )}
                    {hasOffer && (
                      <span className="inline-flex items-center gap-1 bg-danger/10 text-danger border border-danger/25 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md font-mono-nums whitespace-nowrap">
                        <Tag className="w-2.5 h-2.5 stroke-[2.2]" />
                        وفر {discountAmount} ج.م
                      </span>
                    )}
                  </div>

                  {/* Title (up to 2 lines, never cut off into "...") */}
                  <h4 className="font-display font-black text-sm sm:text-base text-ink line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {item.name}
                  </h4>

                  {/* Prep Time */}
                  <div className="flex items-center gap-1 text-ink-soft font-body text-[10.5px]">
                    <Clock className="w-3 h-3 text-accent stroke-[2.2] shrink-0" />
                    <span>تحضير: {prepTime} دقيقة</span>
                  </div>

                  {/* Combo Ingredients (fits content tightly, no empty space on the left!) */}
                  {item.isCombo && item.comboItems && item.comboItems.length > 0 ? (
                    <div className="w-fit max-w-full bg-canvas/80 border border-line/60 rounded-lg px-2 py-0.5 text-right">
                      <p className="text-[10px] sm:text-[10.5px] font-body text-ink font-medium leading-snug line-clamp-2">
                        <span className="font-bold text-accent ml-1">يشمل:</span>
                        <span>{item.comboItems.map((ci) => `${ci.quantity}× ${ci.name}`).join(' + ')}</span>
                      </p>
                    </div>
                  ) : (
                    (item.offerTag || item.description) && (
                      <p className="text-[10.5px] font-body text-ink-soft line-clamp-2 leading-relaxed">
                        {item.offerTag || item.description}
                      </p>
                    )
                  )}
                </div>

                {/* Bottom Row: Price & Action Button (100% Clean, NO OVERLAPPING, ROOMY) */}
                <div className="pt-2 border-t border-line/60 flex items-center justify-between gap-1.5 mt-auto">
                  {/* Clean Stacked Price: Current price on top, crossed-out old price below */}
                  <div className="flex flex-col justify-center leading-none min-w-0">
                    <div className="flex items-baseline gap-0.5 whitespace-nowrap">
                      <span className="font-mono text-base sm:text-lg font-black text-ink font-mono-nums tracking-tight">
                        {item.price}
                      </span>
                      <span className="text-[10.5px] font-bold text-ink-soft">
                        ج.م
                      </span>
                    </div>
                    {hasOffer && (
                      <span className="font-mono text-[10px] text-ink-soft/70 line-through font-mono-nums mt-0.5 whitespace-nowrap">
                        {item.originalPrice} ج.م
                      </span>
                    )}
                  </div>

                  {/* Action Button: Stepper if in cart, or '+ أضف' button */}
                  <div className="shrink-0">
                    {isAvailable ? (
                      qty > 0 ? (
                        <div
                          className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 rounded-xl p-1 shadow-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, qty - 1)}
                            className="w-6 h-6 rounded-lg bg-surface border border-line text-ink flex items-center justify-center hover:bg-danger-soft hover:text-danger transition-colors"
                            aria-label="إنقاص"
                          >
                            <Minus className="w-3 h-3 stroke-[2.5]" />
                          </button>
                          <span className="font-mono text-xs font-black text-ink min-w-[16px] text-center font-mono-nums">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, qty + 1)}
                            className="w-6 h-6 rounded-lg bg-primary text-primary-ink flex items-center justify-center hover:bg-primary-ink hover:text-primary transition-colors shadow-xs"
                            aria-label="زيادة"
                          >
                            <Plus className="w-3 h-3 stroke-[2.5]" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAdd(item);
                          }}
                          className="inline-flex items-center justify-center gap-1 bg-primary hover:bg-primary-ink text-primary-ink hover:text-primary font-body font-bold text-xs px-2.5 py-1.5 rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>أضف</span>
                        </button>
                      )
                    ) : (
                      <span className="text-[11px] font-body text-danger font-bold">غير متاح</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Indicator Dots */}
      {offers.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {offers.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToOffer(idx)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                activeIndex === idx
                  ? 'w-6 bg-accent'
                  : 'w-1.5 bg-line hover:bg-accent/40'
              )}
              aria-label={`الانتقال للعرض ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

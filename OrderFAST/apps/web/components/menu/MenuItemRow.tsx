'use client';

import React from 'react';
import { MenuItem } from '@/types';
import { formatEGP } from '@/lib/formatters';
import { Plus, Minus, Trash2, Clock, Tag, Flame, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MenuItemRowProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  cartQuantity?: number;
  disabled?: boolean;
}

/**
 * Custom vector icon matching FastOrder's speed & cloche brand identity
 */
const BrandFoodIcon: React.FC<{ item: MenuItem }> = ({ item }) => {
  const name = (item.name || '').toLowerCase();
  const cat = (item.categoryId || '').toLowerCase();

  // Cold drinks / cans / juice
  if (
    cat.includes('cold') ||
    cat.includes('drink') ||
    name.includes('كانز') ||
    name.includes('عصير') ||
    name.includes('بيبسي') ||
    name.includes('كولا') ||
    name.includes('مياه') ||
    name.includes('ثلج')
  ) {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="transition-transform group-hover:scale-105">
        <path
          d="M10 10 L11.5 24 C11.7 25.5 12.5 26.5 14 26.5 L18 26.5 C19.5 26.5 20.3 25.5 20.5 24 L22 10 Z"
          fill="#E8992A"
          fillOpacity="0.18"
          stroke="#E8992A"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <rect x="8.5" y="8" width="15" height="3" rx="1.5" fill="#241F1A" />
        <path d="M16 4.5 L17.5 8" stroke="#E8992A" strokeWidth="2" strokeLinecap="round" />
        <path d="M11.5 16 C13 15 15 17 17 16 C19 15 20 16.5 20.5 16" stroke="#E8992A" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  // Hot drinks / coffee / tea
  if (
    cat.includes('hot') ||
    name.includes('شاي') ||
    name.includes('قهوة') ||
    name.includes('نسكافيه')
  ) {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="transition-transform group-hover:scale-105">
        <path
          d="M8.5 12 L9.5 21.5 C9.7 23.5 11.2 25 13.5 25 L16.5 25 C18.8 25 20.3 23.5 20.5 21.5 L21.5 12 Z"
          fill="#E8992A"
          fillOpacity="0.18"
          stroke="#E8992A"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M21.5 14 C23.5 14 24.5 15.5 24 17.5 C23.5 19 22.5 19.5 21.5 19.5" stroke="#241F1A" strokeWidth="2" strokeLinecap="round" />
        <line x1="7" y1="27" x2="23" y2="27" stroke="#241F1A" strokeWidth="2" strokeLinecap="round" />
        <path d="M13 8 C13 6.8 13.8 6.2 13.8 5.2" stroke="#E8992A" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M17 7.5 C17 6.3 17.8 5.7 17.8 4.7" stroke="#E8992A" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  // Default Food / Sandwiches / Meals (FastOrder Cloche plate)
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" className="transition-transform group-hover:scale-105">
      {/* Food Cloche Dome */}
      <path
        d="M7 21 C7 11.5 27 11.5 27 21 Z"
        fill="#E8992A"
        fillOpacity="0.18"
        stroke="#E8992A"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Dome Top Handle */}
      <circle cx="17" cy="9" r="2.2" fill="#E8992A" />
      {/* Plate Base */}
      <rect x="5" y="21" width="24" height="3" rx="1.5" fill="#241F1A" />
      {/* Speed & Freshness Steam */}
      <path d="M12.5 5.5 C12.5 4.5 13.5 3.8 13.5 3" stroke="#E8992A" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 4.5 C17 3.5 18 2.8 18 2" stroke="#E8992A" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M21.5 5.5 C21.5 4.5 22.5 3.8 22.5 3" stroke="#E8992A" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

export const MenuItemRow: React.FC<MenuItemRowProps> = React.memo(({
  item,
  onAdd,
  onUpdateQuantity,
  cartQuantity = 0,
  disabled = false,
}) => {
  const isAvailable = item.isAvailable && !disabled;
  const prepTime = item.preparationTimeMins || 5;
  const hasOffer = !!(item.originalPrice && item.originalPrice > item.price);
  const discountAmount = hasOffer ? (item.originalPrice! - item.price) : 0;
  const discountPercent = hasOffer ? Math.round((discountAmount / item.originalPrice!) * 100) : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAvailable) {
      onAdd(item);
    }
  };

  const handleMinus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdateQuantity) {
      onUpdateQuantity(item.id, cartQuantity - 1);
    }
  };

  const handlePlus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdateQuantity) {
      onUpdateQuantity(item.id, cartQuantity + 1);
    }
  };

  return (
    <div
      className={cn(
        'group flex items-center justify-between py-3.5 px-2 sm:px-3 border-b border-line/70 last:border-0 transition-colors hover:bg-canvas/40',
        !isAvailable && 'opacity-60'
      )}
    >
      {/* Right side: Icon/Thumbnail + Title & Price (NO description) */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1 ml-3">
        {/* Brand Icon Box */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-surface border border-line shadow-xs flex items-center justify-center flex-shrink-0">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover rounded-2xl"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <BrandFoodIcon item={item} />
          )}
        </div>

        {/* Content: Title & Price + Prep time (NO description!) */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-display font-bold text-base sm:text-lg text-ink truncate group-hover:text-primary-ink transition-colors">
              {item.name}
            </h4>

            {item.isCombo && (
              <span className="text-[10px] font-body font-medium text-ink-soft bg-canvas px-2 py-0.5 rounded-md border border-line/60 whitespace-nowrap">
                باقة كومبو
              </span>
            )}

            {hasOffer && (
              <span className="text-[10px] font-body font-semibold text-danger/90 bg-danger-soft/60 px-2 py-0.5 rounded-md border border-danger/20 whitespace-nowrap">
                {item.offerTag || `وفر ${discountAmount} ج.م`}
              </span>
            )}

            {item.isUnderReview && (
              <span className="bg-primary-soft text-primary-ink text-[10px] font-body font-bold px-2 py-0.5 rounded-md whitespace-nowrap">
                قيد المراجعة
              </span>
            )}
          </div>

          {/* Combo Deal Items Breakdown - Big, Clear & Prominent */}
          {item.isCombo && item.comboItems && item.comboItems.length > 0 && (
            <div className="bg-canvas/80 border border-line/70 rounded-xl px-2.5 py-1.5 mt-2 mb-2 text-right">
              <p className="font-body text-xs sm:text-sm font-bold text-ink leading-snug">
                <span className="text-ink-soft text-xs font-semibold ml-1">يشمل:</span>
                <span className="text-ink font-black">
                  {item.comboItems.map((c) => `${c.quantity}× ${c.name}`).join(' + ')}
                </span>
              </p>
            </div>
          )}

          <div className="flex items-center gap-2.5 mt-1 flex-wrap">
            {isAvailable ? (
              hasOffer ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base sm:text-lg font-black text-danger font-mono-nums">
                    {formatEGP(item.price)}
                  </span>
                  <span className="font-mono text-xs sm:text-sm text-ink-soft line-through font-medium font-mono-nums">
                    {formatEGP(item.originalPrice!)}
                  </span>
                </div>
              ) : (
                <span className="font-mono text-base font-bold text-ink font-mono-nums">
                  {formatEGP(item.price)}
                </span>
              )
            ) : (
              <span className="font-body text-xs text-danger font-bold">
                غير متاح حالياً
              </span>
            )}

            <span className="flex items-center gap-1 font-mono text-xs text-ink-soft bg-canvas px-2 py-0.5 rounded-md border border-line/60">
              <Clock className="w-3 h-3 text-ink-soft" />
              <span>{prepTime} د</span>
            </span>
          </div>
        </div>
      </div>

      {/* Left side: Stepper or Add Button */}
      <div className="flex-shrink-0">
        {!isAvailable ? (
          <span className="text-xs font-body font-bold text-ink-soft bg-canvas px-3 py-1.5 rounded-xl border border-line/70">
            نفد
          </span>
        ) : cartQuantity > 0 ? (
          <div className="flex items-center gap-1 bg-primary text-primary-ink px-1.5 py-1 rounded-2xl shadow-sm">
            <button
              type="button"
              onClick={handleMinus}
              className="w-8 h-8 rounded-xl bg-surface/90 hover:bg-surface text-ink-soft hover:text-ink flex items-center justify-center transition-all active:scale-90"
              aria-label={`تقليل كمية ${item.name}`}
            >
              {cartQuantity === 1 ? (
                <Trash2 className="w-4 h-4 text-danger" />
              ) : (
                <Minus className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>
            <span className="font-mono text-sm font-bold min-w-[24px] text-center font-mono-nums">
              {cartQuantity}
            </span>
            <button
              type="button"
              onClick={handlePlus}
              className="w-8 h-8 rounded-xl bg-surface/90 hover:bg-surface text-ink-soft hover:text-ink flex items-center justify-center transition-all active:scale-90"
              aria-label={`زيادة كمية ${item.name}`}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            className="h-9 px-4 rounded-2xl bg-primary hover:bg-primary-hover text-primary-ink flex items-center gap-1.5 font-body font-bold text-xs transition-all duration-200 active:scale-95 shadow-sm"
            aria-label={`إضافة ${item.name} للسلة`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>إضافة</span>
          </button>
        )}
      </div>
    </div>
  );
});

MenuItemRow.displayName = 'MenuItemRow';

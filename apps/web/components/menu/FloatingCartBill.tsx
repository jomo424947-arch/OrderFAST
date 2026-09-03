'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CartItem, Kiosk } from '@/types';
import { formatEGP } from '@/lib/formatters';
import {
  Receipt,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface FloatingCartBillProps {
  kiosk: Kiosk;
  cartItems: CartItem[];
  totalCartCount: number;
  totalCartAmount: number;
  updateQuantity: (itemId: string, quantity: number) => void;
  checkoutHref?: string;
}

export const FloatingCartBill: React.FC<FloatingCartBillProps> = ({
  kiosk,
  cartItems,
  totalCartCount,
  totalCartAmount,
  updateQuantity,
  checkoutHref = '/student/cart',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Strictly only visible when something is added to cart
  if (totalCartCount === 0) return null;

  return (
    <>
      {/* Dimmed backdrop when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsExpanded(false)}
          aria-hidden="true"
        />
      )}

      {/* Floating Container (lg:hidden) */}
      <div className="fixed bottom-20 left-3 right-3 max-w-lg mx-auto z-40 lg:hidden">
        {/* Expanded Bill Sheet */}
        {isExpanded ? (
          <div className="bg-surface border-2 border-line rounded-3xl shadow-floating overflow-hidden flex flex-col max-h-[75vh] animate-in slide-in-from-bottom-5 duration-250">
            {/* Header */}
            <div className="p-4 border-b border-line/70 bg-canvas/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary-ink flex items-center justify-center">
                  <Receipt className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-ink">
                    فاتورة الطلب الحالية
                  </h3>
                  <span className="font-body text-[11px] text-ink-soft">
                    {kiosk.name} · {totalCartCount} أصناف
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="w-8 h-8 rounded-full bg-surface border border-line/70 flex items-center justify-center text-ink-soft hover:text-ink transition-colors"
                aria-label="تصغير الفاتورة"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Items Breakdown */}
            <div className="p-4 divide-y divide-line/60 overflow-y-auto space-y-2">
              {cartItems.map((ci) => (
                <div
                  key={ci.menuItem.id}
                  className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-body font-bold text-xs text-ink truncate">
                      {ci.menuItem.name}
                    </p>
                    <p className="font-mono text-xs text-primary-ink font-semibold mt-0.5">
                      {formatEGP(ci.menuItem.price)}
                    </p>
                  </div>

                  {/* Stepper */}
                  <div className="flex items-center gap-1.5 bg-canvas px-2 py-1 rounded-xl border border-line/80">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(ci.menuItem.id, ci.quantity - 1)
                      }
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-ink-soft hover:text-ink transition-colors"
                      aria-label="تقليل"
                    >
                      {ci.quantity === 1 ? (
                        <Trash2 className="w-3.5 h-3.5 text-danger" />
                      ) : (
                        <Minus className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span className="font-mono text-xs font-bold min-w-[18px] text-center font-mono-nums">
                      {ci.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(ci.menuItem.id, ci.quantity + 1)
                      }
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-ink-soft hover:text-ink transition-colors"
                      aria-label="زيادة"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="font-mono text-xs font-bold text-ink min-w-[55px] text-left font-mono-nums">
                    {formatEGP(ci.menuItem.price * ci.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations & Checkout */}
            <div className="p-4 border-t border-line/70 bg-canvas/30 space-y-3">
              <div className="flex items-center justify-between text-xs font-body text-ink-soft font-medium">
                <span>إجمالي الأصناف ({totalCartCount})</span>
                <span className="font-mono font-bold text-ink font-mono-nums">
                  {formatEGP(totalCartAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-body text-ink-soft font-medium">
                <span>رسوم الخدمة</span>
                <span className="font-mono font-bold text-ink font-mono-nums">
                  {formatEGP(1)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-bold font-body text-ink pt-1.5 border-t border-line/60">
                <span>المطلوب عند الاستلام</span>
                <span className="font-mono text-base text-primary-ink font-mono-nums font-black">
                  {formatEGP(totalCartAmount + 1)}
                </span>
              </div>

              <Link href={checkoutHref} className="block pt-1">
                <Button variant="primary" size="lg" className="w-full shadow-warm">
                  <span>إتمام وتأكيد الطلب</span>
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Collapsed Floating Bill Bar */
          <div className="bg-surface border-2 border-line/90 rounded-2xl p-2.5 sm:p-3 shadow-floating flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Clickable Info Area: Opens expanded bill */}
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-2.5 min-w-0 flex-1 text-right group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary-ink flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Receipt className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-body font-bold text-xs text-ink truncate">
                    فاتورة الطلب ({totalCartCount})
                  </span>
                  <span className="text-[10px] font-body text-primary-ink font-semibold flex items-center gap-0.5 bg-primary-soft/80 px-1.5 py-0.2 rounded-md">
                    <span>عرض التفاصيل</span>
                    <ChevronUp className="w-3 h-3" />
                  </span>
                </div>
                <span className="font-mono text-sm font-bold text-primary-ink block mt-0.5 font-mono-nums">
                  {formatEGP(totalCartAmount + 1)}
                </span>
              </div>
            </button>

            {/* Direct Checkout Button */}
            <Link href={checkoutHref} className="flex-shrink-0">
              <button
                type="button"
                className="h-10 px-4 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink font-body font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 whitespace-nowrap"
              >
                <span>تأكيد الطلب</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

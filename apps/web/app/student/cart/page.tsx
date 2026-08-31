'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/useCartStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatEGP } from '@/lib/formatters';
import { ChevronRight, Plus, Minus, Trash2, ShoppingBag, Store, ShieldAlert } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { student, studentStatus } = useAuthStore();
  const { items, kiosk, updateQuantity, removeItem, clearCart, getSubtotal } = useCartStore();
  const { placeOrder } = useOrderStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = getSubtotal();

  const handleConfirmOrder = () => {
    if (items.length === 0 || !kiosk) return;
    if (studentStatus === 'restricted') {
      alert('حسابك مقيد مؤقتاً لعدم استلام أوردر سابق. يرجى مراجعة إدارة الكشك.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const order = placeOrder({
        studentId: student?.id || 'std-001',
        studentName: student?.name || 'طالب',
        studentCollege: student?.college || 'كلية الحاسبات والمعلومات',
        kiosk,
        items,
      });
      clearCart();
      setIsSubmitting(false);
      router.push(`/student/orders/${order.id}`);
    }, 450);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-8">
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8" />}
          title="سلتك فاضية دلوقتي"
          description="تصفح أكشاك الجامعة واختر المشروبات والسندوتشات اللي تحبها."
          actionLabel="تصفح الأكشاك"
          onAction={() => router.push('/student/kiosks')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-5">
      {/* Screen Header matching visual reference */}
      <div className="flex items-center gap-3 pb-2 border-b border-line/60">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full bg-surface border border-line flex items-center justify-center text-ink hover:bg-canvas transition-colors"
          aria-label="الرجوع"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div>
          <h3 className="font-display font-bold text-lg text-ink">
            السلة
          </h3>
          <p className="font-body text-xs text-ink-soft">
            {kiosk?.name || 'كشك الحرية'}
          </p>
        </div>
      </div>

      {/* Account restriction warning if restricted */}
      {studentStatus === 'restricted' && (
        <div className="bg-danger-soft border border-danger/30 rounded-2xl p-3 text-xs font-body text-danger flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>تنبيه: حسابك مقيد مؤقتاً بسبب عدم الحضور لاستلام أوردر سابق.</span>
        </div>
      )}

      {/* Cart Items List */}
      <div className="bg-surface border border-line/80 rounded-3xl p-5 shadow-warm divide-y divide-line/70">
        {items.map((cartItem) => {
          const itemTotal = cartItem.menuItem.price * cartItem.quantity;

          return (
            <div
              key={cartItem.menuItem.id}
              className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
            >
              <div>
                <p className="font-body font-semibold text-sm text-ink mb-2">
                  {cartItem.menuItem.name}
                </p>

                {/* Mini Stepper matching design reference */}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(cartItem.menuItem.id, cartItem.quantity - 1)
                    }
                    className="w-6 h-6 rounded-full border border-line bg-canvas hover:bg-line/40 flex items-center justify-center text-ink-soft hover:text-ink transition-colors active:scale-95"
                    aria-label="تقليل الكمية"
                  >
                    {cartItem.quantity === 1 ? (
                      <Trash2 className="w-3 h-3 text-danger" />
                    ) : (
                      <Minus className="w-3 h-3" />
                    )}
                  </button>

                  <span className="font-mono text-sm font-bold min-w-[16px] text-center font-mono-nums">
                    {cartItem.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(cartItem.menuItem.id, cartItem.quantity + 1)
                    }
                    className="w-6 h-6 rounded-full border border-line bg-canvas hover:bg-line/40 flex items-center justify-center text-ink-soft hover:text-ink transition-colors active:scale-95"
                    aria-label="زيادة الكمية"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Item Total Price */}
              <span className="font-mono text-sm font-bold text-ink font-mono-nums">
                {formatEGP(itemTotal)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Summary Box */}
      <div className="bg-surface border border-line/80 rounded-3xl p-5 shadow-warm space-y-2.5">
        <div className="flex justify-between text-xs font-body text-ink-soft">
          <span>إجمالي الأصناف</span>
          <span className="font-mono font-semibold font-mono-nums">{formatEGP(subtotal)}</span>
        </div>

        <div className="flex justify-between font-body text-sm font-bold text-ink pt-2 border-t border-line/60">
          <span>المطلوب عند الاستلام</span>
          <span className="font-mono text-base text-primary-ink font-mono-nums font-black">{formatEGP(subtotal)}</span>
        </div>

        {/* Clear instruction about campus on-pickup payment */}
        <p className="text-[11px] font-body text-ink-soft text-center pt-2 leading-relaxed">
          تدفع كاش أو محفظة إلكترونية وقت ما تستلم الأوردر من الكشك مباشرة
        </p>
      </div>

      {/* Confirm Order Button */}
      <Button
        variant="primary"
        size="lg"
        isLoading={isSubmitting}
        disabled={studentStatus === 'restricted'}
        onClick={handleConfirmOrder}
        className="w-full shadow-warm"
      >
        تأكيد الأوردر
      </Button>
    </div>
  );
}

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
import { ChevronRight, Plus, Minus, Trash2, ShoppingBag, Store, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { student, studentStatus } = useAuthStore();
  const { items, kiosk, updateQuantity, removeItem, clearCart, getSubtotal } = useCartStore();
  const { placeOrder } = useOrderStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = getSubtotal();

  const handleConfirmOrder = async () => {
    if (items.length === 0 || !kiosk) return;
    if (!student) {
      setError('يرجى تسجيل الدخول بحساب طالب أولاً لتأكيد طلبك');
      router.push('/auth/login');
      return;
    }
    if (studentStatus === 'restricted') {
      alert('حسابك مقيد مؤقتاً لعدم استلام أوردر سابق. يرجى مراجعة إدارة الكشك.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const order = await placeOrder({
        studentId: student?.id || '',
        studentName: student?.name || 'طالب',
        studentCollege: student?.college || 'كلية الحاسبات والمعلومات',
        kiosk,
        items,
        paymentMethod: 'cash',
      });
      clearCart();
      setIsSubmitting(false);
      router.push(`/student/orders/${order.id}`);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'حدث خطأ أثناء إرسال الطلب');
    }
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

      {/* Account warning if on 1st No-Show warning */}
      {studentStatus === 'warning' && (
        <div className="bg-primary-soft border border-primary/40 rounded-2xl p-3 text-xs font-body text-primary-ink flex items-start gap-2 shadow-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            <strong>تنبيه:</strong> لديك تحذير مسبق بسبب عدم استلام طلب سابق. نرجو الالتزام باستلام هذا الطلب حيث سيتم تقييد الحساب ومنع الطلب فوراً في حال عدم الحضور.
          </span>
        </div>
      )}

      {/* Account restriction warning if restricted */}
      {studentStatus === 'restricted' && (
        <div className="bg-danger-soft border border-danger/30 rounded-2xl p-3 text-xs font-body text-danger flex items-start gap-2 shadow-sm">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            <strong>حساب مقيد:</strong> تم إيقاف إمكانية إرسال طلبات جديدة نظراً لتكرار عدم الحضور لاستلام الطلبات السابقة. يرجى التواصل مع إدارة النظام لفك الحظر.
          </span>
        </div>
      )}

      {/* Cart Items List */}
      <div className="bg-surface border border-line/80 rounded-3xl p-5 shadow-warm divide-y divide-line/70">
        {items.map((cartItem) => {
          const itemTotal = cartItem.menuItem.price * cartItem.quantity;
          const isCombo = cartItem.menuItem.isCombo;
          const hasComboItems = isCombo && cartItem.menuItem.comboItems && cartItem.menuItem.comboItems.length > 0;
          const hasOffer = Boolean(cartItem.menuItem.offerTag || (cartItem.menuItem.originalPrice && cartItem.menuItem.originalPrice > cartItem.menuItem.price));

          return (
            <div
              key={cartItem.menuItem.id}
              className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                {/* Title & Subtle Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-body font-bold text-sm text-ink">
                    {cartItem.menuItem.name}
                  </p>

                  {isCombo && (
                    <span className="text-[10px] font-body font-medium text-ink-soft bg-canvas px-2 py-0.5 rounded-md border border-line/60">
                      باقة كومبو
                    </span>
                  )}

                  {cartItem.menuItem.offerTag && (
                    <span className="text-[10px] font-body font-semibold text-danger/90 bg-danger-soft/60 px-2 py-0.5 rounded-md border border-danger/20">
                      {cartItem.menuItem.offerTag}
                    </span>
                  )}
                </div>

                {/* Offer & Combo Items Contents Breakdown - Big, Clear & Prominent */}
                {hasComboItems && (
                  <div className="bg-canvas/80 border border-line/70 rounded-xl px-2.5 py-1.5 mt-2 mb-2 text-right">
                    <p className="font-body text-xs sm:text-sm font-bold text-ink leading-snug">
                      <span className="text-ink-soft text-xs font-semibold ml-1">يشمل:</span>
                      <span className="text-ink font-black">
                        {cartItem.menuItem.comboItems!.map((c) => `${c.quantity}× ${c.name}`).join(' + ')}
                      </span>
                    </p>
                  </div>
                )}

                {/* Description if regular item */}
                {cartItem.menuItem.description && !isCombo && (
                  <p className="font-body text-[11px] text-ink-soft/80 mt-0.5 mb-2 leading-relaxed">
                    {cartItem.menuItem.description}
                  </p>
                )}

                {/* Mini Stepper */}
                <div className="flex items-center gap-2.5 mt-2">
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
              <div className="text-left flex-shrink-0 pt-0.5">
                <span className="font-mono text-sm font-bold text-ink font-mono-nums block">
                  {formatEGP(itemTotal)}
                </span>
                {cartItem.menuItem.originalPrice && cartItem.menuItem.originalPrice > cartItem.menuItem.price && (
                  <span className="font-mono text-[11px] text-ink-soft/60 line-through font-mono-nums block">
                    {formatEGP(cartItem.menuItem.originalPrice * cartItem.quantity)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Box */}
      <div className="bg-surface border border-line/80 rounded-3xl p-5 shadow-warm space-y-2.5">
        <div className="flex justify-between text-xs font-body text-ink-soft font-medium">
          <span>إجمالي الأصناف</span>
          <span className="font-mono font-semibold font-mono-nums">{formatEGP(subtotal)}</span>
        </div>

        <div className="flex justify-between text-xs font-body text-ink-soft font-medium">
          <span>رسوم الخدمة</span>
          <span className="font-mono font-semibold font-mono-nums">{formatEGP(1)}</span>
        </div>

        <div className="flex justify-between font-body text-sm font-bold text-ink pt-2.5 border-t border-line/60">
          <span>المطلوب عند الاستلام</span>
          <span className="font-mono text-base text-primary-ink font-mono-nums font-black">{formatEGP(subtotal + 1)}</span>
        </div>

        {/* Clear instruction about campus on-pickup payment */}
        <p className="text-[11px] font-body text-ink-soft text-center pt-2 leading-relaxed">
          تدفع كاش أو محفظة إلكترونية وقت ما تستلم الأوردر من الكشك مباشرة
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-danger-soft border border-danger/30 text-danger rounded-xl p-3 text-xs font-body font-bold animate-in fade-in duration-200 flex flex-col gap-2">
          <span>{error}</span>
          {error.includes('طالب') && (
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center bg-danger text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-danger/90 transition-colors w-fit"
            >
              تسجيل الدخول بحساب طالب الآن
            </Link>
          )}
        </div>
      )}

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

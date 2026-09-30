'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useOrderStore } from '@/stores/useOrderStore';
import { useKioskStore } from '@/stores/useKioskStore';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { formatEGP } from '@/lib/formatters';
import {
  CheckCheck,
  CheckCircle2,
  ChefHat,
  PackageCheck,
  AlertTriangle,
  Eye,
  ExternalLink,
  Smartphone,
  Banknote,
  Phone,
  Copy,
  Check,
  MessageCircle,
} from 'lucide-react';
import { Order } from '@/types';

export default function CashierActiveOrdersPage() {
  const { activeKioskId } = useKioskStore();
  const { getKioskActiveOrders, fetchKioskOrders, setOrderStatus, confirmPayment } = useOrderStore();

  useEffect(() => {
    if (activeKioskId) {
      fetchKioskOrders(activeKioskId);
    }
  }, [activeKioskId, fetchKioskOrders]);

  const activeOrders = getKioskActiveOrders(activeKioskId);

  const [activeFilter, setActiveFilter] = useState<'all' | 'preparing' | 'ready'>('all');
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  const [previewReceiptOrder, setPreviewReceiptOrder] = useState<Order | null>(null);
  const [verifyDeliveryOrder, setVerifyDeliveryOrder] = useState<Order | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [copiedPhoneOrder, setCopiedPhoneOrder] = useState<string | null>(null);

  const handleCopyPhone = (orderId: string, phoneNum: string) => {
    navigator.clipboard.writeText(phoneNum);
    setCopiedPhoneOrder(orderId);
    setTimeout(() => setCopiedPhoneOrder(null), 2000);
  };

  const filteredOrders = activeOrders.filter((o) => {
    if (activeFilter === 'preparing') return o.status === 'ACCEPTED' || o.status === 'PREPARING';
    if (activeFilter === 'ready') return o.status === 'READY';
    return true;
  });

  const handleConfirmPayment = async (orderId: string) => {
    try {
      setConfirmingOrderId(orderId);
      await confirmPayment(orderId);
      setActionSuccessMessage('تم تأكيد استلام الدفع الإلكتروني بنجاح!');
      setTimeout(() => setActionSuccessMessage(null), 3500);
    } catch (err: any) {
      alert(err.message || 'فشل تأكيد الدفع');
    } finally {
      setConfirmingOrderId(null);
    }
  };

  const handleCompleteOrder = async (order: Order) => {
    if (order.paymentMethod === 'digital_wallet' && order.paymentStatus === 'pending_verification') {
      setVerifyDeliveryOrder(order);
      return;
    }
    await setOrderStatus(order.id, 'COMPLETED');
    setActionSuccessMessage(`تم بنجاح تسليم الطلب ${order.orderNumber}!`);
    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Toast Feedback */}
      {actionSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-body font-bold flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-line/60">
        <div>
          <h2 className="font-display font-bold text-2xl text-ink">
            الأوردرات النشطة
          </h2>
          <p className="font-body text-xs text-ink-soft">
            إدارة وتحديث مراحل التحضير وتأكيد الدفع وتسليم الطلبات
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-body font-bold border transition-all ${
              activeFilter === 'all'
                ? 'bg-primary text-primary-ink border-primary'
                : 'bg-surface text-ink-soft border-line hover:bg-canvas'
            }`}
          >
            الكل ({activeOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('preparing')}
            className={`px-3 py-1.5 rounded-xl text-xs font-body font-bold border transition-all ${
              activeFilter === 'preparing'
                ? 'bg-primary text-primary-ink border-primary'
                : 'bg-surface text-ink-soft border-line hover:bg-canvas'
            }`}
          >
            جاري التجهيز ({activeOrders.filter((o) => o.status === 'ACCEPTED' || o.status === 'PREPARING').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('ready')}
            className={`px-3 py-1.5 rounded-xl text-xs font-body font-bold border transition-all ${
              activeFilter === 'ready'
                ? 'bg-accent text-white border-accent'
                : 'bg-surface text-ink-soft border-line hover:bg-canvas'
            }`}
          >
            جاهز للاستلام ({activeOrders.filter((o) => o.status === 'READY').length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            const isOnline = order.paymentMethod === 'digital_wallet';
            const isPaid = order.paymentStatus === 'paid';
            const isPendingVerification = isOnline && order.paymentStatus === 'pending_verification';

            return (
              <div
                key={order.id}
                className="bg-surface rounded-2xl p-5 border border-line/80 shadow-warm space-y-3.5 flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-black text-ink font-mono-nums">
                        {order.orderNumber}
                      </span>
                      <span className="font-body text-xs text-ink-soft">
                        ({order.studentName} - {order.studentCollege})
                      </span>
                      {order.studentPhone && (
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-lg text-emerald-800 dark:text-emerald-300">
                          <Phone className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                          <span className="font-mono text-xs font-bold font-mono-nums dir-ltr text-emerald-700 dark:text-emerald-300" dir="ltr">
                            {order.studentPhone}
                          </span>
                          {order.studentPhoneVerified && (
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/20 px-1 py-0.2 rounded">
                              مؤكّد
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyPhone(order.id, order.studentPhone!);
                            }}
                            className="p-0.5 hover:bg-emerald-500/20 rounded text-emerald-700 dark:text-emerald-300 transition-colors"
                            title="نسخ رقم الطالب"
                          >
                            {copiedPhoneOrder === order.id ? (
                              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                                <Check className="w-3 h-3" />
                                <span>تم النسخ</span>
                              </span>
                            ) : (
                              <Copy className="w-3 h-3 text-emerald-600 hover:scale-110 transition-transform" />
                            )}
                          </button>
                          <a
                            href={`https://wa.me/2${order.studentPhone.replace(/\D/g, '').replace(/^2/, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-0.5 hover:bg-emerald-500/20 rounded text-emerald-700 dark:text-emerald-300 transition-colors"
                            title="مراسلة عبر واتساب"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-600 hover:scale-110 transition-transform" />
                          </a>
                        </div>
                      )}
                      {isOnline ? (
                        isPaid ? (
                          <span className="text-[10px] font-body font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                            <Smartphone className="w-3 h-3" />
                            <span>مدفوع أونلاين</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-body font-bold text-amber-700 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 animate-pulse">
                            <Smartphone className="w-3 h-3" />
                            <span>بانتظار تأكيد الدفع</span>
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] font-body font-bold text-primary-ink bg-primary-soft px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-primary/20">
                          <Banknote className="w-3 h-3" />
                          <span>كاش</span>
                        </span>
                      )}
                    </div>
                    <StatusPill status={order.status} />
                  </div>

                  {/* Student Order Notes */}
                  {order.orderNotes && (
                    <div className="bg-primary-soft/40 border border-primary/30 rounded-xl p-2.5 text-xs font-body text-primary-ink flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-[11px] block">ملاحظة الطالب:</span>
                        <p className="text-ink font-semibold mt-0.5">{order.orderNotes}</p>
                      </div>
                    </div>
                  )}

                  {/* Online Payment Verification Box (if online) */}
                  {isOnline && (
                    <div className={`rounded-xl p-3 text-xs font-body border space-y-2 ${
                      isPaid
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50/70 border-amber-200 text-amber-900'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1">
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`} />
                          <span>{isPaid ? 'تم التحقق من الدفع' : 'بيانات التحويل للمراجعة:'}</span>
                        </span>
                        <span className="font-mono font-black font-mono-nums">
                          {formatEGP(order.transferAmount || order.total)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-line/40 text-[11px]">
                        <div className="min-w-0">
                          <span className="text-ink-soft block">
                            {order.onlinePaymentType === 'instapay' ? 'حساب انستا باي:' : 'رقم المحفظة المحول منه:'}
                          </span>
                          <span className="font-mono font-bold text-ink font-mono-nums dir-ltr text-right block truncate">
                            {order.transferSenderPhone || 'غير مسجل'}
                          </span>
                        </div>

                        {order.transferImageUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewReceiptOrder(order)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline bg-surface px-2.5 py-1 rounded-lg border border-line shadow-2xs transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>معاينة الإيصال</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Items */}
                  <div className="bg-canvas/60 rounded-xl p-3 text-xs font-body text-ink space-y-1 border border-line/50">
                    {order.items.map((it) => (
                      <div key={it.id} className="flex justify-between">
                        <span>{it.name}</span>
                        <span className="font-mono font-bold">× {it.quantity}</span>
                      </div>
                    ))}
                    <div className="pt-2 mt-2 border-t border-line/60 flex justify-between font-bold text-ink">
                      <span>{isOnline ? 'حالة الحساب:' : 'المطلوب تحصيله عند الاستلام:'}</span>
                      <span className={
                        isOnline
                          ? (isPaid ? 'font-mono text-emerald-700' : 'font-mono text-amber-700')
                          : 'font-mono text-primary-ink'
                      }>
                        {isOnline
                          ? (isPaid ? 'مدفوع أونلاين' : `بانتظار التأكيد (${formatEGP(order.total)})`)
                          : formatEGP(order.total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Operations Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line/60">
                  {/* Confirm Payment Button (for pending online orders) */}
                  {isPendingVerification && (
                    <Button
                      variant="accent"
                      size="sm"
                      isLoading={confirmingOrderId === order.id}
                      onClick={() => handleConfirmPayment(order.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-bold"
                    >
                      <CheckCircle2 className="w-4 h-4 ml-1.5" />
                      <span>تأكيد الدفع</span>
                    </Button>
                  )}

                  {(order.status === 'ACCEPTED' || order.status === 'PREPARING') && (
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => setOrderStatus(order.id, 'READY')}
                      className="flex-1 shadow-sm"
                    >
                      <PackageCheck className="w-4 h-4 ml-1.5" />
                      <span>جاهز للاستلام</span>
                    </Button>
                  )}

                  {order.status === 'READY' && (
                    <Button
                      variant={isPendingVerification ? 'accent' : 'primary'}
                      size="sm"
                      onClick={() => handleCompleteOrder(order)}
                      className={`flex-1 shadow-sm font-bold ${
                        isPendingVerification
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : ''
                      }`}
                    >
                      <CheckCheck className="w-4 h-4 ml-1.5" />
                      <span>
                        {isPendingVerification
                          ? 'تحقق وسلّم الأوردر'
                          : (isOnline ? 'تم تسليم الطلب للطالب' : 'تم تسليم الطلب وتحصيل المبلغ')}
                      </span>
                    </Button>
                  )}

                  {/* No-show Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('هل أنت متأكد من تسجيل عدم حضور الطالب لهذا الطلب؟')) {
                        setOrderStatus(order.id, 'NO_SHOW');
                      }
                    }}
                    className="text-danger hover:bg-danger-soft px-3"
                    title="تسجيل عدم الحضور"
                  >
                    <AlertTriangle className="w-4 h-4 ml-1 text-danger" />
                    <span className="hidden sm:inline">لم يحضر</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<ChefHat className="w-8 h-8" />}
          title="لا توجد أوردرات نشطة حالياً"
          description="الأوردرات التي تقبلها من قائمة 'الواردة' ستنتقل إلى هنا لمتابعة التحضير والتسليم."
        />
      )}

      {/* Receipt Inspection Modal */}
      {previewReceiptOrder && previewReceiptOrder.transferImageUrl && (
        <Modal
          isOpen={Boolean(previewReceiptOrder)}
          onClose={() => setPreviewReceiptOrder(null)}
          title={`إيصال تحويل أوردر ${previewReceiptOrder.orderNumber}`}
          description={`المحول: ${previewReceiptOrder.transferSenderPhone || 'غير محدد'} · المبلغ: ${formatEGP(
            previewReceiptOrder.transferAmount || previewReceiptOrder.total
          )}`}
        >
          <div className="space-y-4 text-center">
            <div className="relative w-full max-h-[70vh] min-h-[300px] h-[450px] rounded-2xl overflow-hidden border border-line bg-canvas flex items-center justify-center">
              <Image
                src={previewReceiptOrder.transferImageUrl}
                alt="إيصال التحويل بالكامل"
                fill
                className="object-contain p-1"
                priority
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <a
                href={previewReceiptOrder.transferImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-body font-bold text-accent hover:underline inline-flex items-center gap-1"
              >
                <span>فتح الصورة في نافذة جديدة</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-2">
                {previewReceiptOrder.paymentStatus === 'pending_verification' && (
                  <Button
                    variant="accent"
                    size="sm"
                    isLoading={confirmingOrderId === previewReceiptOrder.id}
                    onClick={async () => {
                      await handleConfirmPayment(previewReceiptOrder.id);
                      setPreviewReceiptOrder(null);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    <CheckCircle2 className="w-4 h-4 ml-1.5" />
                    <span>تأكيد استلام هذا الدفع</span>
                  </Button>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewReceiptOrder(null)}
                  className="px-4 py-2 bg-line/60 hover:bg-line text-ink rounded-xl text-xs font-body font-bold transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Verify Online Payment Before Delivery In-App Modal */}
      {verifyDeliveryOrder && (
        <Modal
          isOpen={!!verifyDeliveryOrder}
          onClose={() => setVerifyDeliveryOrder(null)}
          title="تنبيه تأكيد استلام الدفع الإلكتروني"
          description={`طلب رقم ${verifyDeliveryOrder.orderNumber} مسجل كدفع إلكتروني`}
          maxWidth="md"
        >
          <div className="space-y-4 text-right">
            {/* Warning Alert Banner - OrderFAST Design System Harmonious Palette */}
            <div className="bg-primary-soft/80 border border-primary/40 rounded-2xl p-4 space-y-2 text-right">
              <div className="flex items-center gap-2 font-black text-sm text-primary-ink">
                <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0" />
                <span>طلب رقم {verifyDeliveryOrder.orderNumber} لم يتم تأكيد تحويله بعد</span>
              </div>
              <p className="text-xs leading-relaxed font-bold text-ink-soft">
                هذا الأوردر مدفوع إلكترونياً ({verifyDeliveryOrder.onlinePaymentType === 'instapay' ? 'انستا باي' : 'محفظة كاش'}). يرجى التأكد من وصول الإشعار والمبلغ على هاتفك قبل تسليم الوجبة للطالب.
              </p>
            </div>

            {/* Payment Details Card */}
            <div className="bg-canvas border border-line rounded-2xl p-4 space-y-2.5 text-xs font-body">
              <div className="flex justify-between items-center py-1.5 border-b border-line/60">
                <span className="text-ink-soft">المبلغ المطلوب:</span>
                <span className="font-mono text-base font-black text-ink font-mono-nums">
                  {formatEGP(verifyDeliveryOrder.total)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-line/60">
                <span className="text-ink-soft">وسيلة الدفع:</span>
                <span className="font-bold text-ink">
                  {verifyDeliveryOrder.onlinePaymentType === 'instapay' ? 'انستا باي (InstaPay)' : 'محفظة إلكترونية (كاش)'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-line/60">
                <span className="text-ink-soft">الرقم/الحساب المحول منه:</span>
                <span className="font-mono text-xs font-black text-ink font-mono-nums dir-ltr text-right">
                  {verifyDeliveryOrder.transferSenderPhone || 'غير مسجل'}
                </span>
              </div>

              {verifyDeliveryOrder.transferImageUrl && (
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-ink-soft">إثبات التحويل:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const o = verifyDeliveryOrder;
                      setVerifyDeliveryOrder(null);
                      setPreviewReceiptOrder(o);
                    }}
                    className="text-xs font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>معاينة وتكبير صورة الإيصال</span>
                  </button>
                </div>
              )}
            </div>

            <p className="text-xs font-bold text-ink text-center pt-1 leading-relaxed">
              هل تحققت من وصول المبلغ على هاتفك وتريد تأكيد الدفع وتسليم الأوردر للطالب الآن؟
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="accent"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                onClick={async () => {
                  const targetOrder = verifyDeliveryOrder;
                  setVerifyDeliveryOrder(null);
                  try {
                    await confirmPayment(targetOrder.id);
                  } catch (err) {
                    console.warn('Payment auto-confirm error:', err);
                  }
                  await setOrderStatus(targetOrder.id, 'COMPLETED');
                  setActionSuccessMessage(`تم بنجاح تأكيد دفع وتسليم الطلب ${targetOrder.orderNumber}`);
                  setTimeout(() => setActionSuccessMessage(null), 3000);
                }}
              >
                <CheckCircle2 className="w-4 h-4 ml-1" />
                <span>تأكيد الاستلام وتسليم الأوردر</span>
              </Button>

              <button
                type="button"
                onClick={() => setVerifyDeliveryOrder(null)}
                className="px-4 py-3 bg-line/60 hover:bg-line text-ink rounded-xl text-xs font-body font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Order } from '@/types';
import { useOrderStore } from '@/stores/useOrderStore';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  Receipt,
  Printer,
  X,
  User,
  GraduationCap,
  Phone,
  Copy,
  Check,
  MessageCircle,
  Store,
  Calendar,
  Clock,
  Banknote,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquareQuote,
  Eye,
  Maximize2,
  Percent,
  Coins,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { formatEGP, formatArabicDateTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export interface AdminOrderInvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AdminOrderInvoiceModal: React.FC<AdminOrderInvoiceModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const { fetchOrderById } = useOrderStore();
  const [mounted, setMounted] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedOrderNum, setCopiedOrderNum] = useState(false);
  const [isPreviewReceiptOpen, setIsPreviewReceiptOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [fullOrder, setFullOrder] = useState<Order | null>(order);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync and fetch full items if order is missing items
  useEffect(() => {
    setFullOrder(order);
    if (order && (!order.items || order.items.length === 0)) {
      setIsLoadingDetails(true);
      fetchOrderById(order.id, true)
        .then((fresh) => {
          if (fresh) setFullOrder(fresh);
        })
        .finally(() => setIsLoadingDetails(false));
    }
  }, [order, fetchOrderById]);

  // Handle ESC key and backdrop lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPreviewReceiptOpen) {
          setIsPreviewReceiptOpen(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isPreviewReceiptOpen, onClose]);

  if (!isOpen || !fullOrder) return null;

  const currentOrder = fullOrder;
  const cleanOrderNumber = currentOrder.orderNumber.replace(/^#+/, '');
  const isOnline = currentOrder.paymentMethod === 'digital_wallet';
  const isPaid = currentOrder.paymentStatus === 'paid';

  // Subtotal, fees, discount, total calculation
  const computedItemsSubtotal = currentOrder.items?.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  ) ?? 0;

  const subtotal = currentOrder.subtotal > 0 ? currentOrder.subtotal : computedItemsSubtotal;
  const discount = currentOrder.discount ?? 0;
  const fees =
    currentOrder.fees !== undefined
      ? currentOrder.fees
      : Math.max(0, currentOrder.total - subtotal + discount);
  const total = currentOrder.total;

  const handleCopyPhone = (phoneNum: string) => {
    navigator.clipboard.writeText(phoneNum);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleCopyOrderNum = () => {
    navigator.clipboard.writeText(`#${cleanOrderNumber}`);
    setCopiedOrderNum(true);
    setTimeout(() => setCopiedOrderNum(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0 print:m-0 print:static">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-[3px] transition-opacity print:hidden"
        onClick={onClose}
      />

      {/* Invoice Modal Dialog Container */}
      <div
        className={cn(
          'relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-surface border border-line rounded-3xl shadow-floating z-10 text-right animate-in fade-in zoom-in-95 duration-200 my-auto overflow-hidden print:border-none print:shadow-none print:max-h-none print:rounded-none print:w-full print:p-0'
        )}
      >
        {/* Modal Header Bar */}
        <div className="px-5 sm:px-6 py-4 border-b border-line/70 bg-canvas/60 flex items-center justify-between gap-3 shrink-0 print:bg-white print:border-b-2 print:border-black">
          {/* Right Header Title & Order Number */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-primary-soft text-primary-ink flex items-center justify-center shadow-xs border border-primary/20 shrink-0 print:border-black print:text-black">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-bold text-base sm:text-lg text-ink truncate">
                  فاتورة تفاصيل الأوردر
                </h3>
                <button
                  type="button"
                  onClick={handleCopyOrderNum}
                  className="inline-flex items-center gap-1 font-mono font-black text-sm bg-surface border border-line px-2 py-0.5 rounded-lg text-ink hover:bg-canvas transition-colors cursor-pointer shadow-2xs"
                  title="انقر لنسخ رقم الطلب"
                >
                  <span>#{cleanOrderNumber}</span>
                  {copiedOrderNum ? (
                    <Check className="w-3 h-3 text-accent" />
                  ) : (
                    <Copy className="w-3 h-3 text-ink-soft" />
                  )}
                </button>
              </div>
              <p className="font-body text-[11px] sm:text-xs text-ink-soft truncate mt-0.5 flex items-center gap-1.5">
                <Store className="w-3 h-3 text-accent" />
                <span className="font-bold text-ink">{currentOrder.kioskName}</span>
                {currentOrder.createdAt && (
                  <>
                    <span>·</span>
                    <Clock className="w-3 h-3 text-ink-soft" />
                    <span>{formatArabicDateTime(currentOrder.createdAt)}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons: Print, Status Pill, Close */}
          <div className="flex items-center gap-2 shrink-0 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-body font-bold text-ink bg-surface border border-line hover:bg-canvas transition-all shadow-2xs active:scale-95 cursor-pointer"
              title="طباعة الفاتورة"
            >
              <Printer className="w-3.5 h-3.5 text-accent" />
              <span className="hidden sm:inline">طباعة</span>
            </button>

            <div className="hidden xs:block">
              <StatusPill status={currentOrder.status as any} />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-ink-soft hover:text-ink rounded-full hover:bg-line/40 transition-colors cursor-pointer"
              aria-label="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 overscroll-contain space-y-5 print:p-0 print:overflow-visible">
          {/* Top Status & Store Summary Banner */}
          <div className="bg-canvas/80 border border-line/70 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-body text-xs text-ink-soft">كشك التنفيذ:</span>
                <span className="font-display font-bold text-sm text-ink flex items-center gap-1">
                  <Store className="w-4 h-4 text-accent" />
                  {currentOrder.kioskName}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-body text-ink-soft">
                <span>تاريخ ووقت الطلب:</span>
                <span className="font-bold text-ink font-mono-nums">
                  {currentOrder.createdAt ? formatArabicDateTime(currentOrder.createdAt) : 'غير محدد'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="font-body text-xs text-ink-soft">حالة الأوردر:</span>
              <StatusPill status={currentOrder.status as any} />
            </div>
          </div>

          {/* Student & Customer Info Card */}
          <div className="bg-surface border border-line/80 rounded-2xl p-4 space-y-3 shadow-2xs">
            <h4 className="font-display font-bold text-xs sm:text-sm text-ink flex items-center gap-2 border-b border-line/60 pb-2">
              <User className="w-4 h-4 text-primary-ink" />
              <span>بيانات الطالب المستلم</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-body">
              {/* Student Name */}
              <div className="flex items-center gap-2">
                <span className="text-ink-soft min-w-[70px]">اسم الطالب:</span>
                <span className="font-bold text-ink truncate text-sm">
                  {currentOrder.studentName}
                </span>
              </div>

              {/* Student College */}
              <div className="flex items-center gap-2">
                <span className="text-ink-soft min-w-[70px] flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-ink-soft" />
                  <span>الكلية:</span>
                </span>
                <span className="font-bold text-ink truncate">
                  {currentOrder.studentCollege || 'الحرم الجامعي'}
                </span>
              </div>

              {/* Student Phone */}
              {currentOrder.studentPhone && (
                <div className="flex items-center gap-2 sm:col-span-2 pt-1 border-t border-line/40">
                  <span className="text-ink-soft min-w-[70px] flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>رقم الهاتف:</span>
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg dir-ltr"
                      dir="ltr"
                    >
                      {currentOrder.studentPhone}
                    </span>

                    {currentOrder.studentPhoneVerified && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>مؤكد</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCopyPhone(currentOrder.studentPhone!)}
                      className="p-1 hover:bg-line/40 rounded-md text-ink-soft hover:text-ink transition-colors cursor-pointer"
                      title="نسخ رقم الهاتف"
                    >
                      {copiedPhone ? (
                        <span className="text-[10px] font-bold text-accent flex items-center gap-0.5">
                          <Check className="w-3 h-3" />
                          <span>تم النسخ</span>
                        </span>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <a
                      href={`https://wa.me/2${currentOrder.studentPhone.replace(/\D/g, '').replace(/^2/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors inline-flex items-center gap-1 text-[11px] font-bold"
                      title="مراسلة عبر واتساب"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="hidden xs:inline">واتساب</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Student Order Notes (if present) */}
          {currentOrder.orderNotes && (
            <div className="bg-primary-soft/40 border border-primary/40 rounded-2xl p-3.5 text-xs font-body text-primary-ink flex items-start gap-2.5 shadow-2xs">
              <MessageSquareQuote className="w-4 h-4 flex-shrink-0 text-primary-ink mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="font-black block text-[11px] text-primary-ink">
                  ملاحظة الطالب المرفقة مع الطلب:
                </span>
                <p className="font-bold text-xs text-ink mt-0.5 leading-relaxed bg-surface/70 p-2 rounded-xl border border-primary/20">
                  &quot;{currentOrder.orderNotes}&quot;
                </p>
              </div>
            </div>
          )}

          {/* Items Breakdown Table (تفاصيل عناصر الفاتورة) */}
          <div className="bg-surface border border-line/80 rounded-2xl overflow-hidden shadow-2xs">
            <div className="px-4 py-3 bg-canvas/70 border-b border-line/60 flex items-center justify-between">
              <h4 className="font-display font-bold text-xs sm:text-sm text-ink flex items-center gap-2">
                <Receipt className="w-4 h-4 text-accent" />
                <span>عناصر ومحتويات الفاتورة</span>
              </h4>
              <span className="font-body text-xs font-bold text-ink-soft bg-surface border border-line px-2 py-0.5 rounded-full">
                {currentOrder.items?.length || 0} صنف
              </span>
            </div>

            {isLoadingDetails ? (
              <div className="p-8 text-center text-ink-soft font-body text-xs">
                جاري تحميل تفاصيل الأصناف...
              </div>
            ) : !currentOrder.items || currentOrder.items.length === 0 ? (
              <div className="p-6 text-center text-ink-soft font-body text-xs">
                لا توجد عناصر مسجلة في هذا الطلب
              </div>
            ) : (
              <div className="divide-y divide-line/60">
                {/* Table Header */}
                <div className="px-4 py-2 bg-canvas/30 grid grid-cols-12 text-[11px] font-body font-bold text-ink-soft">
                  <div className="col-span-6 sm:col-span-7">اسم الصنف والتفاصيل</div>
                  <div className="col-span-2 text-center">الكمية</div>
                  <div className="col-span-2 text-left">السعر</div>
                  <div className="col-span-2 sm:col-span-1 text-left">الإجمالي</div>
                </div>

                {/* Table Rows */}
                {currentOrder.items.map((item, index) => {
                  const lineTotal = item.price * item.quantity;
                  return (
                    <div
                      key={item.id || index}
                      className="px-4 py-3 grid grid-cols-12 items-center text-xs font-body hover:bg-canvas/30 transition-colors"
                    >
                      <div className="col-span-6 sm:col-span-7 min-w-0 pr-1">
                        <p className="font-bold text-ink truncate text-xs sm:text-sm">
                          {item.name}
                        </p>
                        {item.specialInstructions && (
                          <p className="text-[10px] text-ink-soft italic truncate mt-0.5 text-amber-700 bg-amber-50 inline-block px-1.5 py-0.2 rounded border border-amber-200">
                            ملاحظة: {item.specialInstructions}
                          </p>
                        )}
                      </div>

                      <div className="col-span-2 text-center">
                        <span className="font-mono font-bold text-xs bg-canvas text-ink px-2 py-0.5 rounded-lg border border-line">
                          × {item.quantity}
                        </span>
                      </div>

                      <div className="col-span-2 text-left">
                        <span className="font-mono font-medium text-ink-soft text-xs font-mono-nums">
                          {formatEGP(item.price)}
                        </span>
                      </div>

                      <div className="col-span-2 sm:col-span-1 text-left">
                        <span className="font-mono font-bold text-ink text-xs sm:text-sm font-mono-nums">
                          {formatEGP(lineTotal)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Financial Breakdown & Receipt Totals (التكلفة والرسوم) */}
          <div className="bg-canvas/60 border border-line/80 rounded-2xl p-4 sm:p-5 space-y-3">
            <h4 className="font-display font-bold text-xs sm:text-sm text-ink pb-2 border-b border-line/60 flex items-center justify-between">
              <span>تفصيل التكلفة والرسوم المالية</span>
              <span className="font-mono text-xs text-ink-soft font-normal">جنيه مصري (EGP)</span>
            </h4>

            <div className="space-y-2 text-xs sm:text-sm font-body">
              {/* Subtotal */}
              <div className="flex items-center justify-between text-ink-soft">
                <span>سعر الأصناف (المجموع الفرعي):</span>
                <span className="font-mono font-bold text-ink font-mono-nums">
                  {formatEGP(subtotal)}
                </span>
              </div>

              {/* Service & Operational Fees */}
              <div className="flex items-center justify-between text-ink-soft">
                <span className="flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-600" />
                  <span>رسوم خدمة المنصة والتشغيل:</span>
                </span>
                <span className="font-mono font-bold text-ink font-mono-nums">
                  {fees > 0 ? formatEGP(fees) : '0 ج.م (مجاناً)'}
                </span>
              </div>

              {/* Discounts if any */}
              {discount > 0 && (
                <div className="flex items-center justify-between text-accent">
                  <span className="flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-accent" />
                    <span>الخصومات المطبقة:</span>
                  </span>
                  <span className="font-mono font-bold font-mono-nums">
                    - {formatEGP(discount)}
                  </span>
                </div>
              )}

              {/* Total Row */}
              <div className="pt-3 border-t-2 border-line/80 flex items-center justify-between font-display font-black text-base sm:text-lg text-ink">
                <span>إجمالي الفاتورة المطلوب:</span>
                <span className="font-mono text-xl sm:text-2xl font-black text-ink font-mono-nums text-primary-ink">
                  {formatEGP(total)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method & Status Card (طريقة وحالة الدفع) */}
          <div className="bg-surface border border-line/80 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-line/60 pb-2.5">
              <h4 className="font-display font-bold text-xs sm:text-sm text-ink flex items-center gap-2">
                {isOnline ? (
                  <Smartphone className="w-4 h-4 text-accent" />
                ) : (
                  <Banknote className="w-4 h-4 text-primary-ink" />
                )}
                <span>بيانات وطريقة الدفع</span>
              </h4>

              {/* Payment Status Tag */}
              {isOnline ? (
                isPaid ? (
                  <span className="inline-flex items-center gap-1 text-xs font-body font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>مدفوع أونلاين بالكامل ✓</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-body font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-300">
                    <Clock className="w-3.5 h-3.5" />
                    <span>بانتظار تأكيد التحويل للكشك</span>
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-body font-bold text-primary-ink bg-primary-soft px-2.5 py-1 rounded-full border border-primary/25">
                  <Banknote className="w-3.5 h-3.5" />
                  <span>كاش عند الاستلام</span>
                </span>
              )}
            </div>

            {/* Online Payment Proof Details */}
            {isOnline ? (
              <div className="space-y-3 text-xs font-body">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-canvas/50 p-3 rounded-xl border border-line/60">
                  <div>
                    <span className="text-ink-soft block text-[11px]">بوابة / طريقة التحويل:</span>
                    <span className="font-bold text-ink mt-0.5 block">
                      {currentOrder.onlinePaymentType === 'instapay'
                        ? 'انستا باي (InstaPay)'
                        : 'محفظة إلكترونية (فودافون كاش / أورانج / إتصالات)'}
                    </span>
                  </div>

                  <div>
                    <span className="text-ink-soft block text-[11px]">المبلغ المحول:</span>
                    <span className="font-mono font-bold text-ink mt-0.5 block font-mono-nums">
                      {formatEGP(currentOrder.transferAmount || currentOrder.total)}
                    </span>
                  </div>

                  {currentOrder.transferSenderPhone && (
                    <div className="sm:col-span-2 pt-2 border-t border-line/40">
                      <span className="text-ink-soft block text-[11px]">
                        رقم / حساب المحول منه:
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="font-mono font-bold text-xs text-ink dir-ltr"
                          dir="ltr"
                        >
                          {currentOrder.transferSenderPhone}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyPhone(currentOrder.transferSenderPhone!)}
                          className="p-1 hover:bg-line/40 rounded text-ink-soft transition-colors"
                          title="نسخ رقم المحول"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Transfer Receipt Image Proof Card */}
                {currentOrder.transferImageUrl ? (
                  <div className="bg-canvas/90 border border-line/80 rounded-2xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-accent" />
                        <span className="font-bold text-ink text-xs sm:text-sm">صورة إيصال التحويل المرفقة</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsPreviewReceiptOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-accent bg-accent-soft hover:bg-accent/20 border border-accent/30 transition-all cursor-pointer shadow-2xs"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>عرض وتكبير الإيصال</span>
                        </button>

                        <a
                          href={currentOrder.transferImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-ink-soft hover:text-ink bg-surface border border-line hover:bg-line/30 transition-colors"
                          title="فتح في نافذة جديدة"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="hidden xs:inline">نافذة جديدة</span>
                        </a>
                      </div>
                    </div>

                    {/* Image Preview Box with Direct Click to Enlarge */}
                    <div
                      className="group relative w-full h-56 sm:h-64 bg-surface rounded-xl overflow-hidden border border-line/70 cursor-pointer flex items-center justify-center hover:border-accent/60 transition-colors shadow-2xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPreviewReceiptOpen(true);
                      }}
                      title="انقر لتكبير صورة الإيصال"
                    >
                      <img
                        src={currentOrder.transferImageUrl}
                        alt="إيصال التحويل"
                        className="w-full h-full object-contain p-1.5 transition-transform duration-200 group-hover:scale-[1.02]"
                        loading="eager"
                      />
                      <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs pointer-events-none backdrop-blur-[1px]">
                        <Maximize2 className="w-4 h-4 drop-shadow" />
                        <span>انقر للمعاينة بالحجم الكامل</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-ink-soft italic bg-canvas/30 p-2.5 rounded-lg border border-line/50">
                    لم يتم إرفاق صورة إيصال لهذا الطلب.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs font-body text-ink-soft bg-canvas/50 p-3 rounded-xl border border-line/60 space-y-1">
                <p className="font-bold text-ink">
                  المطلوب تحصيله كاش: <span className="font-mono text-primary-ink font-bold">{formatEGP(total)}</span>
                </p>
                <p className="text-[11px]">
                  يقوم الطالب بسداد قيمة الفاتورة نقداً عند شباك كشك{' '}
                  <strong className="text-ink">{currentOrder.kioskName}</strong> وقت استلام الأوردر.
                </p>
              </div>
            )}
          </div>

          {/* Cancellation or Rejection Reason (If applicable) */}
          {(currentOrder.status === 'CANCELLED' || currentOrder.status === 'REJECTED') && (
            <div className="bg-danger-soft/40 border border-danger/40 rounded-2xl p-4 text-xs font-body space-y-1">
              <span className="font-bold text-danger flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>سبب الإلغاء أو الرفض:</span>
              </span>
              <p className="text-ink font-medium">
                {currentOrder.cancellationReason || currentOrder.rejectionReason || 'لم يتم تحديد سبب محدد'}
              </p>
            </div>
          )}

          {/* Footer Receipt Note (Like on official receipts) */}
          <div className="text-center pt-2 pb-1 border-t border-line/50 text-[11px] font-body text-ink-soft">
            <p>OrderFAST · نظام إدارة الطلبات الموحد للحرم الجامعي</p>
            <p className="text-[10px] mt-0.5">معرف الطلب: {currentOrder.id}</p>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-line/70 bg-canvas/40 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-body font-bold text-ink-soft hover:text-ink hover:bg-line/40 transition-colors cursor-pointer"
          >
            إغلاق
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-body font-bold text-white bg-ink hover:bg-ink/90 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4 text-accent" />
              <span>طباعة الفاتورة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Full Size Receipt Image Modal Preview (via Portal on document.body) */}
      {mounted && isPreviewReceiptOpen && currentOrder.transferImageUrl && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsPreviewReceiptOpen(false)}
        >
          <div
            className="relative bg-surface rounded-3xl p-4 sm:p-5 max-w-2xl w-full max-h-[92vh] flex flex-col gap-3 shadow-2xl border border-line text-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-line">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-accent-soft text-accent flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm sm:text-base text-ink">
                    إيصال تحويل الطلب #{cleanOrderNumber}
                  </h4>
                  <p className="text-[11px] font-body text-ink-soft">
                    المحول: {currentOrder.transferSenderPhone || 'غير مسجل'} · المبلغ: {formatEGP(currentOrder.transferAmount || currentOrder.total)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPreviewReceiptOpen(false)}
                className="p-1.5 text-ink-soft hover:text-ink rounded-full hover:bg-canvas transition-colors cursor-pointer"
                aria-label="إغلاق المعاينة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lightbox Image Viewport */}
            <div className="relative w-full h-[62vh] max-h-[520px] bg-canvas/90 rounded-2xl overflow-hidden border border-line flex items-center justify-center p-2">
              <img
                src={currentOrder.transferImageUrl}
                alt="إيصال التحويل بالحجم الكامل"
                className="w-full h-full object-contain rounded-xl select-none"
              />
            </div>

            {/* Lightbox Footer Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-line/60">
              <a
                href={currentOrder.transferImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-body font-bold text-white bg-accent hover:bg-accent-hover px-4 py-2 rounded-xl shadow-xs transition-colors"
              >
                <span>فتح الصورة الأصلية في نافذة جديدة</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setIsPreviewReceiptOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-body font-bold bg-canvas hover:bg-line/40 text-ink transition-colors cursor-pointer"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

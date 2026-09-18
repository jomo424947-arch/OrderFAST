'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Order } from '@/types';
import {
  Clock,
  Check,
  X,
  User,
  Smartphone,
  Banknote,
  Eye,
  MessageSquareQuote,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { formatSecondsTimer, formatEGP } from '@/lib/formatters';
import { Modal } from '@/components/ui/Modal';

export interface CashierIncomingOrderCardProps {
  order: Order;
  onAccept: (orderId: string) => void;
  onReject: (orderId: string) => void;
}

export const CashierIncomingOrderCard: React.FC<CashierIncomingOrderCardProps> = ({
  order,
  onAccept,
  onReject,
}) => {
  const timeRemaining = order.reviewTimeRemainingSeconds ?? 240;
  const isOnline = order.paymentMethod === 'digital_wallet';
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  return (
    <>
      <div className="bg-surface rounded-3xl p-5 border border-line/80 shadow-warm hover:shadow-md transition-all flex flex-col justify-between space-y-4 text-right">
        <div className="space-y-3.5">
          {/* Top Row: Order Number, Countdown Timer & Payment Status Badge */}
          <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-line/60">
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-black text-ink font-mono-nums tracking-wide">
                {order.orderNumber}
              </span>

              {/* Payment Status Pill */}
              {isOnline ? (
                order.paymentStatus === 'paid' ? (
                  <span className="inline-flex items-center gap-1 font-body text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <Smartphone className="w-3 h-3" />
                    <span>
                      تم تأكيد الدفع ({order.onlinePaymentType === 'instapay' ? 'انستا باي' : 'محفظة كاش'})
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-body text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300">
                    <Smartphone className="w-3 h-3" />
                    <span>
                      بانتظار التحقق من التحويل ({order.onlinePaymentType === 'instapay' ? 'انستا باي' : 'محفظة كاش'})
                    </span>
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1 font-body text-[11px] font-bold text-primary-ink bg-primary-soft px-2.5 py-0.5 rounded-full border border-primary/20">
                  <Banknote className="w-3 h-3" />
                  <span>كاش عند الاستلام</span>
                </span>
              )}
            </div>

            {/* Urgent Countdown Timer */}
            <span
              className={`flex items-center gap-1 font-mono text-xs font-bold font-mono-nums px-2.5 py-1 rounded-full ${
                timeRemaining <= 60
                  ? 'bg-danger text-white animate-pulse'
                  : 'text-danger bg-danger-soft'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>باقي {formatSecondsTimer(timeRemaining)}</span>
            </span>
          </div>

          {/* Customer Info */}
          <div className="flex items-center justify-between text-xs font-body text-ink-soft">
            <div className="flex items-center gap-1.5 truncate">
              <User className="w-3.5 h-3.5 text-ink-soft flex-shrink-0" />
              <span className="font-bold text-ink truncate">{order.studentName}</span>
              <span className="text-ink-soft truncate">({order.studentCollege})</span>
            </div>
          </div>

          {/* Student Order Notes (Highlighted Banner if present) */}
          {order.orderNotes && (
            <div className="bg-primary-soft/40 border border-primary/40 rounded-2xl p-3 text-xs font-body text-primary-ink flex items-start gap-2 shadow-2xs">
              <MessageSquareQuote className="w-4 h-4 flex-shrink-0 text-primary-ink mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="font-black block text-[11px] text-primary-ink">ملاحظة الطالب على الأوردر:</span>
                <p className="font-bold text-xs text-ink mt-0.5 leading-relaxed">
                  &quot;{order.orderNotes}&quot;
                </p>
              </div>
            </div>
          )}

          {/* Prominently Highlighted Order Items List */}
          <div className="bg-canvas/80 rounded-2xl p-3.5 border border-line/70 space-y-2">
            <p className="font-body text-[11px] font-bold text-ink-soft">محتويات الطلب:</p>
            <div className="divide-y divide-line/50">
              {order.items.map((item) => (
                <div key={item.id} className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-xs font-black text-ink truncate">
                      {item.name}
                    </p>
                    {item.specialInstructions && (
                      <p className="text-[10px] font-body text-ink-soft italic truncate">
                        {item.specialInstructions}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono text-xs font-black bg-surface text-ink border border-line px-2 py-0.5 rounded-lg font-mono-nums">
                      × {item.quantity}
                    </span>
                    <span className="font-mono text-xs font-bold text-ink-soft font-mono-nums min-w-[45px] text-left">
                      {formatEGP(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Online Payment Proof Verification Box (When paid online) */}
          {isOnline && (
            <div className="bg-accent-soft/30 border border-accent/40 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-body text-xs font-black text-accent flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>إثبات التحويل الإلكتروني</span>
                </span>
                <span className="font-mono text-xs font-black text-accent font-mono-nums">
                  المحول: {formatEGP(order.transferAmount || order.total)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="min-w-0 flex-1">
                  <p className="font-body text-[11px] text-ink-soft">الرقم / الحساب المحول منه:</p>
                  <p className="font-mono text-xs font-black text-ink font-mono-nums dir-ltr text-right truncate mt-0.5">
                    {order.transferSenderPhone || 'غير مسجل'}
                  </p>
                </div>

                {/* Receipt Thumbnail & Preview Trigger */}
                {order.transferImageUrl ? (
                  <button
                    type="button"
                    onClick={() => setIsReceiptModalOpen(true)}
                    className="group relative w-14 h-14 rounded-xl overflow-hidden border-2 border-accent/50 hover:border-accent shadow-xs flex-shrink-0 transition-transform active:scale-95 bg-surface"
                    title="اضغط لمعاينة وتكبير صورة الإيصال"
                  >
                    <Image
                      src={order.transferImageUrl}
                      alt="إيصال التحويل"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center text-white transition-colors">
                      <Eye className="w-4 h-4 drop-shadow" />
                    </div>
                  </button>
                ) : (
                  <span className="text-[10px] font-body text-danger font-bold">
                    لم يرفق صورة
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Total & Action Buttons */}
        <div className="pt-3 border-t border-line/60 flex items-center justify-between gap-3">
          <div>
            <span className="font-body text-[10px] text-ink-soft block">
              {isOnline ? 'المبلغ المستلم أونلاين' : 'المطلوب تحصيله كاش'}
            </span>
            <span className="font-mono text-base font-black text-ink font-mono-nums">
              {formatEGP(order.total)}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-[220px]">
            <button
              type="button"
              onClick={() => onAccept(order.id)}
              className="flex-1 bg-accent hover:bg-accent-hover text-white text-xs font-body font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>قبول</span>
            </button>
            <button
              type="button"
              onClick={() => onReject(order.id)}
              className="flex-1 border-[1.5px] border-danger text-danger hover:bg-danger-soft text-xs font-body font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
              <span>رفض</span>
            </button>
          </div>
        </div>
      </div>

      {/* Full-Screen Receipt Inspection Lightbox Modal */}
      {order.transferImageUrl && (
        <Modal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          title={`إيصال تحويل أوردر ${order.orderNumber}`}
          description={`المحول: ${order.transferSenderPhone || 'غير محدد'} · المبلغ: ${formatEGP(order.transferAmount || order.total)}`}
        >
          <div className="space-y-4 text-center">
            <div className="relative w-full max-h-[70vh] min-h-[300px] h-[450px] rounded-2xl overflow-hidden border border-line bg-canvas flex items-center justify-center">
              <Image
                src={order.transferImageUrl}
                alt="إيصال التحويل بالكامل"
                fill
                className="object-contain p-1"
                priority
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <a
                href={order.transferImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-body font-bold text-accent hover:underline inline-flex items-center gap-1"
              >
                <span>فتح الصورة الأصلية في نافذة جديدة</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2 bg-line/60 hover:bg-line text-ink rounded-xl text-xs font-body font-bold transition-colors"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

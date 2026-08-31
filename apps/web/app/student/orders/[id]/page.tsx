'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useOrderStore } from '@/stores/useOrderStore';
import { OrderTicket } from '@/components/orders/OrderTicket';
import { OrderTimeline } from '@/components/orders/OrderTimeline';
import { StatusPill } from '@/components/ui/StatusPill';
import { Button } from '@/components/ui/Button';
import { formatEGP, formatArabicTime } from '@/lib/formatters';
import { ChevronRight, Store, CreditCard, Info, RefreshCw, XCircle } from 'lucide-react';

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const { getOrderById, rejectOrder } = useOrderStore();
  const order = getOrderById(orderId);

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <h3 className="font-display font-bold text-xl text-ink">
          الأوردر غير موجود
        </h3>
        <p className="font-body text-xs text-ink-soft">
          تأكد من رقم الأوردر أو تصفح طلباتك السابقة.
        </p>
        <Link href="/student/orders">
          <Button variant="primary" size="md">
            عرض كل طلباتي
          </Button>
        </Link>
      </div>
    );
  }

  const isPending = order.status === 'pending_review' || order.status === 'placed';

  return (
    <div className="max-w-md mx-auto space-y-5">
      {/* Screen Header */}
      <div className="flex items-center justify-between pb-2 border-b border-line/60">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/student/orders')}
            className="w-8 h-8 rounded-full bg-surface border border-line flex items-center justify-center text-ink hover:bg-canvas transition-colors"
            aria-label="الرجوع"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div>
            <h3 className="font-display font-bold text-lg text-ink">
              تتبع الأوردر
            </h3>
            <p className="font-body text-xs text-ink-soft">
              {formatArabicTime(order.createdAt)}
            </p>
          </div>
        </div>

        <StatusPill status={order.status === 'preparing' ? 'preparing' : order.status === 'ready_for_pickup' ? 'ready' : 'pending'} />
      </div>

      {/* Visual Ticket Component matching design reference */}
      <OrderTicket
        orderNumber={order.orderNumber}
        kioskName={order.kioskName}
        estimatedWaitMins={order.estimatedWaitMins}
        approximateOrdersAhead={order.approximateOrdersAhead}
      />

      {/* Approximate queue note alert */}
      <div className="bg-canvas border border-line rounded-2xl p-3 text-[11px] font-body text-ink-soft flex items-start gap-2">
        <Info className="w-4 h-4 text-ink-soft flex-shrink-0 mt-0.5" />
        <span>
          ملاحظة: عدد الأوردرات الموضح هو تقريب لأوردرات التطبيق فقط وليس كامل طابور الكشك الفعلي.
        </span>
      </div>

      {/* 6-Stage Timeline Lifecycle */}
      <div className="bg-surface border border-line/80 rounded-3xl p-5 shadow-warm">
        <OrderTimeline status={order.status} />
      </div>

      {/* Order Items Breakdown */}
      <div className="bg-surface border border-line/80 rounded-3xl p-5 shadow-warm space-y-3">
        <h4 className="font-display font-bold text-sm text-ink pb-2 border-b border-line/60">
          تفاصيل الأوردر
        </h4>
        <div className="divide-y divide-line/60 text-xs font-body">
          {order.items.map((item) => (
            <div key={item.id} className="py-2 flex items-center justify-between">
              <span className="text-ink">
                {item.name} <strong className="text-ink-soft">× {item.quantity}</strong>
              </span>
              <span className="font-mono font-bold text-ink font-mono-nums">
                {formatEGP(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-line/70 flex items-center justify-between font-body text-sm font-bold text-ink">
          <span>المطلوب عند الاستلام</span>
          <span className="font-mono text-base text-primary-ink font-mono-nums font-black">{formatEGP(order.total)}</span>
        </div>

        <p className="text-[11px] font-body text-ink-soft text-center pt-1 leading-relaxed">
          الدفع كاش أو محفظة إلكترونية وقت الاستلام من الكشك مباشرة
        </p>
      </div>

      {/* Pending Cancel Action */}
      {isPending && (
        <div className="pt-2">
          <Button
            variant="ghost"
            size="md"
            onClick={() => rejectOrder(order.id, 'تم الإلغاء بواسطة الطالب')}
            className="w-full text-danger border-danger/40 hover:bg-danger-soft"
          >
            <XCircle className="w-4 h-4 ml-1" />
            إلغاء الأوردر
          </Button>
        </div>
      )}
    </div>
  );
}

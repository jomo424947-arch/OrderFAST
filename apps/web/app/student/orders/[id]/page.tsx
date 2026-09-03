'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useOrderStore } from '@/stores/useOrderStore';
import { OrderTicket } from '@/components/orders/OrderTicket';
import { OrderTimeline } from '@/components/orders/OrderTimeline';
import { OrderRatingCard } from '@/components/orders/OrderRatingCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatEGP, formatArabicTime } from '@/lib/formatters';
import { ChevronRight, Store, CreditCard, Info, RefreshCw, XCircle, PackageCheck, Sparkles, BellRing } from 'lucide-react';

function playReadyChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // Ignore audio context errors
  }
}

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const { getOrderById, startStudentTrackingPolling, cancelOrder } = useOrderStore();
  const order = getOrderById(orderId);

  const [isReadyModalOpen, setIsReadyModalOpen] = useState(false);
  const hasTriggeredReadyModalRef = useRef(false);
  const ratingSectionRef = useRef<HTMLDivElement>(null);
  const hasScrolledToRatingRef = useRef(false);

  useEffect(() => {
    if (!orderId) return;
    const cleanup = startStudentTrackingPolling(orderId, 2500);
    return () => cleanup();
  }, [orderId, startStudentTrackingPolling]);

  // Trigger popup & sound chime when order becomes READY
  useEffect(() => {
    if (order?.status === 'READY' && !hasTriggeredReadyModalRef.current) {
      hasTriggeredReadyModalRef.current = true;
      setIsReadyModalOpen(true);
      playReadyChime();
    }
  }, [order?.status]);

  // Smooth scroll to rating card when order is delivered/completed and not yet rated
  useEffect(() => {
    if (order?.status === 'COMPLETED' && !order?.rating && !hasScrolledToRatingRef.current) {
      hasScrolledToRatingRef.current = true;
      const timer = setTimeout(() => {
        ratingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [order?.status, order?.rating]);

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

  const isPending = order.status === 'PENDING_KIOSK';
  const isReady = order.status === 'READY';
  const isCompleted = order.status === 'COMPLETED';

  return (
    <div className="max-w-md mx-auto space-y-5 pb-12">
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
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-lg text-ink">
                تتبع الأوردر
              </h3>
              <span className="flex items-center gap-1 bg-accent/10 text-accent px-2 py-0.5 rounded-full text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                مباشر
              </span>
            </div>
            <p className="font-body text-xs text-ink-soft">
              {formatArabicTime(order.createdAt)}
            </p>
          </div>
        </div>

        <StatusPill status={order.status} />
      </div>

      {/* 1. Ready for Pickup Animated Banner above Ticket */}
      {isReady && (
        <div className="bg-accent text-white rounded-3xl p-4 sm:p-5 shadow-floating flex items-center gap-3.5 animate-in slide-in-from-top-3 duration-300 border border-white/20">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0 animate-bounce">
            <PackageCheck className="w-7 h-7 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                جاهز الآن
              </span>
              <span className="text-xs font-mono font-bold">#{order.orderNumber}</span>
            </div>
            <h4 className="font-display font-black text-base sm:text-lg mt-0.5">
              طلبك جاهز للاستلام! 🎉
            </h4>
            <p className="font-body text-xs text-white/90 mt-0.5 leading-relaxed">
              توجه فوراً إلى كشك <strong className="text-white underline underline-offset-2">{order.kioskName}</strong> لاستلام أوردرك ودفع الحساب.
            </p>
          </div>
        </div>
      )}

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

      {/* 5-Stage Timeline Lifecycle */}
      <div className="bg-surface border border-line/80 rounded-3xl p-5 shadow-warm">
        <OrderTimeline status={order.status} />
      </div>

      {/* Kiosk Star Rating Card after Delivery */}
      {isCompleted && (
        <div ref={ratingSectionRef}>
          <OrderRatingCard
            orderId={order.id}
            kioskName={order.kioskName}
            existingRating={order.rating}
          />
        </div>
      )}

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
            onClick={async () => {
              await cancelOrder(order.id, 'تم الإلغاء بواسطة الطالب');
            }}
            className="w-full text-danger border-danger/40 hover:bg-danger-soft"
          >
            <XCircle className="w-4 h-4 ml-1" />
            إلغاء الأوردر
          </Button>
        </div>
      )}

      {/* 2. Ready for Pickup Popup Modal */}
      <Modal
        isOpen={isReadyModalOpen}
        onClose={() => setIsReadyModalOpen(false)}
        title="طلبك جاهز للاستلام! 🎉"
        description={`تم الانتهاء من تحضير أوردرك في كشك ${order.kioskName}`}
      >
        <div className="text-center space-y-4 py-2">
          <div className="w-16 h-16 rounded-3xl bg-accent-soft text-accent flex items-center justify-center mx-auto animate-bounce shadow-sm">
            <PackageCheck className="w-9 h-9" />
          </div>

          <div>
            <span className="font-body text-xs text-ink-soft">أظهر هذا الرقم للكاشير عند الاستلام:</span>
            <p className="font-mono font-black text-4xl text-primary-ink tracking-wider mt-1 font-mono-nums">
              #{order.orderNumber}
            </p>
          </div>

          <div className="bg-canvas border border-line rounded-2xl p-4 text-xs font-body text-ink-soft text-right space-y-2">
            <div className="flex justify-between items-center text-ink font-bold">
              <span>الكشك:</span>
              <span className="text-accent">{order.kioskName}</span>
            </div>
            <div className="flex justify-between items-center text-ink font-bold">
              <span>المبلغ المطلوب تحصيله:</span>
              <span className="font-mono text-primary-ink text-sm font-black">{formatEGP(order.total)}</span>
            </div>
            <p className="text-[11px] text-ink-soft pt-1 border-t border-line/60">
              الدفع متاح كاش أو محفظة إلكترونية مباشرة عند شباك الكشك.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsReadyModalOpen(false)}
            className="w-full text-sm font-bold shadow-warm"
          >
            <span>سأتوجه للاستلام الآن </span>
          </Button>
        </div>
      </Modal>
    </div>
  );
}

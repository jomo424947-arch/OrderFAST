'use client';

import React, { useState } from 'react';
import { useOrderStore } from '@/stores/useOrderStore';
import { useKioskStore } from '@/stores/useKioskStore';
import { CashierIncomingOrderCard } from '@/components/orders/CashierIncomingOrderCard';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Inbox, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function CashierIncomingOrdersPage() {
  const { activeKioskId, kiosks } = useKioskStore();
  const { getKioskIncomingOrders, acceptOrder, rejectOrder } = useOrderStore();

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetOrderId, setTargetOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('نفاد بعض المكونات المطلوبة');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const incomingOrders = getKioskIncomingOrders(activeKioskId);
  const currentKiosk = kiosks.find((k) => k.id === activeKioskId) || kiosks[0];

  const handleAccept = (orderId: string) => {
    acceptOrder(orderId);
    setActionFeedback('تم قبول الأوردر ونقله لقائمة التحضير!');
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleOpenReject = (orderId: string) => {
    setTargetOrderId(orderId);
    setRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (targetOrderId) {
      rejectOrder(targetOrderId, rejectReason);
      setRejectModalOpen(false);
      setTargetOrderId(null);
      setActionFeedback('تم رفض الأوردر وإخطار الطالب.');
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-line/60">
        <div>
          <h2 className="font-display font-bold text-2xl text-ink">
            الأوردرات الواردة
          </h2>
          <p className="font-body text-xs text-ink-soft">
            {currentKiosk.name} · الرد السريع خلال دقيقتين يحسن تقييم الكشك
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-body text-xs text-ink-soft">العدد في الانتظار:</span>
          <span className="font-mono text-sm font-bold bg-primary-soft text-primary-ink px-2.5 py-0.5 rounded-full font-mono-nums">
            {incomingOrders.length}
          </span>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionFeedback && (
        <div className="bg-accent-soft border border-accent/30 text-accent rounded-2xl p-3.5 text-xs font-body font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Orders Grid / List */}
      {incomingOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {incomingOrders.map((order) => (
            <CashierIncomingOrderCard
              key={order.id}
              order={order}
              onAccept={handleAccept}
              onReject={handleOpenReject}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Inbox className="w-8 h-8" />}
          title="لا توجد أوردرات واردة جديدة"
          description="أوردرات الطلاب الجدد ستظهر هنا تلقائياً مع عد تنازلي للرد والقبول."
        />
      )}

      {/* Reject Reason Dialog Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="تأكيد رفض الأوردر"
        description="يرجى اختيار سبب الرفض لإبلاغ الطالب بشكل واضح:"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            {[
              'نفاد بعض المكونات المطلوبة',
              'ضغط طلبات وازدحام شديد بالكشك',
              'الكشك على وشك الإغلاق',
              'عطل فني في معدات التحضير',
            ].map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  rejectReason === reason
                    ? 'bg-danger-soft/40 border-danger/40 font-bold text-danger'
                    : 'bg-surface border-line hover:bg-canvas text-ink'
                }`}
              >
                <input
                  type="radio"
                  name="reject_reason"
                  value={reason}
                  checked={rejectReason === reason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-4 h-4 accent-danger"
                />
                <span className="text-xs font-body">{reason}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-line/60">
            <Button
              variant="danger"
              size="md"
              onClick={handleConfirmReject}
              className="flex-1"
            >
              تأكيد الرفض
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => setRejectModalOpen(false)}
              className="flex-1"
            >
              تراجع
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

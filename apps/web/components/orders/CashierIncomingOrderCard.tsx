import React from 'react';
import { Order } from '@/types';
import { Clock, Check, X, User } from 'lucide-react';
import { formatSecondsTimer, formatEGP } from '@/lib/formatters';

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
  const timeRemaining = order.reviewTimeRemainingSeconds ?? 220;

  return (
    <div className="bg-surface rounded-2xl p-4 border border-line/80 shadow-warm hover:shadow-md transition-all">
      {/* Top Row: Order Number and Urgent Countdown Timer */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="font-mono text-base font-bold text-ink font-mono-nums">
          #{order.orderNumber}
        </span>
        <span className="flex items-center gap-1 font-mono text-xs font-bold text-danger font-mono-nums bg-danger-soft px-2.5 py-0.5 rounded-full">
          <Clock className="w-3.5 h-3.5" />
          <span>باقي {formatSecondsTimer(timeRemaining)}</span>
        </span>
      </div>

      {/* Customer Info */}
      <div className="flex items-center gap-1.5 text-xs font-body text-ink-soft mb-2">
        <User className="w-3 h-3" />
        <span>{order.studentName} ({order.studentCollege})</span>
      </div>

      {/* Items Summary Line */}
      <p className="font-body text-xs sm:text-sm text-ink leading-relaxed mb-3 pb-3 border-b border-line/50">
        {order.items.map((it) => `${it.name} × ${it.quantity}`).join('، ')}
      </p>

      {/* Total amount & Action Buttons */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-bold text-ink-soft">
          {formatEGP(order.total)}
        </span>
        <div className="flex items-center gap-2 flex-1 max-w-[200px]">
          <button
            type="button"
            onClick={() => onAccept(order.id)}
            className="flex-1 bg-accent hover:bg-accent-hover text-white text-xs font-body font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>قبول</span>
          </button>
          <button
            type="button"
            onClick={() => onReject(order.id)}
            className="flex-1 border-[1.5px] border-danger text-danger hover:bg-danger-soft text-xs font-body font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1 transition-all active:scale-95"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>رفض</span>
          </button>
        </div>
      </div>
    </div>
  );
};

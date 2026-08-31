import React from 'react';
import { Clock, ListOrdered, Store } from 'lucide-react';
import { formatWaitTime } from '@/lib/formatters';

export interface OrderTicketProps {
  orderNumber: string;
  kioskName: string;
  estimatedWaitMins: number;
  approximateOrdersAhead: number;
  className?: string;
}

export const OrderTicket: React.FC<OrderTicketProps> = ({
  orderNumber,
  kioskName,
  estimatedWaitMins,
  approximateOrdersAhead,
  className = '',
}) => {
  return (
    <div className={`relative bg-surface rounded-3xl p-6 border border-line/80 shadow-ticket overflow-hidden ${className}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between text-xs font-body text-ink-soft mb-2">
        <span className="font-semibold text-ink flex items-center gap-1.5">
          <Store className="w-3.5 h-3.5 text-accent" />
          {kioskName}
        </span>
        <span className="font-medium">أوردر رقم</span>
      </div>

      {/* Big Order Number */}
      <div className="text-center my-3">
        <h2 className="font-mono text-4xl sm:text-5xl font-bold text-ink tracking-tight font-mono-nums">
          {orderNumber.startsWith('#') ? orderNumber : `#${orderNumber}`}
        </h2>
      </div>

      {/* Perforated Dashed Divider */}
      <div className="ticket-divider my-5" />

      {/* Bottom Ticket Stats */}
      <div className="flex items-center justify-around text-center pt-1">
        {/* Estimated Time */}
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-accent-soft flex items-center justify-center text-accent mb-1.5">
            <Clock className="w-4 h-4" />
          </div>
          <span className="font-mono text-lg font-bold text-ink font-mono-nums">
            {formatWaitTime(estimatedWaitMins)}
          </span>
          <span className="font-body text-[11px] text-ink-soft mt-0.5">
            الوقت المتوقع
          </span>
        </div>

        {/* Orders Ahead */}
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-primary-soft flex items-center justify-center text-primary-ink mb-1.5">
            <ListOrdered className="w-4 h-4" />
          </div>
          <span className="font-mono text-lg font-bold text-ink font-mono-nums">
            {approximateOrdersAhead}
          </span>
          <span className="font-body text-[11px] text-ink-soft mt-0.5">
            أوردرات قدامك
          </span>
        </div>
      </div>
    </div>
  );
};

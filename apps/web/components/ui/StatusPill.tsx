import React from 'react';
import { cn } from '@/lib/utils';

export interface StatusPillProps {
  status:
    | 'open'
    | 'closed'
    | 'preparing'
    | 'ready'
    | 'pending'
    | 'accepted'
    | 'rejected'
    | 'picked_up'
    | 'no_show'
    | 'PENDING_KIOSK'
    | 'ACCEPTED'
    | 'PREPARING'
    | 'READY'
    | 'COMPLETED'
    | 'REJECTED'
    | 'CANCELLED'
    | 'EXPIRED'
    | 'NO_SHOW';
  customLabel?: string;
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  customLabel,
  className,
}) => {
  const configs: Record<string, { label: string; classes: string }> = {
    open: {
      label: 'مفتوح',
      classes: 'bg-accent-soft text-accent',
    },
    closed: {
      label: 'مغلق',
      classes: 'bg-line/60 text-ink-soft',
    },
    ready: {
      label: 'جاهز للاستلام',
      classes: 'bg-accent text-white font-bold',
    },
    READY: {
      label: 'جاهز للاستلام',
      classes: 'bg-accent text-white font-bold',
    },
    preparing: {
      label: 'جاري التجهيز',
      classes: 'bg-primary-soft text-primary-ink font-bold',
    },
    PREPARING: {
      label: 'جاري التجهيز',
      classes: 'bg-primary-soft text-primary-ink font-bold',
    },
    pending: {
      label: 'في الانتظار',
      classes: 'bg-primary-soft text-primary-ink',
    },
    PENDING_KIOSK: {
      label: 'في انتظار الموافقة',
      classes: 'bg-primary-soft text-primary-ink',
    },
    accepted: {
      label: 'جاري التجهيز',
      classes: 'bg-primary-soft text-primary-ink font-bold',
    },
    ACCEPTED: {
      label: 'جاري التجهيز',
      classes: 'bg-primary-soft text-primary-ink font-bold',
    },
    rejected: {
      label: 'مرفوض',
      classes: 'bg-danger-soft text-danger',
    },
    REJECTED: {
      label: 'مرفوض',
      classes: 'bg-danger-soft text-danger',
    },
    picked_up: {
      label: 'تم الاستلام',
      classes: 'bg-accent-soft text-accent',
    },
    COMPLETED: {
      label: 'تم الاستلام',
      classes: 'bg-accent-soft text-accent',
    },
    CANCELLED: {
      label: 'ملغي',
      classes: 'bg-canvas border border-line text-ink-soft',
    },
    EXPIRED: {
      label: 'منتهي',
      classes: 'bg-canvas border border-line text-ink-soft',
    },
    no_show: {
      label: 'لم يحضر',
      classes: 'bg-danger-soft text-danger',
    },
    NO_SHOW: {
      label: 'لم يحضر',
      classes: 'bg-danger-soft text-danger',
    },
  };

  const config = configs[status] || configs.pending;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-body font-semibold whitespace-nowrap transition-colors',
        config.classes,
        className
      )}
    >
      {customLabel || config.label}
    </span>
  );
};

import React from 'react';
import { cn } from '@/lib/utils';

export interface StatusPillProps {
  status: 'open' | 'closed' | 'preparing' | 'ready' | 'pending' | 'accepted' | 'rejected' | 'picked_up' | 'no_show';
  customLabel?: string;
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  customLabel,
  className,
}) => {
  const configs = {
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
    preparing: {
      label: 'جاري التجهيز',
      classes: 'bg-primary-soft text-primary-ink font-bold',
    },
    pending: {
      label: 'في الانتظار',
      classes: 'bg-primary-soft text-primary-ink',
    },
    accepted: {
      label: 'مقبول',
      classes: 'bg-accent-soft text-accent',
    },
    rejected: {
      label: 'مرفوض',
      classes: 'bg-danger-soft text-danger',
    },
    picked_up: {
      label: 'تم الاستلام',
      classes: 'bg-accent-soft text-accent',
    },
    no_show: {
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

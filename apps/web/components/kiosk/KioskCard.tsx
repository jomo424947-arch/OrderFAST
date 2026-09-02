import React from 'react';
import Link from 'next/link';
import { Kiosk } from '@/types';
import { StatusPill } from '@/components/ui/StatusPill';
import { Store, Clock } from 'lucide-react';
import { formatWaitTime } from '@/lib/formatters';

export interface KioskCardProps {
  kiosk: Kiosk;
}

export const KioskCard: React.FC<KioskCardProps> = React.memo(({ kiosk }) => {
  return (
    <Link
      href={`/student/kiosks/${kiosk.id}`}
      className="group flex items-center justify-between p-3.5 bg-surface hover:bg-white border border-line/70 hover:border-line rounded-2xl transition-all duration-200 shadow-warm hover:shadow-md cursor-pointer select-none"
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Kiosk Icon Badge */}
        <div className="w-11 h-11 rounded-xl bg-accent-soft text-accent flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
          <Store className="w-5 h-5" />
        </div>

        {/* Info */}
        <div className="min-w-0">
          <h4 className="font-body font-bold text-sm text-ink truncate mb-0.5 group-hover:text-primary-ink transition-colors">
            {kiosk.name}
          </h4>
          <p className="font-body text-xs text-ink-soft truncate">
            {kiosk.collegeLocation} · {kiosk.category}
          </p>
        </div>
      </div>

      {/* Side Status & Wait Time */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0 mr-3">
        <StatusPill status={kiosk.isOpen ? 'open' : 'closed'} />
        {kiosk.isOpen && (
          <span className="flex items-center gap-1 font-mono text-xs text-ink-soft font-semibold">
            <Clock className="w-3 h-3 text-ink-soft" />
            {formatWaitTime(kiosk.estimatedWaitMins)}
          </span>
        )}
      </div>
    </Link>
  );
});

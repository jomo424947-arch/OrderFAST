import React from 'react';
import Link from 'next/link';
import { useKioskStore } from '@/stores/useKioskStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { Bell, Volume2, Store, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CashierHeader: React.FC = () => {
  const { activeKioskId, kiosks, toggleKioskOpen, setActiveKioskId } = useKioskStore();
  const { getUnreadCount } = useNotificationStore();
  const unreadCount = getUnreadCount('cashier');

  const currentKiosk = kiosks.find((k) => k.id === activeKioskId) || kiosks[0];

  return (
    <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-line px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
      {/* Mobile Title & Kiosk Switcher */}
      <div className="flex items-center gap-3">
        <div className="lg:hidden">
          <p className="font-display font-bold text-base text-ink">{currentKiosk.name}</p>
          <p className="text-[10px] font-body text-ink-soft">لوحة الكاشير</p>
        </div>

        {/* Desktop Quick Kiosk Selector */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-body text-ink-soft">الكشك النشط:</span>
          <select
            value={activeKioskId}
            onChange={(e) => setActiveKioskId(e.target.value)}
            className="bg-canvas border border-line rounded-lg px-2.5 py-1 text-xs font-body font-semibold text-ink focus:outline-none focus:border-primary cursor-pointer"
          >
            {kiosks.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name} ({k.collegeLocation})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Controls: Open/Close Switch, Notification Bell, Audio alert toggle */}
      <div className="flex items-center gap-3">
        {/* Kiosk Open / Closed Status Toggle Button */}
        <button
          type="button"
          onClick={() => toggleKioskOpen(currentKiosk.id)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-bold border transition-all duration-200 shadow-sm',
            currentKiosk.isOpen
              ? 'bg-accent-soft text-accent border-accent/30 hover:bg-accent-soft/80'
              : 'bg-danger-soft text-danger border-danger/30 hover:bg-danger-soft/80'
          )}
        >
          <span
            className={cn(
              'w-2 h-2 rounded-full',
              currentKiosk.isOpen ? 'bg-accent animate-pulse' : 'bg-danger'
            )}
          />
          <span>{currentKiosk.isOpen ? 'الكشك مفتوح لاستقبال الطلبات' : 'الكشك مغلق مؤقتاً'}</span>
        </button>

        {/* Notifications */}
        <Link
          href="/kiosk/notifications"
          className="relative w-9 h-9 rounded-full bg-canvas border border-line flex items-center justify-center text-ink hover:bg-line/30 transition-colors"
          aria-label="التنبيهات"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-danger ring-2 ring-surface" />
          )}
        </Link>
      </div>
    </header>
  );
};

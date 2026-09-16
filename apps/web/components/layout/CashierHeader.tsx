import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useKioskStore } from '@/stores/useKioskStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Bell, Store, LogOut } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

export const CashierHeader: React.FC = () => {
  const router = useRouter();
  const { activeKioskId, kiosks, toggleKioskOpen, setActiveKioskId } = useKioskStore();
  const { cashier, logout } = useAuthStore();
  const { getUnreadCount } = useNotificationStore();
  const unreadCount = getUnreadCount('cashier');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const assignedKiosks = cashier?.staffAssignments && cashier.staffAssignments.length > 0
    ? cashier.staffAssignments
    : [];

  const currentKiosk =
    kiosks.find((k) => k.id === activeKioskId) ||
    (assignedKiosks.length > 0
      ? {
          id: assignedKiosks[0].kioskId,
          name: assignedKiosks[0].kioskName,
          isOpen: assignedKiosks[0].kioskIsOpen,
          collegeLocation: assignedKiosks[0].kioskLocation,
        }
      : {
          id: cashier?.kioskId || activeKioskId,
          name: cashier?.kioskName || 'الكشك المخصص',
          isOpen: true,
          collegeLocation: cashier?.college || '',
        });

  return (
    <>
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-line px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Mobile Title & Kiosk Identity */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="lg:hidden min-w-0">
            <p className="font-display font-bold text-sm sm:text-base text-ink truncate">{currentKiosk.name}</p>
            <p className="text-[10px] font-body text-ink-soft truncate">
              {currentKiosk.collegeLocation ? `${currentKiosk.collegeLocation} · ` : ''}لوحة الكاشير
            </p>
          </div>

          {/* Desktop Assigned Kiosk Identity Badge / Multi-assignment Switcher */}
          <div className="hidden sm:flex items-center gap-2">
            {assignedKiosks.length > 1 ? (
              <div className="flex items-center gap-2 bg-canvas px-3 py-1.5 rounded-xl border border-line">
                <Store className="w-4 h-4 text-accent" />
                <span className="text-xs font-body text-ink-soft">الكشك النشط:</span>
                <select
                  value={activeKioskId}
                  onChange={(e) => setActiveKioskId(e.target.value)}
                  className="bg-transparent border-none text-xs font-body font-bold text-ink focus:outline-none cursor-pointer"
                >
                  {assignedKiosks.map((k) => (
                    <option key={k.kioskId} value={k.kioskId}>
                      {k.kioskName} ({k.kioskLocation})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-canvas px-3 py-1.5 rounded-xl border border-line shadow-xs">
                <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                  <Store className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-body font-bold text-ink">{currentKiosk.name}</span>
                  {currentKiosk.collegeLocation && (
                    <span className="text-[11px] font-body text-ink-soft">({currentKiosk.collegeLocation})</span>
                  )}
                </div>
                <span className="text-[10px] font-body font-semibold px-2 py-0.5 rounded-full bg-line/60 text-ink-soft mr-1">
                  كشك مخصص
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Controls: Open/Close Switch, Notification Bell, Mobile Logout */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Kiosk Open / Closed Status Toggle Button */}
          <button
            type="button"
            onClick={() => toggleKioskOpen(currentKiosk.id)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-body font-bold border transition-all duration-200 shadow-sm',
              currentKiosk.isOpen
                ? 'bg-accent-soft text-accent border-accent/30 hover:bg-accent-soft/80'
                : 'bg-danger-soft text-danger border-danger/30 hover:bg-danger-soft/80'
            )}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full shrink-0',
                currentKiosk.isOpen ? 'bg-accent animate-pulse' : 'bg-danger'
              )}
            />
            <span className="hidden sm:inline">
              {currentKiosk.isOpen ? 'الكشك مفتوح لاستقبال الطلبات' : 'الكشك مغلق مؤقتاً'}
            </span>
            <span className="sm:hidden text-[11px]">
              {currentKiosk.isOpen ? 'مفتوح' : 'مغلق'}
            </span>
          </button>

          {/* Notifications */}
          <Link
            href="/kiosk/notifications"
            className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-canvas border border-line flex items-center justify-center text-ink hover:bg-line/30 transition-colors"
            aria-label="التنبيهات"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-danger ring-2 ring-surface" />
            )}
          </Link>

          {/* Mobile Logout Button */}
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-danger-soft text-danger border border-danger/20 flex items-center justify-center hover:bg-danger hover:text-white transition-colors lg:hidden"
            title="تسجيل الخروج"
            aria-label="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <Modal
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          title="تأكيد تسجيل الخروج"
          maxWidth="sm"
        >
          <div className="space-y-4 text-center pt-2">
            <div className="w-12 h-12 rounded-2xl bg-danger-soft text-danger flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <p className="font-display font-bold text-base text-ink">
                هل ترغب في تسجيل الخروج؟
              </p>
              <p className="font-body text-xs text-ink-soft mt-1">
                سيتم إنهاء جلستك لكاشير ({cashier?.name || 'الكاشير'})
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-line text-ink font-body text-xs font-bold hover:bg-canvas transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2.5 px-4 rounded-xl bg-danger text-white font-body text-xs font-bold hover:bg-danger/90 transition-colors shadow-sm"
              >
                تأكيد الخروج
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

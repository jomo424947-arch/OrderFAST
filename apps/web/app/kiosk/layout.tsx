'use client';

import React, { useEffect } from 'react';
import { CashierSidebar } from '@/components/layout/CashierSidebar';
import { CashierHeader } from '@/components/layout/CashierHeader';
import { CashierBottomNav } from '@/components/layout/CashierBottomNav';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useOrderStore } from '@/stores/useOrderStore';
import { useKioskStore } from '@/stores/useKioskStore';
import { Store } from 'lucide-react';
import { Button } from '@/components/ui/Button';

import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';

export default function CashierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { cashier, logout } = useAuthStore();
  const { startKioskPolling } = useOrderStore();
  const { activeKioskId, fetchKiosks } = useKioskStore();
  const { startNotificationsPolling } = useNotificationStore();

  useEffect(() => {
    fetchKiosks();
  }, [fetchKiosks]);

  // Real-time live polling for incoming & active kiosk orders (every 3s)
  useEffect(() => {
    if (!activeKioskId) return;
    const cleanupOrders = startKioskPolling(activeKioskId, 3000);
    const cleanupNotifs = startNotificationsPolling(cashier?.id, 'cashier', 8000);

    return () => {
      cleanupOrders();
      cleanupNotifs();
    };
  }, [activeKioskId, cashier?.id, startKioskPolling, startNotificationsPolling]);

  // If cashier is not assigned to any kiosk yet
  if (cashier && !cashier.kioskId) {
    return (
      <RoleGuard allowedRole="cashier">
        <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface border border-line rounded-3xl p-8 text-center space-y-5 shadow-floating animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-3xl bg-primary-soft text-primary-ink flex items-center justify-center mx-auto">
              <Store className="w-8 h-8" />
            </div>

            <div>
              <h2 className="font-display font-bold text-2xl text-ink">
                مرحباً بك {cashier.name}! 👋
              </h2>
              <p className="font-body text-xs text-ink-soft mt-1">
                {cashier.email} {cashier.phone ? `· ${cashier.phone}` : ''}
              </p>
            </div>

            <div className="bg-canvas border border-line rounded-2xl p-4 text-xs font-body text-ink-soft leading-relaxed text-right space-y-2">
              <p className="font-bold text-ink flex items-center gap-1.5">
                <span>⏳</span>
                <span>حسابك بانتظار التعيين لكشك</span>
              </p>
              <p>
                تم إنشاء حسابك كموظف كاشير بنجاح، ولم يتم ربطك بكشك أو كافيه حتى الآن من قِبل إدارة النظام.
              </p>
              <p className="text-[11px] text-ink-soft pt-1 border-t border-line/60">
                بمجرد أن يقوم الأدمن بتعيينك للكشك من لوحة الإدارة، سيتم تفعيل شاشة الكاشير الخاصة بك تلقائياً.
              </p>
            </div>

            <Button
              variant="outline"
              size="md"
              onClick={logout}
              className="w-full"
            >
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRole="cashier">
      <div className="min-h-screen bg-canvas flex flex-col lg:flex-row">
        {/* Desktop Sidebar */}
        <CashierSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <CashierHeader />

          <main className="flex-1 p-4 sm:p-6 max-w-5xl w-full mx-auto pb-24 lg:pb-12">
            {children}
          </main>

          {/* Mobile Bottom Navigation Bar */}
          <CashierBottomNav />
        </div>
      </div>
    </RoleGuard>
  );
}

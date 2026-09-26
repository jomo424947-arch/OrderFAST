'use client';

import React, { useEffect } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { AdminBottomNav } from '@/components/layout/AdminBottomNav';
import { AdminDrawer } from '@/components/layout/AdminDrawer';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useOrderStore } from '@/stores/useOrderStore';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { admin } = useAuthStore();
  const { startNotificationsPolling } = useNotificationStore();
  const { startAdminOrdersPolling } = useOrderStore();

  useEffect(() => {
    const unsubNotifs = startNotificationsPolling(admin?.id, 'admin', 8000);
    const unsubOrders = startAdminOrdersPolling(8000);

    return () => {
      unsubNotifs();
      unsubOrders();
    };
  }, [admin?.id, startNotificationsPolling, startAdminOrdersPolling]);
  return (
    <RoleGuard allowedRole="admin">
      <div className="min-h-screen bg-canvas flex flex-col lg:flex-row">
        {/* Desktop Sidebar */}
        <AdminSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader />

          <main className="flex-1 p-3.5 sm:p-6 max-w-5xl w-full mx-auto pb-24 lg:pb-12">
            {children}
          </main>

          {/* Mobile Bottom Navigation Bar & Drawer */}
          <AdminBottomNav />
          <AdminDrawer />
        </div>
      </div>
    </RoleGuard>
  );
}

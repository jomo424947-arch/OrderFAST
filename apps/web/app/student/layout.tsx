'use client';

import React, { useEffect } from 'react';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { StudentHeader } from '@/components/layout/StudentHeader';
import { StudentBottomNav } from '@/components/layout/StudentBottomNav';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useNotificationStore } from '@/stores/useNotificationStore';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { student } = useAuthStore();
  const { startStudentOrdersPolling } = useOrderStore();
  const { startNotificationsPolling } = useNotificationStore();

  useEffect(() => {
    const cleanupOrders = startStudentOrdersPolling(student?.id, 5000);
    const cleanupNotifs = startNotificationsPolling(student?.id, 'student', 8000);

    return () => {
      cleanupOrders();
      cleanupNotifs();
    };
  }, [student?.id, startStudentOrdersPolling, startNotificationsPolling]);
  return (
    <RoleGuard allowedRole="student">
      <div className="min-h-screen bg-canvas flex flex-col lg:flex-row">
        {/* Desktop Sidebar */}
        <StudentSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <StudentHeader />
          <main className="flex-1 p-4 sm:p-6 max-w-5xl w-full mx-auto pb-24 lg:pb-12">
            {children}
          </main>
          <StudentBottomNav />
        </div>
      </div>
    </RoleGuard>
  );
}

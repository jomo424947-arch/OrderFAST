'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserRole } from '@/types';

interface RoleGuardProps {
  allowedRole: UserRole;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRole, children }) => {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for zustand persist rehydration before making decisions
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated || role !== allowedRole) {
      router.replace('/auth/login');
    }
  }, [isHydrated, isAuthenticated, role, allowedRole, router]);

  // Before hydration or while redirecting, show a minimal loading state
  if (!isHydrated || !isAuthenticated || role !== allowedRole) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-body text-xs text-ink-soft">جاري التحقق...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

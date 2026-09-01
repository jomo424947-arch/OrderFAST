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
  const { isAuthenticated, role, isAuthInitialized, initializeAuth } = useAuthStore();

  // Sync auth state with backend token
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isAuthInitialized) return;

    if (!isAuthenticated || role !== allowedRole) {
      router.replace('/auth/login');
    }
  }, [isAuthInitialized, isAuthenticated, role, allowedRole, router]);

  // Before auth check completes or if unauthorized, show loading screen
  if (!isAuthInitialized || !isAuthenticated || role !== allowedRole) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-body text-xs text-ink-soft">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

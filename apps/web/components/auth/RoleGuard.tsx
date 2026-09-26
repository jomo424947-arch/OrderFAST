'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserRole } from '@/types';
import { LogIn, ArrowLeft } from 'lucide-react';

interface RoleGuardProps {
  allowedRole: UserRole;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRole, children }) => {
  const router = useRouter();
  const { isAuthenticated, role, isAuthInitialized, initializeAuth } = useAuthStore();
  const [hasTimeout, setHasTimeout] = useState(false);

  // Sync auth state with backend token on first load only
  useEffect(() => {
    if (!isAuthInitialized) {
      initializeAuth();
    }
  }, [isAuthInitialized, initializeAuth]);

  // Max 2.5s safety timeout to prevent hanging indefinitely on poor network
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasTimeout(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isAuthInitialized && !hasTimeout) return;

    if (!isAuthenticated || role !== allowedRole) {
      router.replace('/auth/login');
    }
  }, [isAuthInitialized, hasTimeout, isAuthenticated, role, allowedRole, router]);

  // 1. Optimistic / Cached: If the user is already authenticated with the required role in their persistent session,
  // allow rendering immediately! Do not block with a blank white screen.
  if (isAuthenticated && role === allowedRole) {
    return <>{children}</>;
  }

  // 2. If timed out and not authorized, offer immediate login prompt and button
  if (hasTimeout && (!isAuthenticated || role !== allowedRole)) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-surface border border-line rounded-3xl p-6 text-center shadow-warm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary-ink flex items-center justify-center mx-auto">
            <LogIn className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-ink">يلزم تسجيل الدخول</h3>
            <p className="font-body text-xs text-ink-soft mt-1">
              لم يتم العثور على جلسة نشطة، يرجى تسجيل الدخول للمتابعة
            </p>
          </div>
          <Link
            href="/auth/login"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-primary-ink font-body font-bold text-xs shadow-sm hover:opacity-95 transition-opacity"
          >
            <span>الانتقال لصفحة تسجيل الدخول</span>
            <ArrowLeft className="w-4 h-4 mr-1" />
          </Link>
        </div>
      </div>
    );
  }

  // 3. Loading screen while verifying for the first time
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="font-body text-xs text-ink-soft">جاري التحقق من الصلاحيات...</p>
      </div>
    </div>
  );
};

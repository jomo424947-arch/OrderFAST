'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { hasSeenIntro } from '@/lib/utils/introStorage';
import { UserRole } from '@/types';

const ROLE_REDIRECT: Record<UserRole, string> = {
  student: '/student',
  cashier: '/kiosk',
  admin: '/admin',
};

export function StartupGateway({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isAuthInitialized, role, initializeAuth } = useAuthStore();
  const [isClient, setIsClient] = useState(false);
  const [shouldRenderLanding, setShouldRenderLanding] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (!isAuthInitialized) {
      initializeAuth();
    }
  }, [isAuthInitialized, initializeAuth]);

  useEffect(() => {
    if (!isClient || !isAuthInitialized) return;

    const isNative =
      (window as any).Capacitor?.isNativePlatform?.() ||
      navigator.userAgent.includes('FastOrder-Android');

    const seenIntro = hasSeenIntro();

    // 1. First-launch flow: If user hasn't seen intro yet -> route to Intro
    if (!seenIntro) {
      router.replace('/onboarding');
      return;
    }

    // 2. Authenticated flow: If user is logged in -> route directly to Home
    if (isAuthenticated) {
      const target = ROLE_REDIRECT[role || 'student'] || '/student';
      router.replace(target);
      return;
    }

    // 3. Returning logged-out flow:
    // If native mobile app -> route to Login
    if (isNative) {
      router.replace('/auth/login');
      return;
    }

    // On standard desktop browser: show the marketing landing page
    setShouldRenderLanding(true);
  }, [isClient, isAuthInitialized, isAuthenticated, role, router]);

  // While evaluating or redirecting, render the warm brand canvas
  // to ensure 100% smooth visual transition.
  if (!isClient || !isAuthInitialized || !shouldRenderLanding) {
    return <div className="fixed inset-0 bg-canvas" />;
  }

  return <>{children}</>;
}

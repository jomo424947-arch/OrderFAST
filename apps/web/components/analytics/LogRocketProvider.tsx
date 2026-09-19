'use client';

import { useEffect } from 'react';
import LogRocket from 'logrocket';
import { useAuthStore } from '@/stores/useAuthStore';

const LOGROCKET_APP_ID = process.env.NEXT_PUBLIC_LOGROCKET_APP_ID || 'v2nuuj/fastorder';

export function LogRocketProvider() {
  const user = useAuthStore((state) => state.student || state.cashier || state.admin);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      LogRocket.init(LOGROCKET_APP_ID);
    } catch (err) {
      console.warn('[LogRocket] Initialization failed:', err);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isAuthenticated && user?.id) {
      try {
        LogRocket.identify(user.id, {
          name: user.name || 'Anonymous User',
          email: user.email || '',
          role: user.role || '',
          college: user.college || '',
        });
      } catch (err) {
        console.warn('[LogRocket] Identify failed:', err);
      }
    }
  }, [isAuthenticated, user]);

  return null;
}

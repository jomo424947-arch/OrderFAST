'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AuthRedirectHandler() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;
      if (
        hash.includes('type=signup') ||
        hash.includes('access_token') ||
        search.includes('verified=true')
      ) {
        router.replace('/auth/login?verified=true');
      }
    }
  }, [router]);

  return null;
}

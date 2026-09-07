'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { tokenStorage } from '@/lib/api/client';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * Handles incoming deep links (e.g. fastorder://auth/callback) in Capacitor native Android.
 * Bulletproof implementation: completely isolated with try/catch to guarantee zero UI crashes.
 */
export function CapacitorDeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isSubscribed = true;
    let appUrlListenerRemove: (() => void) | null = null;

    async function handleAuthUrl(rawUrl: string) {
      if (!isSubscribed || !rawUrl) return;

      try {
        console.log('[FastOrder DeepLink] Received URL:', rawUrl);

        // Verify this is an auth callback link
        if (!rawUrl.includes('auth/callback')) return;

        // 1. Close in-app Chrome Custom Tab if open
        try {
          const capacitorBrowser = (window as any).Capacitor?.Plugins?.Browser;
          if (capacitorBrowser?.close) {
            await capacitorBrowser.close();
          }
        } catch (err) {
          console.warn('[FastOrder DeepLink] Could not close browser tab:', err);
        }

        // 2. Extract params from hash or query
        let paramsString = '';
        if (rawUrl.includes('#')) {
          paramsString = rawUrl.substring(rawUrl.indexOf('#') + 1);
        } else if (rawUrl.includes('?')) {
          paramsString = rawUrl.substring(rawUrl.indexOf('?') + 1);
        }

        const params = new URLSearchParams(paramsString);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const code = params.get('code');
        const errorDesc = params.get('error_description') || params.get('error');

        if (errorDesc) {
          console.error('[FastOrder DeepLink] Auth error:', errorDesc);
          router.replace(`/auth/login?error=${encodeURIComponent(errorDesc)}`);
          return;
        }

        // Case A: Implicit / Token flow (tokens directly in URL)
        if (accessToken && refreshToken) {
          console.log('[FastOrder DeepLink] Establishing session from tokens...');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('[FastOrder DeepLink] setSession error:', error);
            router.replace('/auth/login?error=session_failed');
            return;
          }

          if (data.session && isSubscribed) {
            tokenStorage.setTokens(data.session.access_token, data.session.refresh_token);
            const syncResult = await useAuthStore.getState().syncOAuthUser();
            if (syncResult.isNewUser) {
              router.replace('/auth/callback');
            } else {
              router.replace('/student');
            }
          }
          return;
        }

        // Case B: PKCE authorization code flow
        if (code) {
          console.log('[FastOrder DeepLink] Exchanging code for session...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('[FastOrder DeepLink] exchangeCode error:', error);
            router.replace('/auth/login?error=code_exchange_failed');
            return;
          }

          if (data.session && isSubscribed) {
            tokenStorage.setTokens(data.session.access_token, data.session.refresh_token);
            const syncResult = await useAuthStore.getState().syncOAuthUser();
            if (syncResult.isNewUser) {
              router.replace('/auth/callback');
            } else {
              router.replace('/student');
            }
          }
        }
      } catch (err) {
        console.error('[FastOrder DeepLink] Unexpected processing error:', err);
      }
    }

    // Defensive initialization: guarantees this hook NEVER throws or crashes React
    try {
      const capacitor = (window as any).Capacitor;
      const isCapacitor = Boolean(capacitor);

      if (isCapacitor) {
        const appPlugin = capacitor.Plugins?.App;

        if (appPlugin && typeof appPlugin.addListener === 'function') {
          try {
            const listenerResult = appPlugin.addListener('appUrlOpen', (event: { url: string }) => {
              if (event?.url) {
                handleAuthUrl(event.url);
              }
            });

            // Handle both Promise return (modern Capacitor) and synchronous handle return
            if (listenerResult && typeof listenerResult.then === 'function') {
              listenerResult
                .then((handle: any) => {
                  if (handle?.remove) {
                    appUrlListenerRemove = () => {
                      try {
                        handle.remove();
                      } catch {
                        // ignore cleanup errors
                      }
                    };
                  }
                })
                .catch((e: any) => {
                  console.warn('[FastOrder DeepLink] addListener promise error:', e);
                });
            } else if (listenerResult?.remove) {
              appUrlListenerRemove = () => {
                try {
                  listenerResult.remove();
                } catch {
                  // ignore cleanup errors
                }
              };
            }
          } catch (listenerErr) {
            console.warn('[FastOrder DeepLink] Could not register appUrlOpen listener:', listenerErr);
          }

          // Check if cold-started with a launch URL
          if (typeof appPlugin.getLaunchUrl === 'function') {
            try {
              const launchResult = appPlugin.getLaunchUrl();
              if (launchResult && typeof launchResult.then === 'function') {
                launchResult
                  .then((launchData: { url?: string } | null) => {
                    if (launchData?.url) {
                      handleAuthUrl(launchData.url);
                    }
                  })
                  .catch((e: any) => {
                    console.warn('[FastOrder DeepLink] getLaunchUrl promise error:', e);
                  });
              }
            } catch (launchErr) {
              console.warn('[FastOrder DeepLink] Could not check launch URL:', launchErr);
            }
          }
        }
      }

      // Also listen to standard window custom events for maximum compatibility
      const windowListener = (e: any) => {
        const url = e?.detail?.url || e?.url;
        if (url) {
          handleAuthUrl(url);
        }
      };
      window.addEventListener('appUrlOpen', windowListener);

      return () => {
        isSubscribed = false;
        window.removeEventListener('appUrlOpen', windowListener);
        if (appUrlListenerRemove) {
          try {
            appUrlListenerRemove();
          } catch {
            // ignore
          }
        }
      };
    } catch (outerErr) {
      console.warn('[FastOrder DeepLink] Setup failed safely:', outerErr);
      return () => {
        isSubscribed = false;
      };
    }
  }, [router]);

  return null;
}

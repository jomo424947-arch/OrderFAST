'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { tokenStorage } from '@/lib/api/client';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * Handles incoming deep links (e.g. fastorder://auth/callback) in Capacitor native Android.
 * Automatically exchanges or stores auth tokens and redirects to the student dashboard.
 */
export function CapacitorDeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isSubscribed = true;

    async function handleAuthUrl(rawUrl: string) {
      if (!rawUrl) return;
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

      try {
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

          if (data.session) {
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

          if (data.session) {
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

    // Connect to Capacitor App plugin
    const appPlugin = (window as any).Capacitor?.Plugins?.App;

    let appUrlListenerRemove: (() => void) | null = null;

    if (appPlugin?.addListener) {
      appPlugin.addListener('appUrlOpen', (event: { url: string }) => {
        if (isSubscribed) {
          handleAuthUrl(event.url);
        }
      }).then((handle: any) => {
        if (handle?.remove) {
          appUrlListenerRemove = () => handle.remove();
        }
      }).catch((e: any) => {
        console.warn('[FastOrder DeepLink] addListener error:', e);
      });

      // Check if app was opened via launch URL (when cold-started from browser intent)
      if (appPlugin.getLaunchUrl) {
        appPlugin.getLaunchUrl().then((launchUrlData: { url?: string } | null) => {
          if (isSubscribed && launchUrlData?.url) {
            handleAuthUrl(launchUrlData.url);
          }
        }).catch((e: any) => {
          console.warn('[FastOrder DeepLink] getLaunchUrl error:', e);
        });
      }
    }

    return () => {
      isSubscribed = false;
      if (appUrlListenerRemove) {
        appUrlListenerRemove();
      }
    };
  }, [router]);

  return null;
}

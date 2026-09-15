import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let browserClient: SupabaseClient | null = null;

/**
 * Returns a singleton Supabase client for browser-side usage.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;

  // Clean and sanitize env variables to prevent 401s from quotes or spaces in Vercel
  const cleanUrl = supabaseUrl.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  const cleanKey = supabaseAnonKey.trim().replace(/^['"]|['"]$/g, '');

  const effectiveUrl = cleanUrl || 'https://placeholder.supabase.co';
  const effectiveKey = cleanKey || 'placeholder-anon-key';

  if (!cleanUrl || !cleanKey) {
    if (typeof window !== 'undefined') {
      console.warn(
        'Supabase URL or Anon Key is missing. Please check your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
      );
    }
  }

  browserClient = createClient(effectiveUrl, effectiveKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}

export const supabase = getSupabaseBrowserClient();

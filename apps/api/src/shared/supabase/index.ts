import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../../config/env.js';

let supabaseClient: SupabaseClient | null = null;
let supabaseAdminClient: SupabaseClient | null = null;

/**
 * Standard Supabase client (using anon key) for user-scoped operations
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

export const getSupabaseClient = getSupabase;

/**
 * Admin Supabase client (using service role key) for privileged operations (user verification, admin creation)
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseAdminClient;
}

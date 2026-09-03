import { getSupabase, getSupabaseAdmin } from '../apps/api/src/shared/supabase/index.js';

async function testSupabase() {
  console.log('Testing Supabase Auth & REST API...');
  const supabaseAdmin = getSupabaseAdmin();
  const supabase = getSupabase();

  try {
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    if (userError) {
      console.error('❌ Supabase Admin listUsers error:', userError.message);
    } else {
      console.log('✅ Supabase Admin Auth connected successfully! Total users:', users.users.length);
    }
  } catch (err: any) {
    console.error('❌ Supabase Admin Auth exception:', err.message);
  }
}

testSupabase();

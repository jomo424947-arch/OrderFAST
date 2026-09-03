import { getSupabaseAdmin, getSupabase } from '../apps/api/src/shared/supabase/index.js';

async function checkRest() {
  const admin = getSupabaseAdmin();
  const res = await admin.from('profiles').select('*').limit(1);
  console.log('REST Query profiles:', res);

  const resKiosks = await admin.from('kiosks').select('*').limit(1);
  console.log('REST Query kiosks:', resKiosks);
}

checkRest().catch(console.error);

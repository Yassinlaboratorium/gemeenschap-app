import { createClient } from '@supabase/supabase-js'

// Omzeilt RLS volledig — alleen gebruiken in server-side routes (webhooks, etc.)
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey || serviceKey === 'VULL_IN_UIT_SUPABASE_DASHBOARD') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY ontbreekt in .env.local')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false } }
  )
}

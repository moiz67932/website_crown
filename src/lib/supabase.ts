import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Server-side Supabase client. We prefer service role key for insert/update to bypass RLS for now
// (You can later enable RLS and add policies for table access.)
// Falls back to anon key (read-only) if service role not set.

let supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL
  if (!url) return null
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!key) return null
  if (!supabase) {
    supabase = createClient(url, key, {
      auth: { persistSession: false },
    })
  }
  return supabase
}

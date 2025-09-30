import { createClient } from '@supabase/supabase-js'

// SERVER: service role (NEVER import in client components)
export function supaServer() {
  const url = process.env.SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !service) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, service, { auth: { persistSession: false } })
}

// BROWSER: public anon (must use NEXT_PUBLIC_*)
export function supaBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  return createClient(url, anon)
}

// SERVER (read-only public): prefer anon key for publicly exposable data (safer than service role)
export function supaPublic() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    throw new Error('Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  return createClient(url, anon, { auth: { persistSession: false } })
}

// Backwards-compatible alias used in other parts of the codebase
export function getSupabase() {
  return supaServer()
}

// Dev-only guard: ensure both URLs point to the same project
if (process.env.NODE_ENV !== 'production') {
  const a = process.env.SUPABASE_URL
  const b = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (a && b && a !== b) {
    console.warn('[supabase] URL mismatch dev warning:', { SUPABASE_URL: a, NEXT_PUBLIC_SUPABASE_URL: b })
  }
}

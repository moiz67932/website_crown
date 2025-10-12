import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function cinfo(msg: string, ...args: any[]) { console.log('\x1b[36m%s\x1b[0m', msg, ...args) }
function cwarn(msg: string, ...args: any[]) { console.warn('\x1b[33m%s\x1b[0m', msg, ...args) }
function cerror(msg: string, ...args: any[]) { console.error('\x1b[31m%s\x1b[0m', msg, ...args) }

// SERVER: service role (NEVER import in client components)
export function supaServer() {
  const url = process.env.SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !service) {
    cerror('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  cinfo('🌐 [Supabase] Creating server (service-role) client...')
  console.log('🔍 ENV CHECK 1111111111');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY prefix:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10));

  return createClient(url, service, { auth: { persistSession: false } })
}

// BROWSER: public anon (must use NEXT_PUBLIC_*)
export function supaBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    cerror('❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  cinfo('🌐 [Supabase] Creating browser (anon) client...')
  console.log('🔍 ENV CHECK 22222222');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY prefix:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10));

  return createClient(url, anon)
}

// SERVER (read-only public): prefer anon key for publicly exposable data (safer than service role)
export function supaPublic() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    cerror('❌ Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY')
    throw new Error('Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  cinfo('🌐 [Supabase] Creating public (anon) server client...')
  console.log('🔍 ENV CHECK 33333333');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY prefix:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10));

  return createClient(url, anon, { auth: { persistSession: false } })
}

// Backwards-compatible alias used in other parts of the codebase with singleton + basic retry
let _supabaseSingleton: SupabaseClient | null = null
export function getSupabase(): SupabaseClient {
  if (_supabaseSingleton) return _supabaseSingleton
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    cerror('❌ Supabase env vars missing. Cannot connect.')
    throw new Error('Supabase env missing')
  }
  cinfo('🌐 [Supabase] Connecting to:', url)
  console.log('🔍 ENV CHECK 4444');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY prefix:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10));

  // Basic retry around client creation in case of transient issues (rare)
  const maxAttempts = 3
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      _supabaseSingleton = createClient(url, key, { auth: { persistSession: false } })
      cinfo('✅ [Supabase] Client initialized (singleton).')
      break
    } catch (e: any) {
      cwarn(`⚠️ [Supabase] createClient failed (attempt ${attempt}/${maxAttempts})`, e?.message || String(e))
      if (attempt === maxAttempts) {
        cerror('❌ [Supabase] Failed to initialize client after retries.')
        throw e
      }
    }
  }
  return _supabaseSingleton!
}

// Dev-only guard: ensure both URLs point to the same project
if (process.env.NODE_ENV !== 'production') {
  const a = process.env.SUPABASE_URL
  const b = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (a && b && a !== b) {
    cwarn('[supabase] URL mismatch dev warning:', { SUPABASE_URL: a, NEXT_PUBLIC_SUPABASE_URL: b })
  }
}

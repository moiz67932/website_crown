import { createClient } from '@supabase/supabase-js'

function cinfo(msg: string, ...args: any[]) {
  // Cyan
  // eslint-disable-next-line no-console
  console.log('\x1b[36m%s\x1b[0m', msg, ...args)
}

function cwarn(msg: string, ...args: any[]) {
  // Yellow
  // eslint-disable-next-line no-console
  console.warn('\x1b[33m%s\x1b[0m', msg, ...args)
}

function cerror(msg: string, ...args: any[]) {
  // Red
  // eslint-disable-next-line no-console
  console.error('\x1b[31m%s\x1b[0m', msg, ...args)
}

export type DebugInitOptions = {
  /** Force URL and KEY to override envs (used for tests). Never log their raw values. */
  url?: string
  key?: string
  /** Optional client options to pass-through. */
  options?: Parameters<typeof createClient>[2]
}

/**
 * Initialize a Supabase ANON client with rich debug logs. Intended for browser or public read-only server paths.
 * Uses NEXT_PUBLIC_* envs by default.
 */
export function initSupabaseClient(opts: DebugInitOptions = {}): any | null {
  const url = opts.url || process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = opts.key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  cinfo('[Supabase Debug] Initializing anon client...')
  // Don't print secrets, only presence.
  // eslint-disable-next-line no-console
  console.log('   URL present:', !!url)
  // eslint-disable-next-line no-console
  console.log('   Key present:', !!anonKey)
  if (!url || !anonKey) {
    cerror('[Supabase Debug] Missing Supabase env vars! Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set (.env.local or Vercel).')
    return null
  }

  try {
  const supabase = createClient(url, anonKey, { auth: { persistSession: false }, ...opts.options })
  cinfo('✅ [Supabase Debug] Anon client initialized successfully.')
  return supabase as any
  } catch (e: any) {
    cerror('❌ [Supabase Debug] Failed to create anon client:', e?.message || String(e))
    return null
  }
}

/**
 * Initialize a Supabase SERVICE-ROLE client with rich debug logs. NEVER import in client components.
 */
export function initSupabaseAdminClient(opts: DebugInitOptions = {}): any | null {
  const url = opts.url || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = opts.key || process.env.SUPABASE_SERVICE_ROLE_KEY
  cinfo('[Supabase Debug] Initializing admin client...')
  // eslint-disable-next-line no-console
  console.log('   URL present:', !!url)
  // eslint-disable-next-line no-console
  console.log('   Service key present:', !!serviceKey)
  if (!url || !serviceKey) {
    cerror('[Supabase Debug] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Admin client cannot be created.')
    return null
  }

  try {
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false }, ...opts.options })
  cinfo('✅ [Supabase Debug] Admin client initialized successfully.')
  return supabase as any
  } catch (e: any) {
    cerror('❌ [Supabase Debug] Failed to create admin client:', e?.message || String(e))
    return null
  }
}

/** Basic structured log wrappers for queries */
export async function withQueryLogs<T>(label: string, details: Record<string, any>, fn: () => Promise<T>): Promise<T> {
  // eslint-disable-next-line no-console
  console.log('🧠 [Supabase Query Start]', { label, ...details })
  try {
    const result = await fn()
    // eslint-disable-next-line no-console
    console.log('✅ [Supabase Query Success]', { label })
    return result
  } catch (err: any) {
    cerror('❌ [Supabase Query Failed]', {
      label,
      message: err?.message,
      code: err?.code,
      details: err?.details,
      hint: err?.hint,
      stack: err?.stack,
    })
    throw err
  }
}

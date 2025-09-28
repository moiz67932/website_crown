import { supaServer } from './supabase'

// Runtime diagnostic to detect env drift / project mismatch.
export async function assertSameProjectOrThrow() {
  const a = process.env.SUPABASE_URL
  const b = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (a && b && a !== b) {
    throw new Error(`Supabase URL mismatch: SUPABASE_URL=${a} vs NEXT_PUBLIC_SUPABASE_URL=${b}`)
  }
  // Optionally could fetch a known lightweight table or run auth.admin check here.
  // Left minimal for performance; extend in specific routes if needed.
  return true
}

// Helper for register flow sanity: confirm auth user exists same project.
export async function ensureAuthUserExists(userId: string, opts: { retries?: number; delayMs?: number } = {}) {
  if (!userId) return false
  const client: any = supaServer()
  const retries = opts.retries ?? 3
  const delay = opts.delayMs ?? 120
  if (typeof client.auth?.admin?.getUserById === 'function') {
    for (let i = 0; i <= retries; i++) {
      const { data, error } = await client.auth.admin.getUserById(userId)
      if (!error && data?.user) return true
      if (error && !/user not found/i.test(error.message || '')) {
        // Unexpected error -> bubble with context
        throw new Error('Auth admin getUserById failed: ' + error.message)
      }
      if (i < retries) await new Promise(r => setTimeout(r, delay * (i + 1)))
    }
    return false
  }
  return true
}

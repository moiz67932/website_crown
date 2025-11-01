import { getSupabase } from './supabase'

export async function logError(path: string, err: any) {
  try {
    const supa = getSupabase()
    if (!supa) return
    const message = String(err?.message || err || 'error')
    const stack = typeof err?.stack === 'string' ? err.stack : null
    await supa.from('errors').insert({ path, message, stack })
  } catch {}
}

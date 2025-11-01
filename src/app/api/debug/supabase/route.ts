import { NextResponse } from 'next/server'
import { initSupabaseClient } from '../../../../lib/db/supabase-debug'

// Self-test endpoint: verifies Supabase connectivity and counts rows from 'properties' using a HEAD count
export async function GET() {
  // Cyan log for visibility on start
  // eslint-disable-next-line no-console
  console.log('\x1b[36m%s\x1b[0m', '[Supabase] Connecting...')
  const supabase = initSupabaseClient()
  if (!supabase) {
    return NextResponse.json({ ok: false, msg: 'Missing env vars' }, { status: 500 })
  }
  try {
    // We just want to check basic read; count via head() to avoid large payloads
    const { count, error } = await supabase.from('properties').select('*', { count: 'exact', head: true })
    if (error) throw error
    return NextResponse.json({ ok: true, count: count ?? 0 })
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error('\x1b[31m%s\x1b[0m', '[Supabase Error]', e?.message || String(e))
    return NextResponse.json({ ok: false, msg: e?.message || 'Unknown error', code: e?.code }, { status: 500 })
  }
}

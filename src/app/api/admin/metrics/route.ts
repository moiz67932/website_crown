import { NextRequest } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(_req: NextRequest) {
  const supa = getSupabase()
  if (!supa) return Response.json({ ok: false })
  // TODO: aggregate metrics from tables if present
  return Response.json({ ok: true, web_vitals: [], api_usage: [], leads_by_day: [] })
}

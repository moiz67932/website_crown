import { NextRequest } from 'next/server'
import { getSupabase } from '../../../../lib/supabase'

export async function GET(_req: NextRequest) {
  const supa = getSupabase()
  if (!supa) return Response.json({ rows: [] })
  const { data } = await supa.from('errors').select('*').order('created_at', { ascending: false }).limit(100)
  return Response.json({ rows: data || [] })
}

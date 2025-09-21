import { NextRequest } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supa = getSupabase()
  if (!supa) return Response.json({ code: null, stats: null })
  const id = req.cookies.get('cc_session')?.value || null
  if (!id) return Response.json({ code: null, stats: null })
  const { data: rows } = await supa.from('referral_codes').select('*').eq('user_id', id).limit(1)
  const code = rows?.[0]?.code || null
  // basic stats
  const { data: refs } = await supa.from('referrals').select('id').eq('code', code).limit(1000)
  return Response.json({ code, stats: { success: refs?.length || 0 } })
}

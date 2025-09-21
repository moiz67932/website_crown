import { NextRequest } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { generateCode } from '@/lib/referrals'

export async function POST(req: NextRequest) {
  try {
    const supa = getSupabase()
    if (!supa) return Response.json({ error: 'unconfigured' }, { status: 500 })
    const id = req.cookies.get('cc_session')?.value
    if (!id) return Response.json({ error: 'no_session' }, { status: 400 })
    const code = generateCode()
    await supa.from('referral_codes').insert({ user_id: id, code })
    return Response.json({ code })
  } catch (e: any) {
    return Response.json({ error: e?.message || 'server_error' }, { status: 500 })
  }
}

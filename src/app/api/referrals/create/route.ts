import { NextRequest } from 'next/server'
import { ensureReferralCode, mergeSessionIntoUser } from '@/lib/referrals'
import { getSupabaseAuth } from '@/lib/supabase-auth'

export async function POST(req: NextRequest) {
  try {
    const auth = getSupabaseAuth()
    if (!auth) return Response.json({ error: 'unconfigured' }, { status: 500 })
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || req.cookies.get('supabase-auth-token')?.value
    if (!token) return Response.json({ error: 'unauthorized' }, { status: 401 })
    const { data: { user } } = await auth.auth.getUser(token)
    if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
    const code = await ensureReferralCode(user.id)
    const cc = req.cookies.get(process.env.CC_SESSION_COOKIE_NAME || 'cc_session')?.value
    if (cc) await mergeSessionIntoUser({ userId: user.id, ccSession: cc })
    return Response.json({ code })
  } catch (e: any) {
    return Response.json({ error: e?.message || 'server_error' }, { status: 500 })
  }
}

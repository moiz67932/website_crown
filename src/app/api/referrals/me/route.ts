import { NextRequest } from 'next/server'
import { ensureReferralCode, isAdmin } from '@/lib/referrals'
import { getSupabaseAuth } from '@/lib/supabase-auth'
import { AuthService } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const auth = getSupabaseAuth()
    if (!auth) return Response.json({ error: 'supabase_unconfigured' }, { status: 500 })
    // Prefer custom JWT (auth-token) to resolve email → user UUID
    const jwt = AuthService.getCurrentUser(req)
    let userId: string | null = null
    let email = jwt?.email || ''
    if (email) {
      const { data: u } = await auth.from('users').select('id,email').eq('email', email).maybeSingle()
      userId = u?.id || null
    } else {
      // Fallback to Supabase auth token if available
      const authHeader = req.headers.get('authorization')
      const token = authHeader?.replace('Bearer ', '') || req.cookies.get('supabase-auth-token')?.value
      if (token) {
        const { data: { user } } = await auth.auth.getUser(token)
        userId = user?.id || null
        email = user?.email || ''
      }
    }
    if (!userId) return Response.json({ code: null, totals: null, rewards: [] })

    const supa = auth
    // Ensure code
    const code = await ensureReferralCode(userId)
    // Totals
    const { data: visits } = await supa.from('referral_visits').select('id').eq('referrer_code', code)
    const { data: signups } = await supa.from('referral_events').select('id').eq('referrer_id', userId).eq('kind','signup')
    const { data: leads } = await supa.from('referral_events').select('id').eq('referrer_id', userId).eq('kind','lead')
    const { data: appts } = await supa.from('referral_events').select('id').eq('referrer_id', userId).eq('kind','appointment')
    const { data: closings } = await supa.from('referral_events').select('id').eq('referrer_id', userId).eq('kind','closing')
    const { data: rewards } = await supa.from('referral_rewards').select('id, points, reason, status, created_at, event_id').eq('user_id', userId).order('created_at', { ascending: false }).limit(50)
    const approvedPoints = (rewards||[]).filter(r=>['approved','paid'].includes((r as any).status)).reduce((a,r)=>a+Number((r as any).points||0),0)
    return Response.json({
      code,
      totals: {
        visits: visits?.length || 0,
        signups: signups?.length || 0,
        leads: leads?.length || 0,
        appointments: appts?.length || 0,
        closings: closings?.length || 0,
        points: approvedPoints,
      },
      rewards: rewards || [],
      admin: isAdmin(email || '')
    })
  } catch (e:any) {
    return Response.json({ error: e?.message || 'server_error' }, { status: 500 })
  }
}

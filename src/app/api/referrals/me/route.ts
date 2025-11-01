import { NextRequest } from 'next/server'
import { getSupabaseAuth } from '../../../../lib/supabase-auth'
import { AuthService } from '../../../../lib/auth'
import { getMyReferralOverview } from '../../../../lib/referrals'

export async function GET(req: NextRequest) {
  try {
    const auth = getSupabaseAuth()
    if (!auth) return Response.json({ error: 'supabase_unconfigured' }, { status: 500 })

    const jwt = AuthService.getCurrentUser(req)
    let userId: string | null = null
    if (jwt?.email) {
      const { data: u } = await auth.from('users').select('id').eq('email', jwt.email).maybeSingle()
      userId = u?.id || null
    }
    if (!userId) return Response.json({ code: null, signup_count: 0, lead_count: 0, recent_signups: [], recent_leads: [] })

    const overview = await getMyReferralOverview(userId)
    return Response.json(overview)
  } catch (e:any) {
    return Response.json({ error: e?.message || 'server_error' }, { status: 500 })
  }
}

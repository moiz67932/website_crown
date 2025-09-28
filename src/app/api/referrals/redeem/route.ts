import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAuth } from '@/lib/supabase-auth'

export async function POST(req: NextRequest){
  try {
    if (process.env.REFERRALS_ENABLED === 'false') return NextResponse.json({ error: 'disabled' }, { status: 403 })
    const auth = getSupabaseAuth()
    if (!auth) return NextResponse.json({ error: 'unconfigured' }, { status: 500 })
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || req.cookies.get('supabase-auth-token')?.value
    if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    const { data: { user } } = await auth.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await req.json().catch(()=>({})) as any
    const points = Number(body?.points || 0)
    if (!Number.isFinite(points) || points <= 0) return NextResponse.json({ error: 'invalid_points' }, { status: 422 })

    // Compute approved points
    const { data: rewards } = await auth.from('referral_rewards').select('points,status').eq('user_id', user.id)
    const approved = (rewards||[]).filter((r:any)=>['approved','paid'].includes(r.status)).reduce((a:number,r:any)=>a+Number(r.points||0),0)
    const { data: redems } = await auth.from('referral_redemptions').select('points,status').eq('user_id', user.id)
    const outstanding = (redems||[]).filter((r:any)=>['requested','approved'].includes(r.status)).reduce((a:number,r:any)=>a+Number(r.points||0),0)
    const available = approved - outstanding
    if (points > available) return NextResponse.json({ error: 'insufficient_points', available }, { status: 422 })

    const notes = body?.notes ? String(body.notes) : undefined
    const { data, error } = await auth.from('referral_redemptions').insert({ user_id: user.id, points, status: 'requested', meta: notes ? { notes } : null as any }).select('*').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, redemption: data })
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'server_error' }, { status: 500 })
  }
}

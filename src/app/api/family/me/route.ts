import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAuth } from '@/lib/supabase-auth'

export async function POST(req: NextRequest) {
  const supa = getSupabaseAuth()
  if (!supa) return NextResponse.json({ error: 'unconfigured' }, { status: 500 })

  // Identify user via Authorization bearer or supabase-auth-token cookie
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '') || req.cookies.get('supabase-auth-token')?.value
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: authUser } = await supa.auth.getUser(token)
  const user = authUser?.user
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // Fetch the user's family_id
  const { data: meRow, error: meErr } = await supa.from('users').select('id, family_id').eq('id', user.id).maybeSingle()
  if (meErr) return NextResponse.json({ error: meErr.message }, { status: 500 })
  const familyId = meRow?.family_id as string | null
  if (!familyId) return NextResponse.json({ ok: true, family: null, members: [], totals: { pointsApproved: 0, pointsPaid: 0 } })

  // Load family group
  const { data: family, error: famErr } = await supa.from('family_groups').select('*').eq('id', familyId).maybeSingle()
  if (famErr || !family) return NextResponse.json({ error: famErr?.message || 'family_not_found' }, { status: 404 })

  // Load members with basic user info
  const { data: memberRows, error: memErr } = await supa
    .from('family_members')
    .select('user_id, role, users ( id, first_name, last_name, email, avatar_url )')
    .eq('family_id', familyId)
  if (memErr) return NextResponse.json({ error: memErr.message }, { status: 500 })

  const members = (memberRows || []).map((m: any) => ({
    user_id: m.user_id,
    role: m.role,
    user: m.users,
  }))
  const memberIds = members.map(m => m.user_id)

  // Aggregate referral rewards across the family
  let pointsApproved = 0
  let pointsPaid = 0
  if (memberIds.length) {
    const { data: rewards, error: rewErr } = await supa
      .from('referral_rewards')
      .select('user_id, points, status')
      .in('user_id', memberIds)
    if (rewErr) return NextResponse.json({ error: rewErr.message }, { status: 500 })
    for (const r of rewards || []) {
      const pts = Number((r as any).points || 0)
      const status = String((r as any).status || '')
      if (['approved', 'paid'].includes(status)) pointsApproved += pts
      if (status === 'paid') pointsPaid += pts
    }
  }

  return NextResponse.json({ ok: true, family, members, totals: { pointsApproved, pointsPaid } })
}

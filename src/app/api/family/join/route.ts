import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAuth } from '../../../../lib/supabase-auth'

export async function POST(req: NextRequest){
  const auth = getSupabaseAuth()
  if (!auth) return NextResponse.json({ error: 'unconfigured' }, { status: 500 })
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '') || req.cookies.get('supabase-auth-token')?.value
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data: { user } } = await auth.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(()=>({})) as any
  const invite = String(body?.invite_code || '').trim()
  if (!invite) return NextResponse.json({ error: 'invite_required' }, { status: 422 })

  const { data: fam, error } = await auth.from('family_groups').select('*').eq('invite_code', invite).maybeSingle()
  if (error || !fam) return NextResponse.json({ error: 'invalid_invite' }, { status: 404 })
  await auth.from('family_members').upsert({ family_id: fam.id, user_id: user.id, role: 'member' })
  await auth.from('users').update({ family_id: fam.id }).eq('id', user.id)
  return NextResponse.json({ ok: true, family: fam })
}

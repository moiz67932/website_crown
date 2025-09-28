import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAuth } from '@/lib/supabase-auth'

function randCode(){ return Math.random().toString(36).slice(2,10).toUpperCase() }

export async function POST(req: NextRequest){
  const auth = getSupabaseAuth()
  if (!auth) return NextResponse.json({ error: 'unconfigured' }, { status: 500 })
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '') || req.cookies.get('supabase-auth-token')?.value
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data: { user } } = await auth.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(()=>({})) as any
  const name = String(body?.name || '').trim()
  if (!name) return NextResponse.json({ error: 'name_required' }, { status: 422 })

  const code = randCode()
  const { data: fam, error } = await auth.from('family_groups').insert({ name, owner_id: user.id, invite_code: code }).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await auth.from('family_members').insert({ family_id: fam.id, user_id: user.id, role: 'owner' })
  await auth.from('users').update({ family_id: fam.id }).eq('id', user.id)
  return NextResponse.json({ ok: true, family: fam })
}

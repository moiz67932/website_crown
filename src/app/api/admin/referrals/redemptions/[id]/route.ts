import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAuth } from '../../../../../../lib/supabase-auth'
import { isAdmin } from '../../../../../../lib/referrals'

function bearerOk(req: NextRequest){
  const hdr = req.headers.get('authorization') || ''
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : ''
  const expected = process.env.REFERRAL_ADMIN_TOKEN || ''
  return expected && token === expected
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }){
  const auth = getSupabaseAuth()
  if (!auth) return NextResponse.json({ error: 'unconfigured' }, { status: 500 })
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '') || req.cookies.get('supabase-auth-token')?.value
  let ok = false
  let email = ''
  if (token) {
    const { data: { user } } = await auth.auth.getUser(token)
    email = user?.email || ''
    ok = !!user && isAdmin(email)
  }
  if (!ok && bearerOk(req)) ok = true
  if (!ok) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const body = await req.json().catch(()=>({})) as any
  const status = String(body?.status || '')
  if (!['approved','denied','paid'].includes(status)) return NextResponse.json({ error: 'bad_status' }, { status: 422 })
  const { id } = await ctx.params
  const { data, error } = await auth.from('referral_redemptions').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, redemption: data })
}

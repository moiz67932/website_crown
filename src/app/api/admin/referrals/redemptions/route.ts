import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAuth } from '../../../../../lib/supabase-auth'
import { isAdmin } from '../../../../../lib/referrals'

function bearerOk(req: NextRequest){
  const hdr = req.headers.get('authorization') || ''
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : ''
  const expected = process.env.REFERRAL_ADMIN_TOKEN || ''
  return expected && token === expected
}

export async function GET(req: NextRequest){
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

  const status = req.nextUrl.searchParams.get('status') || undefined
  const q = auth.from('referral_redemptions').select('id,user_id,points,status,meta,created_at,updated_at').order('created_at', { ascending: false })
  const { data, error } = status ? await q.eq('status', status) : await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data || [] })
}

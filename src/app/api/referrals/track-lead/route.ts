import { NextRequest, NextResponse } from 'next/server'
import { recordLead } from '../../../../lib/referrals'
import { supaServer } from '../../../../lib/supabase'

function serviceClient(){ try { return supaServer() } catch { return null } }

export async function POST(req: NextRequest){
  try {
    const body = await req.json().catch(()=>({})) as any
    const referralCode = body?.referralCode ? String(body.referralCode).trim().toUpperCase() : ''
    if (!referralCode) return new NextResponse(null, { status: 204 })

  const supa = serviceClient()
  if (!supa) return new NextResponse(null, { status: 204 })
  const { data: ref, error: refErr } = await supa.from('referral_codes').select('code').eq('code', referralCode).maybeSingle()
  if (refErr) return NextResponse.json({ error: 'server_error' }, { status: 500 })
    if (!ref?.code) return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 })

    await recordLead(referralCode, { name: body.name, email: body.email, phone: body.phone, propertyId: body.propertyId })
    return NextResponse.json({ ok: true })
  } catch (e:any) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}

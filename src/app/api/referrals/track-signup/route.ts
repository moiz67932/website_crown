import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import { supaServer } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any))
    const referralCode = (body?.referralCode ?? '').toString().trim().toUpperCase()
    const referredUserId = (body?.referredUserId ?? '').toString().trim()

    if (!referralCode) return new NextResponse(null, { status: 204 })

    const supa = supaServer()
    // Validate code
    const { data: rc } = await supa
      .from('referral_codes')
      .select('code')
      .eq('code', referralCode)
      .maybeSingle()

    if (!rc?.code) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 })
    }

    // Resolve current user id: prefer explicit body, else try custom auth-token
    let uid = referredUserId || ''
    if (!uid) {
      const jwt = AuthService.getCurrentUser(req)
      if (jwt?.userId && typeof jwt.userId === 'string') uid = jwt.userId
    }
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Idempotent insert
    const { error: insErr } = await supa
      .from('referral_signups')
      .insert({ referrer_code: referralCode, referred_user_id: uid })

    if (insErr && insErr.code !== '23505') {
      console.error('signup credit error:', insErr)
      return NextResponse.json({ error: 'server_error' }, { status: 500 })
    }

    if (!insErr) {
      try {
        await supa.rpc('increment_referral_signup', { p_code: referralCode })
      } catch (rpcErr) {
        console.warn('increment_referral_signup failed (non-fatal):', rpcErr)
      }
    }

    return NextResponse.json({ ok: true, credited: !insErr })
  } catch (e) {
    console.error('track-signup error:', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}

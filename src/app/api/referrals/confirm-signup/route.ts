import { NextRequest, NextResponse } from 'next/server'
import { supaServer } from '@/lib/supabase'
import { getSupabaseAuth } from '@/lib/supabase-auth'
import { ensureReferralCode } from '@/lib/referrals'

const rateBuckets = new Map<string, { n: number; t: number }>()
const MAX_PER_MINUTE = 20

function rateLimit(key: string) {
  const now = Date.now()
  const b = rateBuckets.get(key) || { n: 0, t: now }
  if (now - b.t > 60_000) { b.n = 0; b.t = now }
  b.n++
  rateBuckets.set(key, b)
  return b.n <= MAX_PER_MINUTE
}

function serviceClient() { return supaServer() }

function isValidCode(code: string) {
  return /^[A-Z0-9]{4,32}$/i.test(code)
}

export async function POST(req: NextRequest) {
  try {
    if (process.env.REFERRALS_ENABLED === 'false') return NextResponse.json({ ok: true, linked: false })

    const ip = req.headers.get('x-forwarded-for') || 'anon'
    if (!rateLimit(`ip:${ip}`)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })

    const auth = getSupabaseAuth()
    if (!auth) return NextResponse.json({ error: 'unconfigured' }, { status: 500 })

    // Resolve current user
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || req.cookies.get('supabase-auth-token')?.value
    if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    const { data: { user } } = await auth.auth.getUser(token)
    if (!user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    const userId = user.id
    if (!rateLimit(`user:${userId}`)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })

    const code = req.cookies.get('cc_ref')?.value || req.cookies.get(process.env.REFERRAL_COOKIE_NAME || 'ref')?.value || ''
    if (!code || !isValidCode(code)) {
      const totals = await getTotals(userId)
      return NextResponse.json({ ok: true, linked: false, totals })
    }

    const supaSrv = serviceClient()

    // Lookup referrer by referral_code
    const { data: referrer } = await supaSrv.from('users').select('id').eq('referral_code', code).maybeSingle()
    if (!referrer?.id || referrer.id === userId) {
      const totals = await getTotals(userId)
      return NextResponse.json({ ok: true, linked: false, totals })
    }

    // Link user -> referrer_id if not set
    await supaSrv.from('users').update({ referrer_id: referrer.id }).eq('id', userId).is('referrer_id', null)

    // Gather UTM from cookies
    const utmKeys = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'] as const
    const utm: Record<string, string> = {}
    for (const k of utmKeys) {
      const v = req.cookies.get(k)?.value
      if (v) utm[k] = v
    }

    // Insert legacy referrals row (idempotent via unique partial index)
    await supaSrv.from('referrals').insert({
      code,
      referrer_user_id: referrer.id,
      referred_user_id: userId,
      event_kind: 'signup',
      utm: Object.keys(utm).length ? utm as any : undefined,
    }).then((r) => {
      if (r.error && !String(r.error?.message || '').toLowerCase().includes('duplicate') && !String(r.error?.code || '').includes('23505')) {
        // ignore non-unique errors silently
      }
    })

    // Ensure current user has a code (for share)
    await ensureReferralCode(userId)

    const totals = await getTotals(userId)
    return NextResponse.json({ ok: true, linked: true, totals })
  } catch (e: any) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}

async function getTotals(userId: string) {
  const supa = supaServer()

  // Ensure we have a code
  const { data: u } = await supa.from('users').select('referral_code').eq('id', userId).maybeSingle()
  const code = u?.referral_code || null

  // Counts from legacy tables and events
  const { data: all } = await supa
    .from('referrals')
    .select('id, event_kind')
    .eq('referrer_user_id', userId)

  const count = (k: string) => (all || []).filter((r: any) => r.event_kind === k).length

  // Visits from referral_visits by code
  let visits = 0
  if (code) {
    const { data: vs } = await supa.from('referral_visits').select('id').eq('referrer_code', code)
    visits = vs?.length || 0
  }

  const totals = {
    visits,
    signups: count('signup'),
    leads: count('lead'),
    appointments: count('appointment'),
    closings: count('closing'),
    points: 0,
  }

  const { data: rewards } = await supa
    .from('referral_rewards')
    .select('points,status')
    .eq('user_id', userId)

  totals.points = (rewards || [])
    .filter((r: any) => ['approved','paid'].includes(r.status))
    .reduce((a: number, r: any) => a + Number(r.points || 0), 0)

  return totals
}

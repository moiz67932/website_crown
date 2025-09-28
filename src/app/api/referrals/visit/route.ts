import { NextRequest, NextResponse } from 'next/server'
// Visit tracking removed. Endpoint retained as no-op for backward compatibility.

// Basic in-memory rate limit (per IP)
const buckets = new Map<string,{ n:number; t:number }>()

export async function POST(req: NextRequest){
  try {
    if (process.env.REFERRALS_ENABLED === 'false') return NextResponse.json({ ok: true })
    const ip = req.headers.get('x-forwarded-for') || 'anon'
    const now = Date.now()
    const key = `visit:${ip}`
    const b = buckets.get(key) || { n:0, t: now }
    if (now - b.t > 1000*60) { b.n = 0; b.t = now }
    b.n++
    buckets.set(key, b)
    if (b.n > 60) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })

    const body = await req.json().catch(()=>({})) as any
    const ref = String(body?.ref || '')
    if (!ref) return NextResponse.json({ ok: true })
    const cc = body?.cc_session ? String(body.cc_session) : undefined
    const path = body?.path ? String(body.path) : undefined
    const utm = body?.utm && typeof body.utm === 'object' ? body.utm : undefined

  // No-op
  return NextResponse.json({ ok: true, deprecated: true })
  } catch (e:any) {
    return NextResponse.json({ ok: true })
  }
}

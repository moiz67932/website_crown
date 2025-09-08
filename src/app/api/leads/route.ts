import { NextRequest, NextResponse } from 'next/server'
import { enqueueLead } from '@/lib/crm/queue'
import { parseUTMFromURL } from '@/lib/analytics/utm'
import { scoreLead } from '@/lib/crm/lead-scoring'
import type { LeadPayload } from '@/lib/crm/types'

const MIN_MS_ON_PAGE = 1500
const HONEYPOT_FIELD = 'company'

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const body = await req.json().catch(() => ({}))
    if (!body) return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
    if (body[HONEYPOT_FIELD]) return NextResponse.json({ ok: true })
    const t = Number(body.__top ?? 0)
    if (Number.isFinite(t) && t < MIN_MS_ON_PAGE) {
      return NextResponse.json({ error: 'Bot suspected' }, { status: 202 })
    }
    const utm = parseUTMFromURL(url)
    const cookies = req.cookies
    utm.source ||= cookies.get('utm_source')?.value ?? undefined
    utm.medium ||= cookies.get('utm_medium')?.value ?? undefined
    utm.campaign ||= cookies.get('utm_campaign')?.value ?? undefined
    utm.content ||= cookies.get('utm_content')?.value ?? undefined
    utm.term ||= cookies.get('utm_term')?.value ?? undefined
    utm.gclid ||= cookies.get('gclid')?.value ?? undefined
    utm.fbclid ||= cookies.get('fbclid')?.value ?? undefined
    const lead: LeadPayload = {
      firstName: body.firstName,
      lastName: body.lastName,
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      message: body.message,
      city: body.city,
      state: body.state,
      county: body.county,
      budgetMin: body.budgetMin ? Number(body.budgetMin) : undefined,
      budgetMax: body.budgetMax ? Number(body.budgetMax) : undefined,
      beds: body.beds,
      baths: body.baths,
      propertyType: body.propertyType,
      wantsTour: !!body.wantsTour,
      isCashBuyer: !!body.isCashBuyer,
      timeframe: body.timeframe,
      contactPreference: body.contactPreference,
      tags: body.tags || [],
      pageUrl: body.pageUrl || req.headers.get('referer') || url.toString(),
      referer: req.headers.get('referer') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
      ip: req.headers.get('x-forwarded-for') || (req as any).ip || undefined,
      source: utm.source || (body.source ?? 'website'),
      campaign: utm.campaign,
      medium: utm.medium,
      content: utm.content,
      term: utm.term,
      gclid: utm.gclid,
      fbclid: utm.fbclid,
    }
    lead.score = scoreLead(lead)
    await enqueueLead(lead)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[api.leads] error', e?.message || e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

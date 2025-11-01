import { NextRequest, NextResponse } from 'next/server'
import { pushLead } from '../../../lib/crm'
import { parseUTMFromURL } from '../../../lib/analytics/utm'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const url = req.nextUrl
    const utm = parseUTMFromURL(url)
    const cookies = req.cookies
    utm.source ||= cookies.get('utm_source')?.value ?? undefined
    utm.medium ||= cookies.get('utm_medium')?.value ?? undefined
    utm.campaign ||= cookies.get('utm_campaign')?.value ?? undefined
    utm.content ||= cookies.get('utm_content')?.value ?? undefined
    utm.term ||= cookies.get('utm_term')?.value ?? undefined
    utm.gclid ||= cookies.get('gclid')?.value ?? undefined
    utm.fbclid ||= cookies.get('fbclid')?.value ?? undefined
    const result = await pushLead({
      ...body,
      pageUrl: body.pageUrl || req.headers.get('referer') || undefined,
      referrer: body.referrer || req.headers.get('referer') || undefined,
      utm_source: body.utm_source || utm.source || undefined,
      utm_medium: body.utm_medium || utm.medium || undefined,
      utm_campaign: body.utm_campaign || utm.campaign || undefined,
      utm_term: body.utm_term || utm.term || undefined,
      utm_content: body.utm_content || utm.content || undefined,
    })
    if ((result as any).ok === false) {
      const status = (result as any).status || 400
      return NextResponse.json({ ok: false, error: (result as any).error || 'Invalid' }, { status })
    }
    return NextResponse.json(result)
  } catch (e: any) {
    console.error('[api.leads] error', e?.message || e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

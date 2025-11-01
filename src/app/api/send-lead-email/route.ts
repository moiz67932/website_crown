import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { guardRateLimit } from '../../../lib/rate-limit'
// Legacy cookie-based referral lead awarding removed. Lead referral now explicit via /api/referrals/track-lead.

type LeadPayload = any

function getEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env var ${name}`)
  return v
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anon'
    const { allowed } = await guardRateLimit(`rl:${ip}:/api/send-lead-email`)
    if (!allowed) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
    const body: LeadPayload = await req.json().catch(() => ({}))
    if (!body) return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })

    // basic honeypot/time checks mirror /api/leads behavior
    if (body.company) return NextResponse.json({ ok: true })
    const MIN_MS_ON_PAGE = 1000
    const t = Number(body.__top ?? 0)
    if (Number.isFinite(t) && t < MIN_MS_ON_PAGE) {
      return NextResponse.json({ error: 'Bot suspected' }, { status: 202 })
    }

    // Read SMTP config from env (server-side only)
    const host = process.env.EMAIL_HOST || process.env.NEXT_PUBLIC_EMAIL_HOST
    const port = process.env.EMAIL_PORT || process.env.NEXT_PUBLIC_EMAIL_PORT
    const secure = (process.env.EMAIL_SECURE || process.env.NEXT_PUBLIC_EMAIL_SECURE || 'true') === 'true'
    const user = process.env.EMAIL_USER
    const pass = process.env.EMAIL_PASS
    const to = process.env.EMAIL_TO

    if (!host || !port || !user || !pass || !to) {
      console.error('[api.send-lead-email] missing email env vars')
      return NextResponse.json({ error: 'Email not configured' }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure,
      auth: { user, pass },
    })

    const name = body.fullName || `${body.firstName || ''} ${body.lastName || ''}`.trim()
    const email = body.email || ''
    const phone = body.phone || ''
    const city = body.city || ''
    const state = body.state || ''
    const county = body.county || ''
    const budgetMax = body.budgetMax ?? ''
    const timeframe = body.timeframe || ''
    const wantsTour = body.wantsTour ? 'Yes' : 'No'
    const pageUrl = body.pageUrl || req.headers.get('referer') || ''
    const propertyId = (body.tags || []).find((t: string) => t.startsWith('prop:')) || ''
    const message = body.message || ''

    const subject = `New lead: ${name || email} - ${city || ''} ${state || ''}`

    const text = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `City: ${city}`,
      `State: ${state}`,
      `County: ${county}`,
      `Budget Max: ${budgetMax}`,
      `Timeframe: ${timeframe}`,
      `Wants Tour: ${wantsTour}`,
      `Property: ${propertyId}`,
      `Page URL: ${pageUrl}`,
      '',
      'Message:',
      message,
    ].join('\n')

    const html = `
      <h2>New Lead</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
      <p><strong>City / State / County:</strong> ${escapeHtml(city)} / ${escapeHtml(state)} / ${escapeHtml(
        county
      )}</p>
      <p><strong>Budget Max:</strong> ${escapeHtml(String(budgetMax))}</p>
      <p><strong>Timeframe:</strong> ${escapeHtml(timeframe)}</p>
      <p><strong>Wants Tour:</strong> ${escapeHtml(wantsTour)}</p>
      <p><strong>Property:</strong> ${escapeHtml(propertyId)}</p>
      <p><strong>Page URL:</strong> <a href="${escapeHtml(pageUrl)}">${escapeHtml(pageUrl)}</a></p>
      <hr />
      <h3>Message</h3>
      <p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
    `

    // send mail
    const mailOptions = {
      from: `${escapeHtml(name) || 'Website Lead'} <${user}>`,
      to,
      subject,
      text,
      html,
    }

    await transporter.sendMail(mailOptions)

    // (Referral credit, if any, is handled separately via /api/referrals/track-lead.)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[api.send-lead-email] error', e?.message || e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

function escapeHtml(str: string) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

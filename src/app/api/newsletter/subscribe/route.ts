// src/app/api/newsletter/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabase } from '@/lib/supabase'
import nodemailer from 'nodemailer'

// Accept honeypot/time-on-page signals so our notification email route doesn't reject as bot
const Schema = z.object({
  email: z.string().email(),
  city: z.string().optional(),
  __top: z.number().optional(), // ms spent on page (client measured)
  company: z.string().optional(), // honeypot field name used across site
})

export async function POST(req: NextRequest) {
  const supa = getSupabase()
  if (!supa) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 })
  }

  try {
    const body = Schema.parse(await req.json())
    const email = body.email.toLowerCase()
    const city = body.city || null

    // Save subscriber in DB (table: newsletter_subscribers has columns: id, email, confirmed, created_at)
    const { data: existing } = await supa
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (!existing) {
      await supa.from('newsletter_subscribers').insert({
        email,
        confirmed: true,
      })
    }

    // Fire off a minimal notification email directly (avoid using /api/send-lead-email which formats a full "lead")
    try {
      // basic honeypot/time checks similar to /api/send-lead-email
      if (body.company) {
        // honeypot filled -> treat as bot and skip emailing
      } else {
        const MIN_MS_ON_PAGE = 1000
        const t = Number(body.__top ?? 0)
        if (!Number.isFinite(t) || t >= MIN_MS_ON_PAGE) {
          // Read SMTP config from env (server-side only)
          const host = process.env.EMAIL_HOST || process.env.NEXT_PUBLIC_EMAIL_HOST
          const port = process.env.EMAIL_PORT || process.env.NEXT_PUBLIC_EMAIL_PORT
          const secure = (process.env.EMAIL_SECURE || process.env.NEXT_PUBLIC_EMAIL_SECURE || 'true') === 'true'
          const user = process.env.EMAIL_USER
          const pass = process.env.EMAIL_PASS
          const to = process.env.EMAIL_TO

          if (!host || !port || !user || !pass || !to) {
            console.error('[newsletter.subscribe] missing email env vars; skipping notification')
          } else {
            const transporter = nodemailer.createTransport({
              host,
              port: Number(port),
              secure,
              auth: { user, pass },
            })

            const subject = `Newsletter signup: ${email}`
            const pageUrl = req.headers.get('referer') || undefined
            const text = `A new lead has signed up for the newsletter: ${email}${city ? ` (${city})` : ''}.\nPage: ${pageUrl || ''}`
            const html = `<p>A new lead has signed up for the newsletter: <strong>${email}</strong>${city ? ` (${escapeHtml(city)})` : ''}.</p>${pageUrl ? `<p>Page: <a href="${escapeHtml(pageUrl)}">${escapeHtml(pageUrl)}</a></p>` : ''}`

            await transporter.sendMail({
              from: `${email} <${user}>`,
              to,
              subject,
              text,
              html,
            })
          }
        } else {
          // suspected bot due to low time-on-page
          console.warn('[newsletter.subscribe] suspected bot - low time on page, skipping notification')
        }
      }
    } catch (e: any) {
      console.error('Newsletter email exception', e)
    }

    // helper for small HTML escaping
    function escapeHtml(str: string | null | undefined) {
      return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
    }

    return NextResponse.json({ ok: true, confirmed: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 })
  }
}

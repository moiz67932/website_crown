import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabase } from '@/lib/supabase'

const Schema = z.object({ email: z.string().email(), city: z.string().optional() })

export async function POST(req: NextRequest) {
  const supa = getSupabase()
  if (!supa) return NextResponse.json({ ok:false, error:'Supabase not configured' }, { status: 500 })
  try {
    const body = Schema.parse(await req.json())
    const confirmed = process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY ? false : true
    // Basic upsert on email
    const { data: existing } = await supa.from('newsletter_subscribers').select('id,confirmed').eq('email', body.email.toLowerCase()).maybeSingle()
    if (existing) {
      await supa.from('newsletter_subscribers').update({ confirmed: existing.confirmed || confirmed }).eq('id', existing.id)
    } else {
      await supa.from('newsletter_subscribers').insert({ email: body.email.toLowerCase(), confirmed })
    }
    // Optional: send double opt-in with provider here (skipped)
    return NextResponse.json({ ok:true, confirmed })
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: e.message }, { status: 400 })
  }
}

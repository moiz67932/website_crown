import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getOrGenerateFaqs } from '../../../lib/faqs'

const Payload = z.object({ city: z.string(), slug: z.string() })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const input = Payload.parse(body)
    const result = await getOrGenerateFaqs(input.city, input.slug)
    if (!result) return NextResponse.json({ ok:false, error:'DB not configured' }, { status:500 })
    return NextResponse.json({ ok:true, ...result })
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: e.message }, { status: 400 })
  }
}
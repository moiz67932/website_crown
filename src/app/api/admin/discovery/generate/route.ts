import { NextResponse } from 'next/server'

// Reuse the content generator API logic by calling the existing route internally.
// Alternatively, you could import and use the same helper functions directly if exposed.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { topic } = await req.json()
    if (!topic || typeof topic !== 'string') {
      return NextResponse.json({ ok: false, error: 'topic required' }, { status: 400 })
    }

    // Build payload for the existing blog generator endpoint.
    const payload = {
      city: 'United States',
      template: topic,
      keywords: [topic],
      autoAttachProperties: false,
      post_type: 'discovery',
    }

    const base = process.env.NEXT_PUBLIC_SITE_URL || ''
    const url = base ? `${base}/api/content/generate` : '/api/content/generate'

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const j = await res.json()
    if (!j?.ok) {
      return NextResponse.json({ ok: false, error: j?.error || 'Generation failed' }, { status: 500 })
    }

  // Optionally, ensure post saved by selecting via Supabase here if needed.

    return NextResponse.json({ ok: true, id: j.id, slug: j.slug })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSupabase } from '../../../../lib/supabase'
import { attachImagesToPost } from '../../../../lib/unsplash'

type Body = {
  postId: string
  heroImagePrompt: string
  imagePrompts: string[]
}

async function searchUnsplash(query: string) {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) throw new Error('UNSPLASH_ACCESS_KEY not set')
  const params = new URLSearchParams({ query, per_page: '1' })
  const res = await fetch(`https://api.unsplash.com/search/photos?${params.toString()}`, {
    headers: { Authorization: `Client-ID ${key}` },
  })
  if (!res.ok) return null
  const data = await res.json()
  if (!data || !data.results || data.results.length === 0) return null
  // Prefer regular or full urls
  return data.results[0]?.urls?.regular || data.results[0]?.urls?.full || null
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body
    const { postId, heroImagePrompt, imagePrompts } = body
    if (!postId) return NextResponse.json({ ok: false, error: 'postId required' }, { status: 400 })

    const sb = getSupabase()
    if (!sb) return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 })

    const images = await attachImagesToPost(sb, postId, heroImagePrompt, imagePrompts)
    return NextResponse.json({ ok: true, images })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}

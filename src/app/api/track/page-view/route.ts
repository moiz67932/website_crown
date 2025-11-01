import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabase } from '../../../../lib/supabase'

const Schema = z.object({
  postId: z.string().uuid().optional(),
  slug: z.string().optional(),
  variant: z.enum(['A','B']).optional(),
})

export async function POST(req: NextRequest) {
  const supa = getSupabase()
  if (!supa) return NextResponse.json({ ok:false, error: 'Supabase not configured' }, { status: 500 })
  try {
    const body = Schema.parse(await req.json())
    const referrer = req.headers.get('referer') || req.headers.get('referrer') || null
    const ua = req.headers.get('user-agent') || null
    await supa.from('page_views').insert({
      post_id: body.postId || null,
      path: body.slug ? `/blog/${body.slug}` : null,
      variant: body.variant || null,
      referrer: referrer,
      ua: ua,
    })
    return NextResponse.json({ ok:true })
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: e.message }, { status: 400 })
  }
}

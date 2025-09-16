import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabase } from '@/lib/supabase'

const Schema = z.object({
  postId: z.string().uuid().optional(),
  variant: z.enum(['A','B']).optional(),
  path: z.string(),
  referrer: z.string().optional()
})

export async function POST(req: NextRequest) {
  const supa = getSupabase()
  if (!supa) return NextResponse.json({ ok:false, error: 'Supabase not configured' }, { status: 500 })
  try {
    const body = Schema.parse(await req.json())
    await supa.from('page_views').insert({
      post_id: body.postId || null,
      path: body.path,
      referrer: body.referrer || null,
      variant: body.variant || null
    })
    return NextResponse.json({ ok:true })
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message }, { status: 400 })
  }
}

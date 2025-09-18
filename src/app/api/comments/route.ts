import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabase } from '@/lib/supabase'

const PostSchema = z.object({ slug: z.string().min(2), author_name: z.string().min(2).max(80), body: z.string().min(5).max(5000) })

// naive in-memory rate limiter per IP
const hits = new Map<string, { count: number; ts: number }>()
const WINDOW_MS = 60_000
const LIMIT = 5

export async function GET(req: NextRequest) {
  const supa = getSupabase()
  if (!supa) return NextResponse.json({ ok:false, error:'Supabase not configured' }, { status: 500 })
  const url = new URL(req.url)
  const slug = url.searchParams.get('slug')
  if (!slug) return NextResponse.json({ ok:false, error:'slug required' }, { status: 400 })
  const { data: post } = await supa.from('posts').select('id').ilike('slug', slug).maybeSingle()
  if (!post) return NextResponse.json({ ok:true, comments: [] })
  const { data: rows } = await supa
    .from('comments')
    .select('id,author_name,body,created_at')
    .eq('post_id', post.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: true })
  return NextResponse.json({ ok:true, comments: rows || [] })
}

export async function POST(req: NextRequest) {
  const supa = getSupabase()
  if (!supa) return NextResponse.json({ ok:false, error:'Supabase not configured' }, { status: 500 })
  try {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
    const now = Date.now()
    const h = hits.get(ip) || { count: 0, ts: now }
    if (now - h.ts > WINDOW_MS) { h.count = 0; h.ts = now }
    h.count += 1
    hits.set(ip, h)
    if (h.count > LIMIT) return NextResponse.json({ ok:false, error:'rate_limited' }, { status: 429 })

    const body = PostSchema.parse(await req.json())
    const { data: post } = await supa.from('posts').select('id').ilike('slug', body.slug).maybeSingle()
    if (!post) return NextResponse.json({ ok:false, error:'post_not_found' }, { status: 404 })
    await supa.from('comments').insert({ post_id: post.id, author_name: body.author_name.trim(), body: body.body.trim(), status: 'pending' })
    return NextResponse.json({ ok:true, pending: true })
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message }, { status: 400 })
  }
}

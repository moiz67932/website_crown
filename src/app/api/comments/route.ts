// src/app/api/comments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabase } from '../../../lib/supabase'

// Validation schema
const PostSchema = z.object({
  slug: z.string().min(2),
  author_name: z.string().min(2).max(80),
  body: z.string().min(5).max(5000),
})

// Naive in-memory rate limiter per IP
const hits = new Map<string, { count: number; ts: number }>()
const WINDOW_MS = 60_000 // 1 minute
const LIMIT = 5 // max 5 comments per minute per IP

// GET all comments for a given slug
export async function GET(req: NextRequest) {
  const supa = getSupabase()
  if (!supa) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 })
  }

  const url = new URL(req.url)
  const slug = url.searchParams.get('slug')
  if (!slug) {
    return NextResponse.json({ ok: false, error: 'slug required' }, { status: 400 })
  }

  // Find post by slug
  const { data: post } = await supa
    .from('posts')
    .select('id')
    .ilike('slug', slug)
    .maybeSingle()

  if (!post) return NextResponse.json({ ok: true, comments: [] })

  // Get all comments (no status filter, instant publish)
  const { data: rows, error } = await supa
    .from('comments')
    .select('id,author_name,body,created_at')
    .eq('post_id', post.id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, comments: rows || [] })
}

// POST a new comment
export async function POST(req: NextRequest) {
  const supa = getSupabase()
  if (!supa) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 })
  }

  try {
    // Rate limit by IP
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
    const now = Date.now()
    const h = hits.get(ip) || { count: 0, ts: now }
    if (now - h.ts > WINDOW_MS) {
      h.count = 0
      h.ts = now
    }
    h.count += 1
    hits.set(ip, h)
    if (h.count > LIMIT) {
      return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
    }

    // Validate request body
    const body = PostSchema.parse(await req.json())

    // Find post id by slug
    const { data: post } = await supa
      .from('posts')
      .select('id')
      .ilike('slug', body.slug)
      .maybeSingle()

    if (!post) {
      return NextResponse.json({ ok: false, error: 'post_not_found' }, { status: 404 })
    }

    // Insert new comment (no moderation)
    const { data: inserted, error } = await supa
      .from('comments')
      .insert({
        post_id: post.id,
        author_name: body.author_name.trim(),
        body: body.body.trim(),
      })
      .select('id,author_name,body,created_at')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, comment: inserted })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

async function handler(req: NextRequest) {
  const supa = getSupabase()
  if (!supa) return NextResponse.json({ ok:false, error: 'Supabase not configured' }, { status: 500 })
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok:false }, { status: 401 })
  }
  const nowIso = new Date().toISOString()
  const { data: due, error } = await supa
    .from('posts')
    .select('id, slug')
    .eq('status', 'scheduled')
    .lte('scheduled_at', nowIso)

  if (error) return NextResponse.json({ ok:false, error: error.message }, { status: 500 })

  for (const p of (due ?? [])) {
    await supa.from('posts').update({
      status: 'published',
      published_at: new Date().toISOString()
    }).eq('id', p.id)
  }

  return NextResponse.json({ ok:true, published: due?.length ?? 0 })
}

export async function GET(req: NextRequest) { return handler(req) }
export async function POST(req: NextRequest) { return handler(req) }

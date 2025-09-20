import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET() {
  const supa = getSupabase()
  if (!supa) return NextResponse.json({ success:false, error:'Supabase not configured' }, { status: 500 })
  const { data } = await supa
    .from('posts')
    .select('id,slug,title_primary,status,city,post_type,published_at,created_at')
    .order('created_at', { ascending: false })
  const rows = data || []
  const header = ['id','slug','title','status','city','post_type','published_at','created_at']
  const lines = [header.join(',')]
  for (const r of rows) {
    lines.push([r.id, r.slug, JSON.stringify(r.title_primary), r.status, r.city||'', r.post_type||'', r.published_at||'', r.created_at||''].join(','))
  }
  const csv = lines.join('\n')
  return new Response(csv, { headers: { 'content-type': 'text/csv', 'content-disposition': 'attachment; filename="blog_export.csv"' } })
}

export async function POST() {
  try {
    const supa = getSupabase()
    if (!supa) return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 })
    const { data: posts } = await supa.from('posts').select('id,slug,title_primary,status,published_at,city')
    return NextResponse.json({ success: true, data: posts || [] })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Failed' }, { status: 500 })
  }
}

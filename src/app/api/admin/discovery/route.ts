import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '../../../../lib/supabase'
import { fetchRealEstateTrends } from '../../../../lib/discovery/google-trends'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const supa = getSupabase()
  if (!supa) return NextResponse.json({ ok:false, error:'Supabase not configured' }, { status: 500 })
  const { data, error } = await supa
    .from('discovered_topics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) return NextResponse.json({ ok:false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok:true, topics: data })
}

export async function POST(req: NextRequest) {
  const supa = getSupabase()
  if (!supa) return NextResponse.json({ ok:false, error:'Supabase not configured' }, { status: 500 })
  const topics = await fetchRealEstateTrends()
  if (!topics.length) return NextResponse.json({ ok:true, inserted: 0, topics: [] })
  const rows = topics.map(t => ({ topic: t.title, source: 'google_trends', url: t.url, traffic: t.traffic }))
  const { error } = await supa.from('discovered_topics').insert(rows)
  if (error) return NextResponse.json({ ok:false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok:true, inserted: rows.length })
}

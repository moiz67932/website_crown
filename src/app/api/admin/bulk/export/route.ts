import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

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

import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST() {
  try {
    const supa = getSupabase()
    if (!supa) return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 })
    // Pull recent/active properties to reindex via the existing admin/vector-index endpoint
    const { data: properties } = await supa
      .from('properties')
      .select('*')
      .limit(1000)
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/admin/vector-index`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ properties })
    })
    const j = await res.json()
    return NextResponse.json(j)
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Failed' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { getSupabase } from '../../../../../lib/supabase'

export async function POST() {
  try {
    const supa = getSupabase()
    if (!supa) return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 })
    // Placeholder: mark posts for FAQ regeneration
    const { error } = await supa.from('posts').update({ faqs_regen_requested_at: new Date().toISOString() as any }).neq('id', '')
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Failed' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '../../../../../lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const supa = getSupabase()
    if (!supa) return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 })
    const body = await req.json().catch(()=> ({}))
    const id = body.id as string | undefined
    if (id) {
      const { error } = await supa.from('landing_pages').update({ regen_requested_at: new Date().toISOString() as any }).eq('id', id)
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'Failed' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })
    const supa = getSupabase()
    if (!supa) return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 })
    const { error } = await supa.from('landing_pages').update(updates).eq('id', id)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url)
    if (url.pathname.endsWith('/regenerate')) {
      const body = await req.json().catch(()=>({}))
      const id = body.id as string | undefined
      // Placeholder: call AI generation pipeline if available
      // For now, just mark a timestamp to indicate regen triggered
      const supa = getSupabase()
      if (!supa) return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 })
      if (id) {
        const { error } = await supa.from('landing_pages').update({ regenerated_at: new Date().toISOString() as any }).eq('id', id)
        if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
      }
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ ok: false, error: 'Unsupported' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'Failed' }, { status: 500 })
  }
}

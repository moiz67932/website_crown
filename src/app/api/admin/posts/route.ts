import { NextResponse } from 'next/server'
import { getSupabase } from '../../../../lib/supabase'

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, status, reviewer } = body as { id?: string; status?: string; reviewer?: string | null }
    if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })

    const supa = getSupabase()
    if (!supa) return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 })

    const updates: any = {}
    if (typeof status === 'string' && status.length) updates.status = status
    if (reviewer !== undefined) updates.reviewer = reviewer
    if (updates.status === 'published') updates.published_at = new Date().toISOString()

    if (!Object.keys(updates).length) return NextResponse.json({ ok: false, error: 'No changes' }, { status: 400 })

    const { error } = await supa.from('posts').update(updates).eq('id', id)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}

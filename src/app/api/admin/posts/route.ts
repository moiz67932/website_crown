import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, status } = body
    if (!id || !status) return NextResponse.json({ ok: false, error: 'id and status required' }, { status: 400 })

  const supa = getSupabase()
  if (!supa) return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 })
  const updates: any = { status }
    if (status === 'published') updates.published_at = new Date().toISOString()

    const { error } = await supa.from('posts').update(updates).eq('id', id)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}

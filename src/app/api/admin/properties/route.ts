import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })
    const supa = getSupabase()
    if (!supa) return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 })
    const { error } = await supa.from('properties').update(updates).eq('id', id)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  // Support HTML form method override for DELETE
  const ct = req.headers.get('content-type') || ''
  if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
    const form = await req.formData()
    const method = (form.get('_method') || '').toString().toUpperCase()
    if (method === 'DELETE') {
      const id = form.get('id')?.toString()
      if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })
      const supa = getSupabase()
      if (!supa) return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 })
      const { error } = await supa.from('properties').delete().eq('id', id)
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }
  }
  return NextResponse.json({ ok: false, error: 'Unsupported' }, { status: 400 })
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const id = body.id
    if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })
    const supa = getSupabase()
    if (!supa) return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 })
    const { error } = await supa.from('properties').delete().eq('id', id)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}

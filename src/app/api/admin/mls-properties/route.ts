import { NextRequest, NextResponse } from 'next/server'
import { getPgPool } from '@/lib/db/connection'

// Admin API for properties managed in Postgres (MLS import).
// Supports: PATCH { listing_key | id, hidden?: boolean } to hide/unhide
//           DELETE { listing_key | id } to delete row

function normalizeId(body: any): { by: 'listing_key' | 'id', value: string } | null {
  const id = (body?.id ?? body?.property_id ?? '').toString().trim()
  const listingKey = (body?.listing_key ?? '').toString().trim()
  if (listingKey) return { by: 'listing_key', value: listingKey }
  if (id) return { by: 'id', value: id }
  return null
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const idInfo = normalizeId(body)
    if (!idInfo) return NextResponse.json({ ok: false, error: 'listing_key or id required' }, { status: 400 })
    const updates: Record<string, any> = {}
    if (typeof body.hidden === 'boolean') updates.hidden = body.hidden
    if (!Object.keys(updates).length) return NextResponse.json({ ok: false, error: 'no updates provided' }, { status: 400 })
    const pool = await getPgPool()
    const whereCol = idInfo.by === 'listing_key' ? 'listing_key' : 'id'
    const sql = `UPDATE properties SET ${Object.keys(updates).map((k, i) => `${k} = $${i+1}`).join(', ')} WHERE ${whereCol} = $${Object.keys(updates).length + 1}`
    const values = [...Object.values(updates), idInfo.value]
    await pool.query(sql, values)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  // Support HTML form override for DELETE
  const ct = req.headers.get('content-type') || ''
  if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
    const form = await req.formData()
    const method = (form.get('_method') || '').toString().toUpperCase()
    if (method === 'DELETE') {
      const id = (form.get('id') || form.get('listing_key') || '').toString()
      if (!id) return NextResponse.json({ ok: false, error: 'id or listing_key required' }, { status: 400 })
      try {
        const pool = await getPgPool()
        // Try delete by listing_key first then id
        const res = await pool.query('DELETE FROM properties WHERE listing_key = $1 OR id::text = $1', [id])
        return NextResponse.json({ ok: true, deleted: res.rowCount })
      } catch (err: any) {
        return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 })
      }
    }
  }
  return NextResponse.json({ ok: false, error: 'Unsupported' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const idInfo = normalizeId(body)
    if (!idInfo) return NextResponse.json({ ok: false, error: 'listing_key or id required' }, { status: 400 })
    const pool = await getPgPool()
    const whereCol = idInfo.by === 'listing_key' ? 'listing_key' : 'id'
    const sql = `DELETE FROM properties WHERE ${whereCol} = $1`
    await pool.query(sql, [idInfo.value])
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 })
  }
}

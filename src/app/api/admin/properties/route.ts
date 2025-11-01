import { NextResponse } from 'next/server'
import { pool } from '../../../../lib/db/connection'
export const runtime = 'nodejs'

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })
  // Build dynamic UPDATE ... SET ... WHERE id = $N
  const keys = Object.keys(updates)
  if (!keys.length) return NextResponse.json({ ok: false, error: 'no updates provided' }, { status: 400 })
  const setSql = keys.map((k, i) => `${k} = $${i + 1}`).join(', ')
  const sql = `UPDATE properties SET ${setSql} WHERE id = $${keys.length + 1}`
  const values = [...Object.values(updates), id]
  await pool.query(sql, values)
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
  // Try to delete by id (text cast) or listing_key
  await pool.query('DELETE FROM properties WHERE id::text = $1 OR listing_key = $1', [id])
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
  await pool.query('DELETE FROM properties WHERE id::text = $1 OR listing_key = $1', [id])
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}

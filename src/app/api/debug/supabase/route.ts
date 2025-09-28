import { NextRequest, NextResponse } from 'next/server'
import { assertSameProjectOrThrow } from '@/lib/supabase-check'

export async function GET(_req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'disabled' }, { status: 404 })
  }
  try { await assertSameProjectOrThrow() } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
  const a = process.env.SUPABASE_URL || ''
  const b = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const mask = (v: string) => v ? v.replace(/https:\/\//,'').replace(/([a-z0-9]{6})[a-z0-9-]+(\.supabase\.co)/i,'$1***$2') : ''
  return NextResponse.json({
    SUPABASE_URL: mask(a),
    NEXT_PUBLIC_SUPABASE_URL: mask(b),
    sameProject: !!a && !!b && a === b
  })
}

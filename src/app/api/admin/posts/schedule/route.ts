import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supa = getSupabase()
  if (!supa) return NextResponse.json({ ok:false, error:'Supabase not configured' }, { status: 500 })
  try {
    const { id, scheduled_at } = await req.json()
    if (!id || !scheduled_at) return NextResponse.json({ ok:false, error:'id and scheduled_at required' }, { status: 400 })
    const { error } = await supa.from('posts').update({ scheduled_at, status: 'scheduled' }).eq('id', id)
    if (error) return NextResponse.json({ ok:false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok:true })
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message }, { status: 400 })
  }
}

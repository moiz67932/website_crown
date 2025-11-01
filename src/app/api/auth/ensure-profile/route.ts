import { NextRequest, NextResponse } from 'next/server'
import { supaServer } from '../../../../lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, email, user_metadata } = body || {}

    if (!id || !email) {
      return NextResponse.json({ error: 'Missing id or email' }, { status: 400 })
    }

    // Require an Authorization header with the user's access token to verify caller
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')

    const supabase = supaServer()

    // Verify the token belongs to the same user id
    const { data: userCheck, error: userErr } = await supabase.auth.getUser(token as string)
    if (userErr || !userCheck?.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    if (userCheck.user.id !== id) {
      return NextResponse.json({ error: 'Token user mismatch' }, { status: 403 })
    }

    const first_name = (user_metadata && user_metadata.first_name) || ''
    const last_name = (user_metadata && user_metadata.last_name) || ''
    const date_of_birth = (user_metadata && user_metadata.date_of_birth) || '1970-01-01'

    const { error } = await supabase.from('users').upsert(
      {
        id,
        email,
        first_name,
        last_name,
        date_of_birth,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )

    if (error) {
      console.error('ensure-profile upsert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('ensure-profile error:', e)
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supaBrowser } from '../../../../lib/supabase'

// This route triggers a reset email via Supabase client SDK (anon key)
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ success: false, message: 'Email required' }, { status: 400 })
    }

    const supabase = supaBrowser()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password`,
    })

    if (error) {
      console.error('Reset password error:', error)
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Password reset email sent' })
  } catch (e) {
    console.error('Reset password API error:', e)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

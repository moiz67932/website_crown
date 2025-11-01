import { NextRequest, NextResponse } from 'next/server'
import { SupabaseAuthService } from '../../../../lib/supabase-auth'
import { registerSchema } from '../../../../lib/validation'
import { AuthService } from '../../../../lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        },
        { status: 400 }
      )
    }

    const { firstName, lastName, email, password, dateOfBirth, referralCode } = parsed.data as any

    const result = await SupabaseAuthService.createUser({
      firstName,
      lastName,
      email,
      password,
      dateOfBirth,
      referralCode: referralCode || null
    })

    if (!result.success || !result.userId) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 })
    }

    // Your app's own JWT (separate from Supabase session)
    const token = AuthService.generateToken({
      userId: String(result.userId),
      email,
      name: `${firstName} ${lastName}`
    })

    const res = NextResponse.json({
      success: true,
      message: 'Registration successful',
      user: { id: result.userId, name: `${firstName} ${lastName}`, email, dateOfBirth }
    })

    res.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    })

    return res
  } catch (e) {
    console.error('Registration error:', e)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

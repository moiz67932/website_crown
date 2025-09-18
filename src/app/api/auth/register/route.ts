import { NextRequest, NextResponse } from 'next/server';
import { SupabaseAuthService } from '@/lib/supabase-auth';
import { registerSchema } from '@/lib/validation';
import { AuthService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input data
    const validationResult = registerSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed', 
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, password, dateOfBirth } = validationResult.data;

    // Create user with Supabase
    const result = await SupabaseAuthService.createUser({
      firstName,
      lastName,
      email,
      password,
      dateOfBirth
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    // Generate JWT token for session management
      const token = AuthService.generateToken({
        userId: Number(result.userId!),
        email,
        name: `${firstName} ${lastName}`
      });

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      message: 'Registration successful',
      user: {
        id: result.userId,
        name: `${firstName} ${lastName}`,
        email,
        dateOfBirth
      }
    });

    // Set authentication cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
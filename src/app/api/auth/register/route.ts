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

    // Create user with Supabase - this will create both auth user and profile
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

    // Now log the user in to get a proper session
    const loginResult = await SupabaseAuthService.loginUser({
      email,
      password
    });

    if (!loginResult.success || !loginResult.user) {
      return NextResponse.json(
        { success: false, message: 'User created but login failed. Please try logging in.' },
        { status: 500 }
      );
    }

    // Generate JWT token for session management
    const token = AuthService.generateToken({
      userId: Number(loginResult.user.id),
      email: loginResult.user.email,
      name: `${loginResult.user.first_name} ${loginResult.user.last_name}`
    });

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      message: 'Registration successful',
      user: {
        id: loginResult.user.id,
        name: `${loginResult.user.first_name} ${loginResult.user.last_name}`,
        email: loginResult.user.email,
        dateOfBirth: loginResult.user.date_of_birth
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

    console.log('Registration successful for user:', loginResult.user.email, 'Token set in cookie');

    return response;

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
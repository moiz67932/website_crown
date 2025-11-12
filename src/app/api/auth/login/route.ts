import { NextRequest, NextResponse } from 'next/server';
import { SupabaseAuthService } from '@/lib/supabase-auth';
import { loginSchema } from '@/lib/validation';
import { AuthService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input data
    const validationResult = loginSchema.safeParse(body);
    
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

    const { email, password } = validationResult.data;

    // Admin backdoor: allow admin credentials from environment variables
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'emamajbargh@gmail.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin!Passw0rd#2025';
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'emamajbargh@gmail.com';

    console.log('Login attempt for:', email);
    console.log('Admin username check:', email.toLowerCase() === ADMIN_USERNAME.toLowerCase());

    // Check if this is an admin login
    if (email.toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
      if (password !== ADMIN_PASSWORD) {
        return NextResponse.json(
          { success: false, message: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Generate admin token
      const token = AuthService.generateToken({
        userId: 0,
        email: ADMIN_EMAIL,
        name: 'Administrator',
        isAdmin: true,
      });

      const response = NextResponse.json({
        success: true,
        message: 'Login successful',
        user: {
          id: '0',
          email: ADMIN_EMAIL,
          first_name: 'Admin',
          last_name: 'User',
          is_admin: true,
        }
      });

      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });

      return response;
    }

    // Regular user login with Supabase
    console.log('Attempting Supabase login for:', email);
    const result = await SupabaseAuthService.loginUser({ email, password });

    console.log('Supabase login result:', result.success, result.message);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 401 }
      );
    }

    // Generate JWT token for session management
    const token = AuthService.generateToken({
      userId: Number(result.user!.id),
      email: result.user!.email,
      name: `${result.user!.first_name} ${result.user!.last_name}`,
      isAdmin: false,
    });

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: { ...result.user, is_admin: false }
    });

    // Set authentication cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    console.log('Login successful for user:', result.user!.email, 'Token set in cookie');

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { SupabaseAuthService } from '@/lib/supabase-auth';

export async function GET(request: NextRequest) {
  try {
    // Get current user from token
    const currentUser = AuthService.getCurrentUser(request);

    console.log('Auth check - Cookie present:', !!request.cookies.get('auth-token')?.value);
    console.log('Auth check - Current user:', currentUser ? currentUser.email : 'null');

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if this is an admin user (userId === 0)
    if (currentUser.userId === 0 || (currentUser as any).isAdmin) {
      return NextResponse.json({
        success: true,
        user: {
          userId: currentUser.userId,
          name: currentUser.name,
          email: currentUser.email,
          isAdmin: true,
          dateOfBirth: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
    }

    // Get fresh user data from Supabase for regular users
    const user = await SupabaseAuthService.getUserById(String(currentUser.userId));

    if (!user) {
      console.log('User not found in database for ID:', currentUser.userId);
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    console.log('Auth check successful for user:', user.email);
    
    return NextResponse.json({
      success: true,
      user: {
        userId: currentUser.userId,
        name: currentUser.name,
        email: currentUser.email,
        isAdmin: false,
        dateOfBirth: user.date_of_birth,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
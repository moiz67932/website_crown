import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { SupabaseAuthService } from '@/lib/supabase-auth';

export async function GET(request: NextRequest) {
  try {
    // Get current user from token
    const currentUser = AuthService.getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Admin token case has userId 0 and doesn't exist in Supabase; handle gently
    let user = null as any
    if (currentUser.isAdmin) {
      user = { created_at: new Date().toISOString(), updated_at: new Date().toISOString(), date_of_birth: null }
    } else {
      // Get fresh user data from Supabase
      user = await SupabaseAuthService.getUserById(String(currentUser.userId));
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        userId: currentUser.userId,
        name: currentUser.name,
        email: currentUser.email,
        isAdmin: !!currentUser.isAdmin,
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
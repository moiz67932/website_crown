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

    // Get fresh user data from Supabase
    const user = await SupabaseAuthService.getUserById(currentUser.userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        userId: currentUser.userId,
        name: currentUser.name,
        email: currentUser.email,
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
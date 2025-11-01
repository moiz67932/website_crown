import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '../../../../lib/auth';
import { SupabaseAuthService } from '../../../../lib/supabase-auth';

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
    if (currentUser.isAdmin || currentUser.userId === 0) {
      user = { created_at: new Date().toISOString(), updated_at: new Date().toISOString(), date_of_birth: null }
    } else {
      // Get fresh user data from Supabase. userId may be a UUID string or number.
      const id = typeof currentUser.userId === 'number' ? String(currentUser.userId) : currentUser.userId
      if (!id) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }
      user = await SupabaseAuthService.getUserById(id);
      if (!user && currentUser.email) {
        user = await SupabaseAuthService.getUserByEmail(currentUser.email)
      }
      // If Supabase misconfigured (e.g., invalid API key), still return a minimal user from token
      if (!user) {
        user = {
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          date_of_birth: null,
          // Optional marker for UI/debugging
          _fallback: true,
        }
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
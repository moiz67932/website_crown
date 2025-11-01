import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '../../../../lib/auth';
import { SupabaseAuthService } from '../../../../lib/supabase-auth';

export async function GET(request: NextRequest) {
  try {
    const currentUser = AuthService.getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

  const user = await SupabaseAuthService.getUserById(String(currentUser.userId));

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Parse JSON fields
    const preferences = user.preferences ? JSON.parse(user.preferences) : {};
    const notificationSettings = user.notification_settings ? JSON.parse(user.notification_settings) : {};

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        bio: user.bio,
        avatarUrl: user.avatar_url,
        dateOfBirth: user.date_of_birth,
        isEmailVerified: user.is_email_verified,
        preferences,
        notificationSettings,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLoginAt: user.last_login_at
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentUser = AuthService.getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      phone,
      bio,
      avatarUrl,
      preferences,
      notificationSettings
    } = body;

  const result = await SupabaseAuthService.updateUserProfile(String(currentUser.userId), {
      firstName,
      lastName,
      phone,
      bio,
      avatar_url: avatarUrl,
      preferences,
      notification_settings: notificationSettings
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

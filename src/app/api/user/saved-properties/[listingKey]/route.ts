import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { SavedPropertiesService } from '@/lib/database';

interface RouteParams { params: any }

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = AuthService.getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, notes, isFavorite } = body;

    // Ensure userId is a number
    const userId = typeof currentUser.userId === 'number' ? currentUser.userId : Number(currentUser.userId);

    if (action === 'update_notes') {
      if (notes === undefined) {
        return NextResponse.json(
          { success: false, message: 'Notes are required' },
          { status: 400 }
        );
      }

      const result = SavedPropertiesService.updatePropertyNotes(
        userId,
        params.listingKey,
        notes
      );

      return NextResponse.json({
        success: result.success,
        message: result.message
      });

    } else if (action === 'toggle_favorite') {
      if (isFavorite === undefined) {
        return NextResponse.json(
          { success: false, message: 'isFavorite status is required' },
          { status: 400 }
        );
      }

      const result = SavedPropertiesService.togglePropertyFavorite(
        userId,
        params.listingKey,
        isFavorite
      );

      return NextResponse.json({
        success: result.success,
        message: result.message
      });

    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Update saved property error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = AuthService.getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Ensure userId is a number
    const userId = typeof currentUser.userId === 'number' ? currentUser.userId : Number(currentUser.userId);

    const isSaved = SavedPropertiesService.isPropertySaved(userId, params.listingKey);

    return NextResponse.json({
      success: true,
      isSaved,
      listingKey: params.listingKey
    });

  } catch (error) {
    console.error('Check saved property error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

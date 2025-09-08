import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { SavedSearchesService } from '@/lib/database';

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
    const { name, searchCriteria, alertFrequency, isActive } = body;

    if (!name || !searchCriteria) {
      return NextResponse.json(
        { success: false, message: 'Name and search criteria are required' },
        { status: 400 }
      );
    }

    const searchId = parseInt(params.id);
    if (isNaN(searchId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid search ID' },
        { status: 400 }
      );
    }

    const result = SavedSearchesService.updateSavedSearch(
      currentUser.userId,
      searchId,
      name,
      searchCriteria,
      alertFrequency,
      isActive
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Update saved search error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = AuthService.getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const searchId = parseInt(params.id);
    if (isNaN(searchId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid search ID' },
        { status: 400 }
      );
    }

    const result = SavedSearchesService.deleteSavedSearch(currentUser.userId, searchId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Delete saved search error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

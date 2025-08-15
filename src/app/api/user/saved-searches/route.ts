import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { SavedSearchesService } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const currentUser = AuthService.getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const savedSearches = SavedSearchesService.getUserSavedSearches(currentUser.userId);

    // Parse search criteria for each saved search
    const formattedSearches = savedSearches.map(search => ({
      id: search.id,
      name: search.name,
      searchCriteria: JSON.parse(search.search_criteria),
      alertFrequency: search.alert_frequency,
      isActive: search.is_active,
      lastAlertSent: search.last_alert_sent,
      resultsCount: search.results_count,
      createdAt: search.created_at,
      updatedAt: search.updated_at
    }));

    return NextResponse.json({
      success: true,
      data: formattedSearches,
      count: formattedSearches.length
    });

  } catch (error) {
    console.error('Get saved searches error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = AuthService.getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, searchCriteria, alertFrequency = 'daily' } = body;

    if (!name || !searchCriteria) {
      return NextResponse.json(
        { success: false, message: 'Name and search criteria are required' },
        { status: 400 }
      );
    }

    const result = SavedSearchesService.saveSearch(
      currentUser.userId,
      name,
      searchCriteria,
      alertFrequency
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      searchId: result.searchId
    });

  } catch (error) {
    console.error('Save search error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

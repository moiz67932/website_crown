import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { SearchHistoryService } from '@/lib/database';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const searchHistory = SearchHistoryService.getUserSearchHistory(userId, limit);

    // Parse search filters for each history item
    const formattedHistory = searchHistory.map(item => ({
      id: item.id,
      searchQuery: item.search_query,
      searchFilters: item.search_filters ? JSON.parse(item.search_filters) : null,
      resultsCount: item.results_count,
      searchTimestamp: item.search_timestamp
    }));

    return NextResponse.json({
      success: true,
      data: formattedHistory,
      count: formattedHistory.length
    });

  } catch (error) {
    console.error('Get search history error:', error);
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

    // Ensure userId is a number
    const userId = typeof currentUser.userId === 'number' ? currentUser.userId : Number(currentUser.userId);

    const body = await request.json();
    const { searchQuery, searchFilters, resultsCount = 0 } = body;

    if (!searchQuery) {
      return NextResponse.json(
        { success: false, message: 'Search query is required' },
        { status: 400 }
      );
    }

    const result = SearchHistoryService.addSearchHistory(
      userId,
      searchQuery,
      searchFilters,
      resultsCount
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
    console.error('Add search history error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const result = SearchHistoryService.clearUserSearchHistory(userId);

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
    console.error('Clear search history error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

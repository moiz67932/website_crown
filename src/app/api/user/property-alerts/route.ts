import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { PropertyAlertsService } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const currentUser = AuthService.getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';

    const propertyAlerts = PropertyAlertsService.getUserPropertyAlerts(currentUser.userId);
    
    // Filter for unread only if requested
    const filteredAlerts = unreadOnly 
      ? propertyAlerts.filter(alert => !alert.is_read)
      : propertyAlerts;

    // Parse property data for each alert
    const formattedAlerts = filteredAlerts.map(alert => ({
      id: alert.id,
      savedSearchId: alert.saved_search_id,
      propertyId: alert.property_id,
      listingKey: alert.listing_key,
      alertType: alert.alert_type,
      property: JSON.parse(alert.property_data),
      isRead: alert.is_read,
      createdAt: alert.created_at
    }));

    // Get unread count
    const unreadCount = PropertyAlertsService.getUnreadAlertsCount(currentUser.userId);

    return NextResponse.json({
      success: true,
      data: formattedAlerts,
      count: formattedAlerts.length,
      unreadCount
    });

  } catch (error) {
    console.error('Get property alerts error:', error);
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
    const { savedSearchId, property, alertType } = body;

    if (!savedSearchId || !property || !alertType) {
      return NextResponse.json(
        { success: false, message: 'Saved search ID, property data, and alert type are required' },
        { status: 400 }
      );
    }

    const result = PropertyAlertsService.createPropertyAlert(
      currentUser.userId,
      savedSearchId,
      property,
      alertType
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
    console.error('Create property alert error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '../../../../lib/auth';
import { ViewedPropertiesService } from '../../../../lib/database';

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
    const limit = parseInt(searchParams.get('limit') || '50');

    const userIdNum = typeof currentUser.userId === 'number' ? currentUser.userId : null
    if (!userIdNum) {
      return NextResponse.json(
        { success: false, message: 'Viewed properties are not available for this account type' },
        { status: 400 }
      );
    }
    const viewedProperties = ViewedPropertiesService.getUserViewedProperties(userIdNum, limit);

    // Parse property data for each viewed property
    const formattedProperties = viewedProperties.map(viewed => ({
      id: viewed.id,
      propertyId: viewed.property_id,
      listingKey: viewed.listing_key,
      property: JSON.parse(viewed.property_data),
      viewDuration: viewed.view_duration,
      viewedAt: viewed.viewed_at
    }));

    return NextResponse.json({
      success: true,
      data: formattedProperties,
      count: formattedProperties.length
    });

  } catch (error) {
    console.error('Get viewed properties error:', error);
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
    const { property, viewDuration = 0 } = body;

    if (!property || !property.listing_key) {
      return NextResponse.json(
        { success: false, message: 'Property data and listing_key are required' },
        { status: 400 }
      );
    }

    const userIdNum = typeof currentUser.userId === 'number' ? currentUser.userId : null
    if (!userIdNum) {
      return NextResponse.json(
        { success: false, message: 'Viewed properties are not available for this account type' },
        { status: 400 }
      );
    }
    const result = ViewedPropertiesService.addViewedProperty(
      userIdNum,
      property,
      viewDuration
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
    console.error('Add viewed property error:', error);
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

    const userIdNum = typeof currentUser.userId === 'number' ? currentUser.userId : null
    if (!userIdNum) {
      return NextResponse.json(
        { success: false, message: 'Viewed properties are not available for this account type' },
        { status: 400 }
      );
    }
    const result = ViewedPropertiesService.clearUserViewedProperties(userIdNum);

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
    console.error('Clear viewed properties error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { SavedPropertiesService } from '@/lib/database';

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
    const onlyFavorites = searchParams.get('favorites') === 'true';

    const savedProperties = onlyFavorites 
      ? SavedPropertiesService.getUserFavoriteProperties(userId)
      : SavedPropertiesService.getUserSavedProperties(userId);

    // Parse property data for each saved property
    const formattedProperties = savedProperties.map(saved => ({
      id: saved.id,
      propertyId: saved.property_id,
      listingKey: saved.listing_key,
      property: JSON.parse(saved.property_data),
      notes: saved.notes,
      tags: saved.tags,
      isFavorite: saved.is_favorite,
      createdAt: saved.created_at,
      updatedAt: saved.updated_at
    }));

    return NextResponse.json({
      success: true,
      data: formattedProperties,
      count: formattedProperties.length
    });

  } catch (error) {
    console.error('Get saved properties error:', error);
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
    const { property, isFavorite = false, notes, tags } = body;

    if (!property || !property.listing_key) {
      return NextResponse.json(
        { success: false, message: 'Property data and listing_key are required' },
        { status: 400 }
      );
    }

    const result = SavedPropertiesService.saveProperty(
      userId,
      property,
      isFavorite,
      notes,
      tags
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
    console.error('Save property error:', error);
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

    const { searchParams } = new URL(request.url);
    const listingKey = searchParams.get('listingKey');

    if (!listingKey) {
      return NextResponse.json(
        { success: false, message: 'Listing key is required' },
        { status: 400 }
      );
    }

    const result = SavedPropertiesService.removeSavedProperty(userId, listingKey);

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
    console.error('Remove saved property error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

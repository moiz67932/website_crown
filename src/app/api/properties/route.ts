import { NextRequest, NextResponse } from 'next/server';
import { searchProperties, PropertySearchParams } from '@/lib/db/property-repo';

// Using Postgres backend now

// Removed legacy Trestle helpers – Postgres is the data source.

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
  console.log('🏠 Properties API: Fetching from Postgres...');
    
    // Extract query parameters
  const city = searchParams.get('city');
    const state = searchParams.get('state');
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
    const minBedrooms = searchParams.get('minBedrooms') ? Number(searchParams.get('minBedrooms')) : undefined;
    const maxBedrooms = searchParams.get('maxBedrooms') ? Number(searchParams.get('maxBedrooms')) : undefined;
    const minBathrooms = searchParams.get('minBathrooms') ? Number(searchParams.get('minBathrooms')) : undefined;
    const maxBathrooms = searchParams.get('maxBathrooms') ? Number(searchParams.get('maxBathrooms')) : undefined;
    const propertyType = searchParams.get('propertyType');
    const hasPool = searchParams.get('hasPool') === 'true';
    const hasView = searchParams.get('hasView') === 'true';
    const keywords = searchParams.get('keywords');
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 20;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : 0;

    // If user passes a full state name as 'city' (e.g. california), treat it as state filter to broaden results
    const knownStates: Record<string, string> = { california: 'CA', 'new york': 'NY', texas: 'TX', florida: 'FL' };
    const normalizedCity = city?.toLowerCase();
    const cityLooksLikeState = normalizedCity && knownStates[normalizedCity];

    const result = await searchProperties({
      city: cityLooksLikeState ? undefined : (city || undefined),
      state: state || (cityLooksLikeState ? knownStates[normalizedCity!] : undefined),
      minPrice,
      maxPrice,
      minBedrooms,
      maxBedrooms,
      minBathrooms,
      maxBathrooms,
      propertyType: propertyType === 'All' ? undefined : propertyType || undefined,
      hasPool: hasPool || undefined,
      hasView: hasView || undefined,
      limit,
      offset,
      sort: 'updated'
    });

  const data = result.properties.map((p: any) => ({
      id: p.listing_key,
      listing_key: p.listing_key,
  image: p.main_photo_url,
      property_type: p.property_type,
      address: (p as any).address || (p as any).cleaned_address || '',
      location: p.city,
      county: p.state_or_province,
      list_price: p.list_price || 0,
      bedrooms: p.bedrooms_total || 0,
      bathrooms: p.bathrooms_total || 0,
      living_area_sqft: p.living_area || 0,
      lot_size_sqft: p.lot_size_sq_ft || p.lot_size_sqft || 0,
  status: p.status === 'Active' ? 'FOR SALE' : (p.status || 'UNKNOWN'),
  statusColor: p.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800',
      publicRemarks: (p as any).public_remarks || '',
      favorite: false,
      _id: p.listing_key,
      images: [],
      main_image_url: p.main_image_url,
      photosCount: p.photos_count || 0,
      city: p.city,
      state: p.state_or_province,
      zip_code: (p as any).postal_code || '',
      latitude: p.latitude || 0,
      longitude: p.longitude || 0,
      createdAt: p.created_at || new Date().toISOString(),
      updatedAt: p.updated_at || new Date().toISOString()
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: result.hasMore
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching properties from Postgres:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch properties (database)',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// POST handler removed (legacy SQLite / Trestle path). Re-add if needed with PG search.

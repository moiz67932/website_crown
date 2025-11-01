import { NextRequest, NextResponse } from 'next/server';
import { getProperties } from '../../../lib/db/properties';
import { deriveDisplayName } from '../../../lib/display-name';
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || '18');
    const offset = Number(searchParams.get('offset') || '0');
    const city = searchParams.get('city') || undefined;
    const state = searchParams.get('state') || undefined;
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
    const minBedrooms = searchParams.get('minBedrooms') ? Number(searchParams.get('minBedrooms')) : undefined;
    const maxBedrooms = searchParams.get('maxBedrooms') ? Number(searchParams.get('maxBedrooms')) : undefined;
    const minBathrooms = searchParams.get('minBathrooms') ? Number(searchParams.get('minBathrooms')) : undefined;
    const maxBathrooms = searchParams.get('maxBathrooms') ? Number(searchParams.get('maxBathrooms')) : undefined;
    const propertyType = searchParams.get('propertyType') || undefined;
    const sortParam = (searchParams.get('sort') || 'updated') as any;

    const { properties, total } = await getProperties(limit, offset, {
      city, state, minPrice, maxPrice, minBedrooms, maxBedrooms, minBathrooms, maxBathrooms, propertyType
    }, sortParam);

    const data = properties.map(p => {
      const bedrooms = (p as any).bedrooms ?? null;
      return {
        id: p.listing_key,
        listing_key: p.listing_key,
        _id: p.listing_key,
        image: p.main_photo_url,
        main_image_url: p.main_photo_url,
        property_type: p.property_type,
        list_price: p.list_price ?? 0,
        days_on_market: (p as any).days_on_market ?? null,
        mls_status: (p as any).mls_status ?? null,
        bedrooms,
        bathrooms: p.bathrooms_total ?? 0,
        living_area_sqft: p.living_area ?? null,
        lot_size_sqft: (p as any).lot_size_sqft ?? null,
        city: p.city,
        state: (p as any).state,
        zip_code: (p as any).postal_code ?? '',
        status: p.status,
        photosCount: p.photos_count ?? 0,
        latitude: p.latitude ?? null,
        longitude: p.longitude ?? null,
        display_name: deriveDisplayName({
          listing_key: p.listing_key,
          address: (p as any).unparsed_address || (p as any).street_address || '',
          city: p.city,
          state: (p as any).state,
          raw_json: (p as any).raw_json
        })
      };
    });

    return NextResponse.json({
      success: true,
      data,
      pagination: { total, limit, offset, hasMore: offset + limit < total }
    });
  } catch (error: any) {
    console.error('[api/properties] error', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch properties', message: error.message }, { status: 500 });
  }
}

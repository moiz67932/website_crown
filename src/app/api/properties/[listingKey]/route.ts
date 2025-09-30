import { NextRequest, NextResponse } from 'next/server';
import { getPropertyByListingKey } from '@/lib/db/properties';
import { deriveDisplayName } from '@/lib/display-name';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ listingKey: string }> }) {
  try {
    const { listingKey } = await params;
    if (!listingKey) return NextResponse.json({ success: false, error: 'listingKey required' }, { status: 400 });
    const row = await getPropertyByListingKey(listingKey);
    if (!row) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    const images: string[] = (() => {
      const out: string[] = [];
      const media = (row as any).media_urls;
      if (Array.isArray(media)) out.push(...media.filter(Boolean));
      if (!out.length && (row as any).raw_json) {
        try {
          const raw = (row as any).raw_json;
          if (Array.isArray(raw?.Media)) out.push(...raw.Media.map((m: any) => m.MediaURL).filter(Boolean));
          if (Array.isArray(raw?.Photos)) out.push(...raw.Photos.map((p: any) => p.Url || p.url).filter(Boolean));
        } catch {}
      }
      if (!out.length && row.main_photo_url) out.push(row.main_photo_url);
      return out;
    })();

    const detail = {
      listing_key: row.listing_key,
      list_price: row.list_price ?? 0,
      address: (row as any).unparsed_address || (row as any).street_address || '',
      city: row.city,
      county: (row as any).county || (row as any).state,
      postal_code: (row as any).postal_code || '',
      latitude: row.latitude,
      longitude: row.longitude,
      property_type: row.property_type,
      bedrooms: (row as any).bedrooms_total ?? (row as any).bedrooms ?? 0,
      bathrooms: row.bathrooms_total ?? 0,
      living_area_sqft: row.living_area ?? null,
      lot_size_sqft: (row as any).lot_size_sqft ?? null,
      year_built: (row as any).year_built ?? null,
      status: row.status,
      days_on_market: (row as any).days_on_market ?? null,
      public_remarks: (row as any).public_remarks ?? (row as any).raw_json?.PublicRemarks ?? '',
      main_photo_url: images[0] || null,
      images,
      photosCount: row.photos_count ?? images.length,
      view: (row as any).view || null,
      pool_features: (row as any).pool_features || null,
      heating: (row as any).heating || null,
      cooling: (row as any).cooling || null,
      parking_features: (row as any).parking_features || null,
      garage_spaces: (row as any).garage_spaces || null,
      display_name: deriveDisplayName({
        listing_key: row.listing_key,
        address: (row as any).unparsed_address,
        city: row.city,
        state: (row as any).state,
        raw_json: (row as any).raw_json
      })
    };

    return NextResponse.json({ success: true, data: detail });
  } catch (error: any) {
    console.error('[api/properties/:id] error', error);
    return NextResponse.json({ success: false, error: 'Failed', message: error.message }, { status: 500 });
  }
}

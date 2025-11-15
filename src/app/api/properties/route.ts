// import { NextRequest, NextResponse } from 'next/server';
// import { searchProperties, PropertySearchParams } from '@/lib/db/property-repo';
// import { deriveDisplayName } from '@/lib/display-name';

// // Using Postgres backend now

// // Removed legacy Trestle helpers – Postgres is the data source.

// export async function GET(request: NextRequest) {
//   try {
//     const { searchParams } = new URL(request.url);
    
//   console.log('🏠 Properties API: Fetching from Postgres...');
    
//     // Extract query parameters
//   const city = searchParams.get('city');
//     const state = searchParams.get('state');
//     const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
//     const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
//     const minBedrooms = searchParams.get('minBedrooms') ? Number(searchParams.get('minBedrooms')) : undefined;
//     const maxBedrooms = searchParams.get('maxBedrooms') ? Number(searchParams.get('maxBedrooms')) : undefined;
//     const minBathrooms = searchParams.get('minBathrooms') ? Number(searchParams.get('minBathrooms')) : undefined;
//     const maxBathrooms = searchParams.get('maxBathrooms') ? Number(searchParams.get('maxBathrooms')) : undefined;
//     const propertyType = searchParams.get('propertyType');
//     const hasPool = searchParams.get('hasPool') === 'true';
//     const hasView = searchParams.get('hasView') === 'true';
//     const keywords = searchParams.get('keywords');
//     const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 20;
//     const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : 0;

//     // If user passes a full state name as 'city' (e.g. california), treat it as state filter to broaden results
//     const knownStates: Record<string, string> = { california: 'CA', 'new york': 'NY', texas: 'TX', florida: 'FL' };
//     const normalizedCity = city?.toLowerCase();
//     const cityLooksLikeState = normalizedCity && knownStates[normalizedCity];

//     const result = await searchProperties({
//       city: cityLooksLikeState ? undefined : (city || undefined),
//       state: state || (cityLooksLikeState ? knownStates[normalizedCity!] : undefined),
//       minPrice,
//       maxPrice,
//       minBedrooms,
//       maxBedrooms,
//       minBathrooms,
//       maxBathrooms,
//       propertyType: propertyType === 'All' ? undefined : propertyType || undefined,
//       hasPool: hasPool || undefined,
//       hasView: hasView || undefined,
//       limit,
//       offset,
//       sort: 'updated'
//     });

//   const data = result.properties.map((p: any) => {
//       // Attempt to derive a better address line (similar to detail endpoint logic) if not present
//       let baseAddress = (p as any).address || (p as any).cleaned_address || '';
//       if (!baseAddress) {
//         const raw = (p as any).raw_json;
//         try {
//           let parsed = raw;
//             if (parsed && typeof parsed === 'string') { try { parsed = JSON.parse(parsed); } catch {} }
//             if (parsed) {
//               baseAddress = parsed.UnparsedAddress || parsed.unparsed_address || '';
//               if (!baseAddress) {
//                 const num = parsed.StreetNumber || parsed.street_number || parsed.StreetNumberNumeric || '';
//                 const name = parsed.StreetName || parsed.street_name || '';
//                 const suffix = parsed.StreetSuffix || parsed.street_suffix || '';
//                 const unit = parsed.UnitNumber || parsed.unit_number || '';
//                 const pieces = [num, name, suffix].filter(Boolean).join(' ').trim();
//                 if (pieces) baseAddress = pieces + (unit ? ` #${unit}` : '');
//               }
//             }
//         } catch {}
//       }
//       const item = {
//         id: p.listing_key,
//         listing_key: p.listing_key,
//         image: p.main_photo_url,
//         property_type: p.property_type,
//         address: baseAddress,
//         location: p.city,
//         county: p.state_or_province,
//         list_price: p.list_price || 0,
//         bedrooms: p.bedrooms_total || 0,
//         bathrooms: p.bathrooms_total || 0,
//         living_area_sqft: p.living_area || 0,
//         lot_size_sqft: p.lot_size_sq_ft || p.lot_size_sqft || 0,
//         status: p.status === 'Active' ? 'FOR SALE' : (p.status || 'UNKNOWN'),
//         statusColor: p.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800',
//         publicRemarks: (p as any).public_remarks || '',
//         favorite: false,
//         _id: p.listing_key,
//         images: [],
//         main_image_url: p.main_photo_url,
//         photosCount: p.photos_count || 0,
//         city: p.city,
//         state: p.state_or_province,
//         zip_code: (p as any).postal_code || '',
//         latitude: p.latitude || 0,
//         longitude: p.longitude || 0,
//         createdAt: p.created_at || new Date().toISOString(),
//         updatedAt: p.updated_at || new Date().toISOString()
//       };
//       // Add display_name so frontend can use directly
//       (item as any).display_name = deriveDisplayName({
//         listing_key: p.listing_key,
//         address: item.address,
//         city: item.city,
//         state: item.state,
//         county: item.county,
//         raw_json: (p as any).raw_json
//       });
//       return item;
//     });

//     return NextResponse.json({
//       success: true,
//       data,
//       pagination: {
//         total: result.total,
//         limit,
//         offset,
//         hasMore: result.hasMore,
//         totalEstimated: (result as any).totalEstimated || false
//       }
//     });

//   } catch (error: any) {
//     console.error('❌ Error fetching properties from Postgres:', error);
//     return NextResponse.json(
//       { 
//         success: false, 
//         error: 'Failed to fetch properties (database)',
//         message: error.message 
//       },
//       { status: 500 }
//     );
//   }
// }

// // POST handler removed (legacy SQLite / Trestle path). Re-add if needed with PG search.









// app/api/properties/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { searchProperties } from '@/lib/db/property-repo';
import { deriveDisplayName } from '@/lib/display-name';

export const runtime = 'nodejs';          // ensure Node runtime (not edge) for GCP libs
export const dynamic = 'force-dynamic';   // avoid accidental SSG on this API

// Sanitize address to remove leading zeros and extra whitespace
function sanitizeAddress(addr: string): string {
  return addr.trim().replace(/^0+\s+/, '').replace(/\s{2,}/g, ' ');
}

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
    const keywords = searchParams.get('keywords') || undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 20;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : 0;

    // If a full state name is passed as "city", treat it as state to broaden results
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
      propertyType: propertyType === 'All' ? undefined : (propertyType || undefined),
      hasPool: hasPool || undefined,
      hasView: hasView || undefined,
      limit,
      offset,
      sort: 'updated',
    });

    const data = result.properties.map((p: any) => {
      // Address derivation fallback
      let baseAddress = (p as any).address || (p as any).cleaned_address || '';
      if (!baseAddress) {
        const raw = (p as any).raw_json;
        try {
          let parsed = raw;
          if (parsed && typeof parsed === 'string') { try { parsed = JSON.parse(parsed); } catch {} }
          if (parsed) {
            baseAddress =
              parsed.UnparsedAddress ||
              parsed.unparsed_address || '';
            if (!baseAddress) {
              const num = parsed.StreetNumber || parsed.street_number || parsed.StreetNumberNumeric || '';
              const name = parsed.StreetName || parsed.street_name || '';
              const suffix = parsed.StreetSuffix || parsed.street_suffix || '';
              const unit = parsed.UnitNumber || parsed.unit_number || '';
              const pieces = [num, name, suffix].filter(Boolean).join(' ').trim();
              if (pieces) baseAddress = pieces + (unit ? ` #${unit}` : '');
            }
          }
        } catch {}
      }

      const item = {
        // Primary identifiers - CANONICAL
        _id: p.listing_key,
        id: p.listing_key,
        listing_key: p.listing_key,
        
        // Pricing - CANONICAL
        list_price: p.list_price || 0,
        
        // Location - CANONICAL field names matching PropertyDetail
        address: sanitizeAddress(baseAddress),
        city: p.city,
        county: p.state_or_province, // CANONICAL: county field contains state abbreviation
        postal_code: (p as any).postal_code || '',
        latitude: p.latitude || 0,
        longitude: p.longitude || 0,
        
        // Property characteristics - CANONICAL field names
        property_type: p.property_type,
        bedrooms: p.bedrooms_total || null, // CANONICAL: bedrooms (not bedrooms_total)
        bathrooms: p.bathrooms_total || null, // CANONICAL: bathrooms (not bathrooms_total)
        living_area_sqft: p.living_area || null, // CANONICAL: living_area_sqft
        lot_size_sqft: p.lot_size_sq_ft || p.lot_size_sqft || 0,
        year_built: (p as any).year_built,
        
        // Images - CANONICAL
        images: [],
        main_image_url: p.main_photo_url,
        image: p.main_photo_url, // Legacy support
        
        // Status and metadata
        status: p.status === 'Active' ? 'FOR SALE' : (p.status || 'UNKNOWN'),
        statusColor: p.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800',
        days_on_market: (p as any).days_on_market,
        
        // Descriptions - CANONICAL
        public_remarks: (p as any).public_remarks || '',
        h1_heading: (p as any).h1_heading,
        title: (p as any).title,
        seo_title: (p as any).seo_title,
        
        // Additional fields
        photosCount: p.photos_count || 0,
        favorite: false,
        createdAt: p.created_at || new Date().toISOString(),
        updatedAt: p.updated_at || new Date().toISOString(),
        
        // Legacy fields for backward compatibility
        location: p.city,
        state: p.state_or_province,
        zip_code: (p as any).postal_code || '',
        publicRemarks: (p as any).public_remarks || '',
      };

      (item as any).display_name = deriveDisplayName({
        listing_key: p.listing_key,
        address: item.address,
        city: item.city,
        state: item.state,
        county: item.county,
        raw_json: (p as any).raw_json,
      });

      return item;
    });

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: result.hasMore,
        totalEstimated: (result as any).totalEstimated || false,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching properties from Postgres:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch properties (database)',
        message: error?.message || 'Unknown error',
      },
      { status: 500 },
    );
  }
}

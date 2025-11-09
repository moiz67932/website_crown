// import { NextRequest, NextResponse } from 'next/server';
// import { getPropertyByListingKey } from '@/lib/db/property-repo';

// // Now sourcing from Postgres rather than external Trestle API

// // Removed Trestle transformation helpers – now direct DB mapping

// export async function GET(
//   _request: NextRequest,
//   { params }: { params: Promise<{ listingKey: string }> }
// ) {
//   try {
//     const { listingKey } = await params;
    
//     console.log('🏠 Fetching single property:', listingKey);
    
//     if (!listingKey || listingKey === 'undefined') {
//       return NextResponse.json(
//         { success: false, error: 'Valid listing key is required' },
//         { status: 400 }
//       );
//     }

//     // Fetch property from Postgres
//     const row = await getPropertyByListingKey(listingKey);
//     if (!row) {
//       return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
//     }
//     // Images: prefer media_urls array, then raw_json.Media/Photos, finally main_photo_url
//     const images: string[] = (() => {
//       const out: string[] = [];
//       const media = (row as any).media_urls;
//       if (Array.isArray(media) && media.length) return media.filter(Boolean);
//       const raw = (row as any).raw_json;
//       try {
//         if (raw) {
//           if (Array.isArray(raw.Media)) {
//             const urls = raw.Media.map((m: any) => m.MediaURL).filter(Boolean);
//             if (urls.length) return urls;
//           }
//           if (Array.isArray(raw.Photos)) {
//             const urls = raw.Photos.map((p: any) => p.Url || p.url).filter(Boolean);
//             if (urls.length) return urls;
//           }
//         }
//       } catch {}
//       if ((row as any).main_photo_url) out.push((row as any).main_photo_url);
//       return out;
//     })();

//     // Derive a reliable address (previously could be blank, causing UI to fallback to listing_key)
//     let derivedAddress: string = (row as any).unparsed_address || (row as any).address || '';
//     let raw: any = (row as any).raw_json;
//     if (raw && typeof raw === 'string') {
//       try { raw = JSON.parse(raw); } catch { /* ignore parse error */ }
//     }
//     if (!derivedAddress && raw) {
//       derivedAddress = raw.UnparsedAddress || raw.unparsed_address || '';
//     }
//     if (!derivedAddress && raw) {
//       const num = raw.StreetNumber || raw.street_number || raw.StreetNumberNumeric || '';
//       const name = raw.StreetName || raw.street_name || '';
//       const suffix = raw.StreetSuffix || raw.street_suffix || '';
//       const unit = raw.UnitNumber || raw.unit_number || '';
//       const pieces = [num, name, suffix].filter(Boolean).join(' ').trim();
//       if (pieces) {
//         derivedAddress = pieces + (unit ? ` #${unit}` : '');
//       }
//     }
//     // Fallback: city + state if still nothing
//     if (!derivedAddress) {
//       const city = (row as any).city || raw?.City || '';
//       const state = (row as any).state || raw?.StateOrProvince || '';
//       if (city || state) derivedAddress = [city, state].filter(Boolean).join(', ');
//     }
//     // Final guard
//     if (!derivedAddress) derivedAddress = (row as any).listing_key;

//     const detail = {
//       _id: row.listing_key,
//       listing_key: row.listing_key,
//       listing_id: row.listing_key,
//       list_price: row.list_price || 0,
//       previous_list_price: (row as any).previous_list_price || null,
//       lease_amount: null,
//   address: derivedAddress,
//       city: (row as any).city || '',
//       county: (row as any).county || '',
//       postal_code: (row as any).postal_code || '',
//       latitude: (row as any).latitude || 0,
//       longitude: (row as any).longitude || 0,
//       property_type: (row as any).property_type || 'Residential',
//       property_sub_type: (row as any).property_sub_type || '',
//       bedrooms: (row as any).bedrooms || (row as any).bedrooms_total || 0,
//       bathrooms: (row as any).bathrooms_total || 0,
//       living_area_sqft: (row as any).living_area || 0,
//       lot_size_sqft: (row as any).lot_size_sqft || (row as any).lot_size_sq_ft || 0,
//       year_built: (row as any).year_built || 0,
//       zoning: null,
//       status: (row as any).status || '',
//       mls_status: (row as any).status || '',
//       days_on_market: (row as any).days_on_market || 0,
//       listing_contract_date: (row as any).listing_contract_date || '',
//       public_remarks: (row as any).public_remarks || ((row as any).raw_json?.PublicRemarks) || '',
//       subdivision_name: '',
//       main_photo_url: images[0] || null,
//       images,
//       photosCount: (row as any).photos_count || images.length,
//       list_agent_full_name: (row as any).list_agent_full_name || '',
//       list_office_name: (row as any).list_office_name || '',
//       list_agent_email: '',
//       list_agent_phone: '',
//       lease_considered: false,
//       lease_amount_frequency: null,
//       modification_timestamp: (row as any).modification_ts || '',
//       on_market_timestamp: (row as any).first_seen_ts || '',
//       agent_phone: '',
//       agent_email: '',
//       agent_office_email: '',
//       agent_office_phone: '',
//       ListAgentLastName: '',
//       ListAgentURL: null,
//       possible_use: null,
//       price_change_timestamp: (row as any).price_change_ts || null,
//       VirtualTourURLUnbranded: null,
//       view: (row as any).view || '',
//       Utilities: null,
//       LotFeatures: null,
//       ShowingContactName: null,
//       current_price: row.list_price || 0,
//       seo_title: null,
//       faq_content: null,
//       h1_heading: null,
//       amenities_content: null,
//       page_content: null,
//       meta_description: null,
//       title: null,
//       other_info: {},
//       interior_features: (row as any).interior_features || '',
//       stories: (row as any).stories || 1,
//       pool_features: (row as any).pool_features || '',
//       parking_total: (row as any).parking_total?.toString() || '0',
//       garage_size: (row as any).garage_spaces?.toString() || '0',
//       heating: (row as any).heating || '',
//       cooling: (row as any).cooling || '',
//       security_features: (row as any).security_features || '',
//       parking_features: (row as any).parking_features || '',
//       laundry_features: (row as any).laundry_features || '',
//     };

//     return NextResponse.json({ success: true, data: detail });

//   } catch (error: any) {
//     console.error('❌ Error fetching property detail:', error);
//     return NextResponse.json(
//       { 
//         success: false, 
//         error: 'Failed to fetch property',
//         message: error.message 
//       },
//       { status: 500 }
//     );
//   }
// }



































// /src/app/api/properties/[id]/route.ts
import { NextResponse } from "next/server";
import {
  getPropertyByListingKey,
  getPropertyMediaByListingKey,
} from "@/lib/db/property-repo";

function parseMaybeJSON<T>(raw: any): T | null {
  if (!raw) return null;
  try {
    if (Array.isArray(raw)) return raw as unknown as T;
    if (typeof raw === "string") return JSON.parse(raw) as T;
    return raw as T;
  } catch {
    return null;
  }
}

function num(n: any): number | null {
  if (n === null || n === undefined || n === "") return null;
  const v = Number(n);
  return Number.isFinite(v) ? v : null;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const listingKey = params.id;

    const p = await getPropertyByListingKey(listingKey);
    if (!p) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Prefer media table (GCS public URLs).
    const media = await getPropertyMediaByListingKey(listingKey);
    const mediaUrlsFromMedia = parseMaybeJSON<string[]>(media?.media_urls);
    const mediaUrlsFromProps = parseMaybeJSON<string[]>(p.media_urls);

    const images: string[] =
      (mediaUrlsFromMedia && mediaUrlsFromMedia.length > 0
        ? mediaUrlsFromMedia
        : mediaUrlsFromProps && mediaUrlsFromProps.length > 0
        ? mediaUrlsFromProps
        : p.main_photo_url
        ? [p.main_photo_url]
        : []
      ).filter(Boolean);

    // Build a normalized payload for the client
    const living_area_sqft = num(p.living_area);
    const lot_size_sqft = num(p.lot_size_sq_ft);

    const normalized = {
      // identifiers
      listing_key: p.listing_key,
      listing_id: p.listing_id,

      // naming / address
      title: p.unparsed_address || p.cleaned_address || null,
      h1_heading: null,
      seo_title: null,
      address: p.unparsed_address || p.cleaned_address || null,
      city: p.city || null,
      // Map state_or_province to both "state" and "county" so your UI line "{city}, {county}" shows something useful.
      state: p.state_or_province || null,
      county: p.state_or_province || null,
      postal_code: p.postal_code || null,
      country: p.country || "US",

      // geo
      latitude: num(p.latitude),
      longitude: num(p.longitude),

      // classification
      status: p.status,
      mls_status: p.mls_status,
      property_type: p.property_type,
      property_sub_type: p.property_sub_type,

      // measurements
      bedrooms: num(p.bedrooms_total),
      bathrooms: num(p.bathrooms_total),
      living_area_sqft,
      lot_size_sqft,
      year_built: num(p.year_built),

      // pricing
      list_price: num(p.list_price),
      original_list_price: num(p.original_list_price),
      price_per_sq_ft: num(p.price_per_sq_ft),

      // dates
      listed_at: p.listed_at || null,
      modification_timestamp: p.modification_timestamp || null,
      on_market_timestamp: p.on_market_date || p.listed_at || null,
      price_change_timestamp: p.price_change_timestamp || null,
      close_date: p.close_date || null,
      close_price: num(p.close_price),

      // days on market (rename to what UI expects)
      days_on_market: num(p.cumulative_days_on_market),

      // misc
      association_fee: num(p.association_fee),
      tax_annual_amount: num(p.tax_annual_amount),
      walk_score: num(p.walk_score),
      school_district_name: p.school_district_name || null,

      // media
      photos_count: num(p.photos_count),
      main_photo_url: media?.main_photo_url || p.main_photo_url || null,
      images,

      // extra slots UI references (safe defaults)
      other_info: {},
      interior_features: null,
      pool_features: null,
      view: null,
      stories: null,
      subdivision_name: null,
    };

    return NextResponse.json(normalized, { status: 200 });
  } catch (err: any) {
    console.error("[api/properties/:id] error", err);
    return NextResponse.json(
      { error: "Internal Server Error", detail: err?.message },
      { status: 500 }
    );
  }
}

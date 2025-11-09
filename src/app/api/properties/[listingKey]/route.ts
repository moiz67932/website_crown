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


































// /src/app/api/properties/[listingKey]/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getPropertyByListingKey,
  getPropertyMediaByListingKey,
} from "@/lib/db/property-repo";

// ---- helpers ---------------------------------------------------------------

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

function toNum(n: any): number | null {
  if (n === null || n === undefined || n === "") return null;
  const v = Number(n);
  return Number.isFinite(v) ? v : null;
}

// ---- route ----------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: { listingKey: string } }
) {
  try {
    const { listingKey } = params;

    if (!listingKey || listingKey === "undefined") {
      return NextResponse.json(
        { success: false, error: "Valid listing key is required" },
        { status: 400 }
      );
    }

    // Base row from properties
    const row = await getPropertyByListingKey(listingKey);
    if (!row) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 }
      );
    }

    // Prefer media from property_media (GCS public URLs), fallback to properties.media_urls, then main_photo_url
    const media = await getPropertyMediaByListingKey(listingKey);
    const mediaUrlsFromMedia = parseMaybeJSON<string[]>(media?.media_urls);
    const mediaUrlsFromProps = parseMaybeJSON<string[]>(row?.media_urls);

    const images: string[] = (
      (mediaUrlsFromMedia && mediaUrlsFromMedia.length
        ? mediaUrlsFromMedia
        : mediaUrlsFromProps && mediaUrlsFromProps.length
        ? mediaUrlsFromProps
        : row?.main_photo_url
        ? [row.main_photo_url]
        : []) as string[]
    ).filter(Boolean);

    // Derive address (keep your previous logic)
    let derivedAddress: string =
      (row as any).unparsed_address || (row as any).address || "";
    let raw: any = (row as any).raw_json;
    if (raw && typeof raw === "string") {
      try {
        raw = JSON.parse(raw);
      } catch {
        /* ignore */
      }
    }
    if (!derivedAddress && raw) {
      derivedAddress = raw.UnparsedAddress || raw.unparsed_address || "";
    }
    if (!derivedAddress && raw) {
      const num = raw.StreetNumber || raw.street_number || raw.StreetNumberNumeric || "";
      const name = raw.StreetName || raw.street_name || "";
      const suffix = raw.StreetSuffix || raw.street_suffix || "";
      const unit = raw.UnitNumber || raw.unit_number || "";
      const pieces = [num, name, suffix].filter(Boolean).join(" ").trim();
      if (pieces) {
        derivedAddress = pieces + (unit ? ` #${unit}` : "");
      }
    }
    if (!derivedAddress) {
      const city = (row as any).city || raw?.City || "";
      const state = (row as any).state_or_province || raw?.StateOrProvince || "";
      if (city || state) derivedAddress = [city, state].filter(Boolean).join(", ");
    }
    if (!derivedAddress) derivedAddress = (row as any).listing_key;

    // Normalize numbers
    const list_price = toNum(row.list_price) ?? 0;
    const bedrooms = toNum((row as any).bedrooms_total) ?? 0;
    const bathrooms = toNum((row as any).bathrooms_total) ?? 0;
    const living_area_sqft =
      toNum((row as any).living_area) ??
      toNum((row as any).living_area_sqft) ??
      0;
    const lot_size_sqft =
      toNum((row as any).lot_size_sqft) ??
      toNum((row as any).lot_size_sq_ft) ??
      0;
    const year_built = toNum((row as any).year_built) ?? 0;

    // Days on market: map cumulative_days_on_market -> days_on_market for your UI
    const days_on_market =
      toNum((row as any).cumulative_days_on_market) ??
      toNum((row as any).days_on_market) ??
      0;

    // State/county: your UI shows "{city}, {county}". Map county := state_or_province so it renders like "Lancaster, CA".
    const county =
      (row as any).county || (row as any).state_or_province || "";

    const detail = {
      _id: row.listing_key,
      listing_key: row.listing_key,
      listing_id: row.listing_key,

      list_price,
      previous_list_price: (row as any).previous_list_price || null,
      lease_amount: null,

      address: derivedAddress,
      city: (row as any).city || "",
      // keep both; UI uses county, search may use state
      state: (row as any).state_or_province || "",
      county,
      postal_code: (row as any).postal_code || "",

      latitude: toNum((row as any).latitude) ?? 0,
      longitude: toNum((row as any).longitude) ?? 0,

      property_type: (row as any).property_type || "Residential",
      property_sub_type: (row as any).property_sub_type || "",

      bedrooms,
      bathrooms,
      living_area_sqft,
      lot_size_sqft,
      year_built,

      zoning: null,

      status: (row as any).status || "",
      mls_status: (row as any).mls_status || (row as any).status || "",
      days_on_market,

      listing_contract_date: (row as any).listing_contract_date || "",
      public_remarks:
        (row as any).public_remarks ||
        (raw?.PublicRemarks ?? "") ||
        "",

      subdivision_name: "",

      main_photo_url: media?.main_photo_url || (row as any).main_photo_url || null,
      images,
      photosCount: (row as any).photos_count || images.length,

      list_agent_full_name: (row as any).list_agent_full_name || "",
      list_office_name: (row as any).list_office_name || "",

      list_agent_email: "",
      list_agent_phone: "",
      lease_considered: false,
      lease_amount_frequency: null,

      modification_timestamp: (row as any).modification_timestamp || (row as any).modification_ts || "",
      on_market_timestamp: (row as any).on_market_date || (row as any).listed_at || (row as any).first_seen_ts || "",

      agent_phone: "",
      agent_email: "",
      agent_office_email: "",
      agent_office_phone: "",
      ListAgentLastName: "",
      ListAgentURL: null,
      possible_use: null,

      price_change_timestamp: (row as any).price_change_timestamp || (row as any).price_change_ts || null,
      VirtualTourURLUnbranded: null,
      view: (row as any).view || "",

      Utilities: null,
      LotFeatures: null,
      ShowingContactName: null,

      current_price: list_price,

      // SEO / CMS fields your UI already references
      seo_title: null,
      faq_content: null,
      h1_heading: null,
      amenities_content: null,
      page_content: null,
      meta_description: null,
      title: null,

      other_info: {},

      interior_features: (row as any).interior_features || "",
      stories: (row as any).stories || 1,
      pool_features: (row as any).pool_features || "",
      parking_total: (row as any).parking_total?.toString() || "0",
      garage_size: (row as any).garage_spaces?.toString() || "0",
      heating: (row as any).heating || "",
      cooling: (row as any).cooling || "",
      security_features: (row as any).security_features || "",
      parking_features: (row as any).parking_features || "",
      laundry_features: (row as any).laundry_features || "",
    };

    return NextResponse.json({ success: true, data: detail }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Error fetching property detail:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch property",
        message: error?.message,
      },
      { status: 500 }
    );
  }
}

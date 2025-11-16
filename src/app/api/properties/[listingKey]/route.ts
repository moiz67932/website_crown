// /src/app/api/properties/[listingKey]/route.ts
import { NextResponse } from "next/server";
import {
  getPropertyByListingKey,
  getPropertyMediaByListingKey,
} from "@/lib/db/property-repo";

/** Utilities */
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

/** Route handler (one-arg form avoids param typing issues in Next 15) */
export async function GET(request: Request) {
  try {
    // Extract the dynamic segment from URL path: /api/properties/[listingKey]
    const { pathname } = new URL(request.url);
    const parts = pathname.replace(/\/+$/, "").split("/");
    const listingKey = parts[parts.length - 1]; // last segment

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

    // Log the raw row data to verify list_agent_dre is present
    console.log('🔍 Raw DB row for listing_key:', listingKey);
    console.log('📋 list_agent_dre from DB:', (row as any).list_agent_dre);
    console.log('📋 list_agent_full_name from DB:', (row as any).list_agent_full_name);

    // Prefer media from property_media (GCS URLs), fallback to properties.media_urls, then main_photo_url
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

    // Derive address
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
      const num =
        raw.StreetNumber || raw.street_number || raw.StreetNumberNumeric || "";
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

    // Days on market: map cumulative_days_on_market → days_on_market
    const days_on_market =
      toNum((row as any).cumulative_days_on_market) ??
      toNum((row as any).days_on_market) ??
      0;

    // Show "{city}, {county}" where county := state_or_province (e.g., "Lancaster, CA")
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
        (row as any).public_remarks || (raw?.PublicRemarks ?? "") || "",

      subdivision_name: "",

      main_photo_url:
        media?.main_photo_url || (row as any).main_photo_url || null,
      images,
      photosCount: (row as any).photos_count || images.length,

      list_agent_full_name: "",
      list_office_name: "",
      list_agent_dre: (row as any).list_agent_dre || null,

      list_agent_email: "",
      list_agent_phone: "",
      lease_considered: false,
      lease_amount_frequency: null,

      modification_timestamp:
        (row as any).modification_timestamp ||
        (row as any).modification_ts ||
        "",
      on_market_timestamp:
        (row as any).on_market_date ||
        (row as any).listed_at ||
        (row as any).first_seen_ts ||
        "",

      agent_phone: "",
      agent_email: "",
      agent_office_email: "",
      agent_office_phone: "",
      ListAgentLastName: "",
      ListAgentURL: null,
      possible_use: null,

      price_change_timestamp:
        (row as any).price_change_timestamp ||
        (row as any).price_change_ts ||
        null,
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
      stories: (row as any).stories_total || 1,
      pool_features: "",
      parking_total: "0",
      garage_size: "0",
      heating: (row as any).heating || "",
      cooling: (row as any).cooling || "",
      security_features: "",
      parking_features: "",
      laundry_features: "",
    };

    // Log the final detail object to verify list_agent_dre is included
    console.log('✅ Final API response detail object:');
    console.log('   list_agent_dre:', detail.list_agent_dre);
    console.log('   list_agent_full_name:', detail.list_agent_full_name);
    console.log('   list_office_name:', detail.list_office_name);

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

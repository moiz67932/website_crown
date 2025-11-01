import { NextRequest, NextResponse } from "next/server";
import { getPropertyByListingKey } from "../../../../lib/db/properties";
import { deriveDisplayName } from "../../../../lib/display-name";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ listingKey: string }> }
) {
  try {
    const { listingKey } = await params;
    if (!listingKey)
      return NextResponse.json(
        { success: false, error: "listingKey required" },
        { status: 400 }
      );

    const row = await getPropertyByListingKey(listingKey);
    if (!row)
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 }
      );

    // ✅ Normalize images (handle all malformed formats)
    const images: string[] = (() => {
      const out: string[] = [];
      const media = (row as any).media_urls;
      const main = (row as any).main_photo_url;

      try {
        // Case A: Already a proper array of URLs
        if (Array.isArray(media)) {
          out.push(...media.filter(Boolean));
        }

        // Case B: Array containing an object like [{ "media_urls": "[\"url1\",\"url2\"]" }]
        else if (
          Array.isArray(media) &&
          typeof media[0] === "object" &&
          media[0]?.media_urls
        ) {
          const parsed = JSON.parse(media[0].media_urls);
          if (Array.isArray(parsed)) out.push(...parsed.filter(Boolean));
        }

        // Case C: Stringified JSON array
        else if (typeof media === "string" && media.trim().startsWith("[")) {
          const parsed = JSON.parse(media);
          if (Array.isArray(parsed)) out.push(...parsed.filter(Boolean));
        }
      } catch (err) {
        console.warn("⚠️ Failed to parse media_urls:", listingKey, err);
      }

      // Case D: Try to pull from raw_json (Media or Photos arrays)
      if (!out.length && (row as any).raw_json) {
        const raw = (row as any).raw_json;
        try {
          if (Array.isArray(raw?.Media)) {
            out.push(
              ...raw.Media.map((m: any) => m.MediaURL).filter(Boolean)
            );
          }
          if (Array.isArray(raw?.Photos)) {
            out.push(
              ...raw.Photos.map((p: any) => p.Url || p.url).filter(Boolean)
            );
          }
        } catch (err) {
          console.warn("⚠️ Failed to extract from raw_json:", listingKey, err);
        }
      }

      // Case E: Fallback to main_photo_url
      if (!out.length && main) {
        out.push(main);
      }

      return out;
    })();

    // ✅ Build the normalized property object
    const detail = {
      listing_key: row.listing_key,
      list_price: row.list_price ?? 0,
      address:
        (row as any).unparsed_address ||
        (row as any).street_address ||
        "",
      city: row.city,
      county: (row as any).county || (row as any).state,
      postal_code: (row as any).postal_code || "",
      latitude: row.latitude,
      longitude: row.longitude,
      property_type: row.property_type,
      bedrooms: (row as any).bedrooms ?? 0,
      bathrooms: row.bathrooms_total ?? 0,
      living_area_sqft: row.living_area ?? null,
      lot_size_sqft: (row as any).lot_size_sqft ?? null,
      year_built: (row as any).year_built ?? null,
      status: row.status,
      mls_status: (row as any).mls_status ?? null,
      days_on_market: (row as any).days_on_market ?? null,
      public_remarks:
        (row as any).public_remarks ??
        (row as any).raw_json?.PublicRemarks ??
        "",
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
        raw_json: (row as any).raw_json,
      }),
    };

    return NextResponse.json({ success: true, data: detail });
  } catch (error: any) {
    console.error("[api/properties/:listingKey] error", error);
    return NextResponse.json(
      { success: false, error: "Failed", message: error.message },
      { status: 500 }
    );
  }
}

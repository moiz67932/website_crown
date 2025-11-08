import type { Pool } from "pg";

// NOTE: only reading the columns you showed in your schema dump.
// Do NOT compute/derive anything here.
export async function getPropertyRowWithMedia(listingKey: string) {
  // Use your existing Cloud SQL pool creator
  const db = await import("@/lib/db");
  const pool: Pool = typeof (db as any).makeCloudSqlPool === "function"
    ? await (db as any).makeCloudSqlPool()
    : (await (db as any).pool?.()) || await (db as any).default?.();

  const { rows } = await pool.query(
    `
    SELECT
      -- properties columns (exactly what you have)
      p.tax_annual_amount,
      p.living_area,
      p.latitude,
      p.longitude,
      p.year_built,
      p.listed_at,
      p.modification_timestamp,
      p.on_market_date,
      p.lot_size_sq_ft,
      p.original_list_price,
      p.price_change_timestamp,
      p.close_date,
      p.close_price,
      p.cumulative_days_on_market,
      p.association_fee,
      p.walk_score,
      p.price_per_sq_ft,
      p.is_luxury,
      p.updated_at,
      p.created_at,
      p.photos_count,
      p.media_urls        AS p_media_urls,
      p.source_updated_at,
      p.last_seen_ts,
      p.list_price,
      p.bedrooms_total,
      p.bathrooms_total,
      p.status,
      p.mls_status,
      p.property_type,
      p.search_keywords,
      p.main_photo_url    AS p_main_photo_url,
      p.listing_id,
      p.source_hash,
      p.school_district_name,
      p.elementary_school_name,
      p.middle_school_name,
      p.property_sub_type,
      p.high_school_name,
      p.unparsed_address,
      p.city,
      p.state_or_province,
      p.postal_code,
      p.country,
      p.cleaned_address,
      p.listing_key,

      -- property_media columns
      pm.media_urls       AS pm_media_urls,
      pm.main_photo_url   AS pm_main_photo_url,
      pm.last_seen_ts     AS pm_last_seen_ts
    FROM properties p
    LEFT JOIN property_media pm
      ON pm.listing_key = p.listing_key
    WHERE p.listing_key = $1
    LIMIT 1
    `,
    [listingKey]
  );

  return rows[0] || null;
}

// Parse and validate URLs coming from either table.
// We filter to real absolute URLs so <Image> never receives garbage strings,
// which prevents the "ERR_NAME_NOT_RESOLVED" errors in your console.
export function extractPhotoUrls(row: any): string[] {
  const urls: string[] = [];

  const pushIfUrl = (maybe: unknown) => {
    if (typeof maybe !== "string") return;
    try {
      const u = new URL(maybe);
      if (u.protocol === "https:" || u.protocol === "http:") {
        urls.push(u.toString());
      }
    } catch {
      // ignore non-URL strings
    }
  };

  // Prefer media table main first, then properties.main_photo_url
  if (row?.pm_main_photo_url) pushIfUrl(row.pm_main_photo_url);
  if (row?.p_main_photo_url)  pushIfUrl(row.p_main_photo_url);

  // Helper to try JSON then fallback to comma-separated list
  const absorbList = (raw: any) => {
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) parsed.forEach(pushIfUrl);
      else if (parsed && typeof parsed === "object") {
        // Some feeds store {urls:[...]}
        const arr = (parsed.urls ?? []) as unknown[];
        if (Array.isArray(arr)) arr.forEach(pushIfUrl);
      }
    } catch {
      String(raw)
        .split(",")
        .map(s => s.trim())
        .forEach(pushIfUrl);
    }
  };

  absorbList(row?.pm_media_urls);
  absorbList(row?.p_media_urls);

  // unique & keep order
  return Array.from(new Set(urls));
}
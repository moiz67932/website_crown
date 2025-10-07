import { z } from "zod";
import { pool } from "@/lib/db/connection";

// ---------------- Types ----------------
export const PropertySchema = z.object({
  listing_key: z.string(),
  list_price: z.number().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  postal_code: z.string().nullable().optional(),
  bedrooms: z.number().nullable().optional(),
  bathrooms_total: z.number().nullable(),
  living_area: z.number().nullable(),
  lot_size_sqft: z.number().nullable().optional(),
  property_type: z.string().nullable(),
  status: z.string().nullable(),
  mls_status: z.string().nullable().optional(),
  hidden: z.boolean().nullable().optional(),
  photos_count: z.number().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  main_photo_url: z.string().nullable().optional(),
  modification_ts: z.string().nullable().optional(),
  first_seen_ts: z.string().nullable().optional(),
  last_seen_ts: z.string().nullable().optional(),
  year_built: z.number().nullable().optional(),
  public_remarks: z.string().nullable().optional(),
  // NEW: days on market fields
  days_on_market: z.number().nullable().optional(),
  cumulative_days_on_market: z.number().nullable().optional(),
  // misc
  media_urls: z.any().optional(),
  raw_json: z.any().optional(),
});

export type Property = z.infer<typeof PropertySchema>;

export interface PropertyFilters {
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  propertyType?: string;
}

export type PropertySort = "price_asc" | "price_desc" | "newest" | "updated";

// ---------------- Public API ----------------
export async function getProperties(
  limit = 18,
  offset = 0,
  filters: PropertyFilters = {},
  sort: PropertySort = "updated"
) {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const values: any[] = [];
  const where: string[] = [
    "status = 'Active'",
    "(hidden IS NULL OR hidden = false)",
  ];

  const add = (cond: string, val?: any) => {
    if (val === undefined || val === null || val === "") return;
    values.push(val);
    where.push(cond.replace("$IDX", "$" + values.length));
  };

  add(
    "LOWER(city) LIKE LOWER($IDX)",
    filters.city ? `%${filters.city}%` : undefined
  );
  add("LOWER(state) = LOWER($IDX)", filters.state);
  add("list_price::float8 >= $IDX", filters.minPrice);
  add("list_price::float8 <= $IDX", filters.maxPrice);
  add("bedrooms >= $IDX", filters.minBedrooms);
  add("bedrooms <= $IDX", filters.maxBedrooms);
  add("bathrooms_total::float8 >= $IDX", filters.minBathrooms);
  add("bathrooms_total::float8 <= $IDX", filters.maxBathrooms);
  add(
    "LOWER(property_type) LIKE LOWER($IDX)",
    filters.propertyType ? `%${filters.propertyType}%` : undefined
  );

  const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";
  let orderBy = "modification_ts DESC NULLS LAST";
  switch (sort) {
    case "price_asc":
      orderBy = "list_price::float8 ASC NULLS LAST";
      break;
    case "price_desc":
      orderBy = "list_price::float8 DESC NULLS LAST";
      break;
    case "newest":
      orderBy = "first_seen_ts DESC NULLS LAST";
      break;
    case "updated":
    default:
      orderBy = "modification_ts DESC NULLS LAST";
  }
  values.push(safeLimit, offset);

  // Compute days_on_market if null using on_market_date/listing_contract_date/first_seen_ts
  const domExpr = `
    COALESCE(
      days_on_market,
      CASE
        WHEN on_market_date IS NOT NULL THEN GREATEST(0, (CURRENT_DATE - on_market_date)::int)
        WHEN listing_contract_date IS NOT NULL THEN GREATEST(0, (CURRENT_DATE - listing_contract_date)::int)
        WHEN first_seen_ts IS NOT NULL THEN GREATEST(0, (CURRENT_DATE - (first_seen_ts AT TIME ZONE 'UTC')::date)::int)
        ELSE NULL
      END
    )::int
  `;

  const sql = `
    SELECT 
      listing_key,
      list_price::float8 AS list_price,
      city,
      state,
      postal_code,
      bedrooms,
      bathrooms_total::float8 AS bathrooms_total,
      living_area::float8 AS living_area,
      lot_size_sqft::float8 AS lot_size_sqft,
      property_type,
      status,
      mls_status,
      hidden,
      photos_count,
      latitude,
      longitude,
      main_photo_url,
      ${domExpr} AS days_on_market,
      cumulative_days_on_market::int AS cumulative_days_on_market,
      modification_ts::text AS modification_ts,
      first_seen_ts::text AS first_seen_ts,
      last_seen_ts::text AS last_seen_ts,
      raw_json
    FROM properties
    ${whereSql}
    ORDER BY ${orderBy}
    LIMIT $${values.length - 1} OFFSET $${values.length};
  `;

  const countSql = `SELECT COUNT(*)::int AS cnt FROM properties ${whereSql}`;
  const countVals = values.slice(0, -2);

  try {
    const [listRes, countRes] = await Promise.all([
      pool.query(sql, values),
      pool.query(countSql, countVals),
    ]);

    const rows = listRes.rows || [];
    const parsed: Property[] = [];

    for (const row of rows) {
      const result = PropertySchema.safeParse(row);
      if (result.success) parsed.push(result.data);
      else console.warn("[properties] row validation failed", result.error.issues);
    }

    const total = countRes.rows?.[0]?.cnt ?? parsed.length;
    console.log("[properties]", {
      source: "cloudsql",
      count: parsed.length,
      offset,
      limit: safeLimit,
    });
    return { properties: parsed, total };
  } catch (e) {
    console.error("[properties] query failed:", e);
    throw e;
  }
}

export async function getPropertyByListingKey(listingKey: string) {
  // same DOM logic
  const domExpr = `
    COALESCE(
      days_on_market,
      CASE
        WHEN on_market_date IS NOT NULL THEN GREATEST(0, (CURRENT_DATE - on_market_date)::int)
        WHEN listing_contract_date IS NOT NULL THEN GREATEST(0, (CURRENT_DATE - listing_contract_date)::int)
        WHEN first_seen_ts IS NOT NULL THEN GREATEST(0, (CURRENT_DATE - (first_seen_ts AT TIME ZONE 'UTC')::date)::int)
        ELSE NULL
      END
    )::int
  `;
  const sql = `
    SELECT 
      listing_key,
      list_price::float8 AS list_price,
      city,
      state,
      postal_code,
      bedrooms,
      bathrooms_total::float8 AS bathrooms_total,
      living_area::float8 AS living_area,
      lot_size_sqft::float8 AS lot_size_sqft,
      property_type,
      status,
      mls_status,
      hidden,
      photos_count,
      latitude,
      longitude,
      main_photo_url,
      ${domExpr} AS days_on_market,
      cumulative_days_on_market::int AS cumulative_days_on_market,
      modification_ts::text AS modification_ts,
      first_seen_ts::text AS first_seen_ts,
      last_seen_ts::text AS last_seen_ts,
      raw_json
    FROM properties
    WHERE listing_key = $1 
      AND status='Active' 
      AND (hidden IS NULL OR hidden = false)
    LIMIT 1;
  `;
  const { rows } = await pool.query(sql, [listingKey]);
  const row = rows[0];
  if (!row) return null;
  const parsed = PropertySchema.safeParse(row);
  return parsed.success ? parsed.data : null;
}

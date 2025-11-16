// import { getPgPool } from "@/lib/db";

// export interface PropertyListItem {
//   listing_key: string;
//   list_price: number | null;
//   city: string | null;
//   state: string | null;
//   bedrooms_total: number | null;
//   bathrooms_total: number | null;
//   living_area: number | null;
//   lot_size_sq_ft: number | null;
//   property_type: string | null;
//   status: string | null;
//   photos_count: number | null;
//   latitude: number | null;
//   longitude: number | null;
//   main_photo_url: string | null;
//   modification_timestamp: string | null;
//   listed_at: string | null;
//   last_seen_ts: string | null;
// }

// export interface PropertySearchParams {
//    city?: string;
//   state?: string;
//   minPrice?: number;
//   maxPrice?: number;
//   minBedrooms?: number;
//   maxBedrooms?: number;
//   minBathrooms?: number;
//   maxBathrooms?: number;
//   propertyType?: string;
//   hasPool?: boolean;        // ← add this
//   hasView?: boolean;       // maybe add this
//   isWaterfront?: boolean;  // maybe add this
//   limit?: number;
//   offset?: number;
//   sort?: 'price_asc' | 'price_desc' | 'newest' | 'updated';
// }

// export async function searchProperties(params: PropertySearchParams) {
//   const pool = await getPgPool();
//   const started = Date.now();
//   const values: any[] = [];
//   const where: string[] = [`status = 'Active'`];

//   function log(event: string, extra?: Record<string, any>) {
//     try {
//       console.log(
//         JSON.stringify({
//           lvl: "debug",
//           at: "searchProperties",
//           event,
//           dur_ms: Date.now() - started,
//           ...extra,
//         })
//       );
//     } catch {}
//   }

//   function add(cond: string, val?: any) {
//     if (val === undefined || val === null) return;
//     values.push(val);
//     where.push(cond.replace("$IDX", `$${values.length}`));
//   }

//   function withTimeout<T>(
//     p: Promise<T>,
//     ms: number,
//     err: any,
//     rejectOnTimeout = false
//   ): Promise<any> {
//     let timer: NodeJS.Timeout;
//     const timeoutP = new Promise((resolve, reject) => {
//       timer = setTimeout(() => {
//         if (rejectOnTimeout) reject(err);
//         else resolve(err);
//       }, ms);
//     });
//     return Promise.race([p.finally(() => clearTimeout(timer)), timeoutP]);
//   }

//   // Filters
//   add("LOWER(city) LIKE LOWER($IDX)", params.city ? `%${params.city}%` : undefined);
//   add("LOWER(state_or_province) = LOWER($IDX)", params.state);
//   add("list_price >= $IDX", params.minPrice);
//   add("list_price <= $IDX", params.maxPrice);
//   add("bedrooms_total >= $IDX", params.minBedrooms);
//   add("bedrooms_total <= $IDX", params.maxBedrooms);
//   add("bathrooms_total >= $IDX", params.minBathrooms);
//   add("bathrooms_total <= $IDX", params.maxBathrooms);
//   add(
//     "LOWER(property_type) LIKE LOWER($IDX)",
//     params.propertyType ? `%${params.propertyType}%` : undefined
//   );

//   const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";

//   // Sorting
//   let orderBy = "modification_timestamp DESC NULLS LAST";
//   switch (params.sort) {
//     case "price_asc":
//       orderBy = "list_price ASC NULLS LAST";
//       break;
//     case "price_desc":
//       orderBy = "list_price DESC NULLS LAST";
//       break;
//     case "newest":
//       orderBy = "listed_at DESC NULLS LAST";
//       break;
//     case "updated":
//       orderBy = "modification_timestamp DESC NULLS LAST";
//       break;
//   }

//   const limit = params.limit ?? 20;
//   const offset = params.offset ?? 0;
//   const limitIndex = values.length + 1;
//   const offsetIndex = values.length + 2;
//   values.push(limit, offset);

//   // ✅ Clean SELECT (no trailing comma)
//   const sql = `
//     SELECT
//       listing_key,
//       status,
//       mls_status,
//       property_type,
//       photos_count,
//       main_photo_url,
//       media_urls,
//       list_price,
//       bedrooms_total,
//       bathrooms_total,
//       living_area,
//       city,
//       state_or_province AS state,
//       postal_code,
//       country,
//       latitude,
//       longitude,
//       year_built,
//       listing_id,
//       listed_at,
//       modification_timestamp,
//       on_market_date,
//       property_sub_type,
//       lot_size_sq_ft,
//       unparsed_address,
//       cleaned_address,
//       original_list_price,
//       price_change_timestamp,
//       close_date,
//       close_price,
//       cumulative_days_on_market,
//       association_fee,
//       tax_annual_amount,
//       walk_score,
//       school_district_name,
//       elementary_school_name,
//       middle_school_name,
//       high_school_name,
//       price_per_sq_ft,
//       is_luxury,
//       search_keywords,
//       updated_at,
//       created_at
//     FROM properties
//     ${whereSql}
//     ORDER BY ${orderBy}
//     LIMIT $${limitIndex} OFFSET $${offsetIndex};
//   `;

//   const countSql = `SELECT COUNT(*) FROM properties ${whereSql};`;
//   const baseValuesForCount = values.slice(0, values.length - 2);

//   const LIST_TIMEOUT_MS = Number(process.env.PROPERTY_LIST_TIMEOUT_MS || 20000);
//   const COUNT_TIMEOUT_MS = Number(process.env.PROPERTY_COUNT_TIMEOUT_MS || 10000);

//   const results: { list?: any; count?: any } = {};

//   try {
//     const listResult: any = await withTimeout(
//       pool.query(sql, values),
//       LIST_TIMEOUT_MS,
//       new Error("list-timeout"),
//       true
//     );
//     results.list = listResult;
//     log("list-success", { rows: listResult?.rowCount });

//     const countResult: any = await withTimeout(
//       pool.query(countSql, baseValuesForCount),
//       COUNT_TIMEOUT_MS,
//       new Error("count-timeout"),
//       false
//     );
//     results.count = countResult;
//     log("count-success", { count: countResult?.rows?.[0]?.count });
//   } catch (err: any) {
//     log("list-failure", { err: err?.message, code: err?.code });
//     throw err;
//   }

//   const total = parseInt(results.count?.rows?.[0]?.count || "0", 10);
//   return {
//     properties: results.list?.rows || [],
//     total,
//     hasMore: offset + limit < total,
//   };
// }


// // ───────────────────────────────────────────────
// //  Add this to src/lib/db/property-repo.ts
// // ───────────────────────────────────────────────
// export async function getPropertyByListingKey(listingKey: string) {
//   const pool = await getPgPool();
//   const sql = `
//     SELECT
//       listing_key,
//       status,
//       mls_status,
//       property_type,
//       photos_count,
//       main_photo_url,
//       media_urls,
//       list_price,
//       bedrooms_total,
//       bathrooms_total,
//       living_area,
//       city,
//       state_or_province AS state,
//       postal_code,
//       country,
//       latitude,
//       longitude,
//       year_built,
//       listing_id,
//       listed_at,
//       modification_timestamp,
//       on_market_date,
//       property_sub_type,
//       lot_size_sq_ft,
//       unparsed_address,
//       cleaned_address,
//       original_list_price,
//       price_change_timestamp,
//       close_date,
//       close_price,
//       cumulative_days_on_market,
//       association_fee,
//       tax_annual_amount,
//       walk_score,
//       school_district_name,
//       elementary_school_name,
//       middle_school_name,
//       high_school_name,
//       price_per_sq_ft,
//       is_luxury,
//       search_keywords,
//       updated_at,
//       created_at
//     FROM properties
//     WHERE listing_key = $1
//     LIMIT 1;
//   `;
//   const { rows } = await pool.query(sql, [listingKey]);
//   return rows[0] || null;
// }





























// /src/lib/db/property-repo.ts
import { getPgPool } from "@/lib/db";

export interface PropertyListItem {
  listing_key: string;
  list_price: number | null;
  city: string | null;
  state: string | null;
  bedrooms_total: number | null;
  bathrooms_total: number | null;
  living_area: number | null;
  lot_size_sq_ft: number | null;
  property_type: string | null;
  status: string | null;
  photos_count: number | null;
  latitude: number | null;
  longitude: number | null;
  main_photo_url: string | null;
  modification_timestamp: string | null;
  listed_at: string | null;
  last_seen_ts: string | null;
}

export interface PropertySearchParams {
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  propertyType?: string;
  propertyCategory?: string; // Filter by category: house, condo, townhouse, manufactured
  hasPool?: boolean;
  hasView?: boolean;
  isWaterfront?: boolean;
  limit?: number;
  offset?: number;
  sort?: "price_asc" | "price_desc" | "newest" | "updated";
}

export async function searchProperties(params: PropertySearchParams) {
  const pool = await getPgPool();
  const started = Date.now();
  const values: any[] = [];
  const where: string[] = [`status = 'Active'`];

  function log(event: string, extra?: Record<string, any>) {
    try {
      console.log(
        JSON.stringify({
          lvl: "debug",
          at: "searchProperties",
          event,
          dur_ms: Date.now() - started,
          ...extra,
        })
      );
    } catch {}
  }

  function add(cond: string, val?: any) {
    if (val === undefined || val === null) return;
    values.push(val);
    where.push(cond.replace("$IDX", `$${values.length}`));
  }

  function withTimeout<T>(
    p: Promise<T>,
    ms: number,
    err: any,
    rejectOnTimeout = false
  ): Promise<any> {
    let timer: NodeJS.Timeout;
    const timeoutP = new Promise((resolve, reject) => {
      timer = setTimeout(() => {
        if (rejectOnTimeout) reject(err);
        else resolve(err);
      }, ms);
    });
    return Promise.race([p.finally(() => clearTimeout(timer)), timeoutP]);
  }

  // Filters
  add("LOWER(city) LIKE LOWER($IDX)", params.city ? `%${params.city}%` : undefined);
  add("LOWER(state_or_province) = LOWER($IDX)", params.state);
  add("list_price >= $IDX", params.minPrice);
  add("list_price <= $IDX", params.maxPrice);
  add("bedrooms_total >= $IDX", params.minBedrooms);
  add("bedrooms_total <= $IDX", params.maxBedrooms);
  add("bathrooms_total >= $IDX", params.minBathrooms);
  add("bathrooms_total <= $IDX", params.maxBathrooms);
  add(
    "LOWER(property_type) LIKE LOWER($IDX)",
    params.propertyType ? `%${params.propertyType}%` : undefined
  );
  
  // Property category filter (house, condo, townhouse, manufactured)
  // Uses property_sub_type field from database
  if (params.propertyCategory) {
    add("LOWER(property_sub_type) LIKE LOWER($IDX)", `%${params.propertyCategory}%`);
  }

  const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";

  // Sorting with special handling for recommended sort
  // When sort is "updated" or not specified, prioritize properties in $3M-$5M range
  let orderBy = "modification_timestamp DESC NULLS LAST";
  switch (params.sort) {
    case "price_asc":
      orderBy = "list_price ASC NULLS LAST";
      break;
    case "price_desc":
      orderBy = "list_price DESC NULLS LAST";
      break;
    case "newest":
      orderBy = "listed_at DESC NULLS LAST";
      break;
    case "updated":
    default:
      // Prioritize $3M-$5M properties, then show rest by modification date
      orderBy = `
        CASE 
          WHEN list_price >= 3000000 AND list_price <= 5000000 THEN 0
          ELSE 1
        END,
        modification_timestamp DESC NULLS LAST
      `;
      break;
  }

  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;
  const limitIndex = values.length + 1;
  const offsetIndex = values.length + 2;
  values.push(limit, offset);

  const sql = `
    SELECT
      listing_key,
      status,
      mls_status,
      property_type,
      photos_count,
      main_photo_url,
      media_urls,
      list_price,
      bedrooms_total,
      bathrooms_total,
      living_area,
      city,
      state_or_province AS state,
      postal_code,
      country,
      latitude,
      longitude,
      year_built,
      listing_id,
      listed_at,
      modification_timestamp,
      on_market_date,
      property_sub_type,
      lot_size_sq_ft,
      unparsed_address,
      cleaned_address,
      original_list_price,
      price_change_timestamp,
      close_date,
      close_price,
      cumulative_days_on_market,
      association_fee,
      tax_annual_amount,
      walk_score,
      school_district_name,
      elementary_school_name,
      middle_school_name,
      high_school_name,
      price_per_sq_ft,
      is_luxury,
      search_keywords,
      updated_at,
      created_at
    FROM properties
    ${whereSql}
    ORDER BY ${orderBy}
    LIMIT $${limitIndex} OFFSET $${offsetIndex};
  `;

  const countSql = `SELECT COUNT(*) FROM properties ${whereSql};`;
  const baseValuesForCount = values.slice(0, values.length - 2);

  const LIST_TIMEOUT_MS = Number(process.env.PROPERTY_LIST_TIMEOUT_MS || 8000);
  const COUNT_TIMEOUT_MS = Number(process.env.PROPERTY_COUNT_TIMEOUT_MS || 5000);

  const results: { list?: any; count?: any } = {};

  try {
    const listResult: any = await withTimeout(
      pool.query(sql, values),
      LIST_TIMEOUT_MS,
      new Error("list-timeout"),
      true
    );
    results.list = listResult;
    log("list-success", { rows: listResult?.rowCount });

    const countResult: any = await withTimeout(
      pool.query(countSql, baseValuesForCount),
      COUNT_TIMEOUT_MS,
      new Error("count-timeout"),
      false
    );
    results.count = countResult;
    log("count-success", { count: countResult?.rows?.[0]?.count });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    log("list-failure", { err: errMsg, code: err?.code });
    
    // Provide helpful error message for common connection issues
    if (errMsg.includes('Connection terminated') || errMsg.includes('timeout') || errMsg.includes('ECONNREFUSED')) {
      console.error('❌ Database connection failed. Common causes:');
      console.error('   1. Cloud SQL firewall blocking direct IP connections');
      console.error('   2. Need to use Cloud SQL Proxy instead');
      console.error('   3. Check DATABASE_URL in .env.local');
      console.error('');
      console.error('💡 Solution: Use Cloud SQL Proxy');
      console.error('   Step 1: gcloud auth login');
      console.error('   Step 2: gcloud sql auth-proxy project-df2ac395-af0e-487d-a17:us-central1:ccos-sql --port=5432');
      console.error('   Step 3: Update DATABASE_URL=postgres://postgres:Marwah123@127.0.0.1:5432/redata');
    }
    
    throw err;
  }

  const total = parseInt(results.count?.rows?.[0]?.count || "0", 10);
  return {
    properties: results.list?.rows || [],
    total,
    hasMore: offset + limit < total,
  };
}

// === detail fetcher (properties)
export async function getPropertyByListingKey(listingKey: string) {
  const pool = await getPgPool();
  const sql = `
    SELECT
      listing_key,
      status,
      mls_status,
      property_type,
      photos_count,
      main_photo_url,
      media_urls,
      list_price,
      bedrooms_total,
      bathrooms_total,
      living_area,
      city,
      state_or_province,
      postal_code,
      country,
      latitude,
      longitude,
      year_built,
      listing_id,
      listed_at,
      modification_timestamp,
      on_market_date,
      property_sub_type,
      lot_size_sq_ft,
      unparsed_address,
      cleaned_address,
      original_list_price,
      price_change_timestamp,
      close_date,
      close_price,
      cumulative_days_on_market,
      association_fee,
      tax_annual_amount,
      walk_score,
      school_district_name,
      elementary_school_name,
      middle_school_name,
      high_school_name,
      price_per_sq_ft,
      is_luxury,
      search_keywords,
      list_agent_dre,
      public_remarks,
      interior_features,
      stories_total,
      heating,
      cooling,
      zoning,
      lot_features,
      property_condition,
      directions,
      water_source,
      updated_at,
      created_at
    FROM properties
    WHERE listing_key = $1
    LIMIT 1;
  `;
  const { rows } = await pool.query(sql, [listingKey]);
  return rows[0] || null;
}

// === detail fetcher (property_media)
export async function getPropertyMediaByListingKey(listingKey: string) {
  const pool = await getPgPool();
  const sql = `
    SELECT media_urls, main_photo_url, urls_hash, last_seen_ts
    FROM property_media
    WHERE listing_key = $1
    ORDER BY last_seen_ts DESC
    LIMIT 1;
  `;
  const { rows } = await pool.query(sql, [listingKey]);
  return rows[0] || null;
}

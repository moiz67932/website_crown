// import { getPgPool } from './connection';

// export interface PropertyListItem {
//   listing_key: string;
//   list_price: number | null;
//   city: string | null;
//   state: string | null;
//   bedrooms: number | null;
//   bathrooms_total: number | null;
//   living_area: number | null;
//   lot_size_sqft: number | null;
//   property_type: string | null;
//   status: string | null;
//   hidden?: boolean | null;
//   photos_count: number | null;
//   latitude: number | null;
//   longitude: number | null;
//   main_photo_url: string | null;
//   modification_ts: string | null;
//   first_seen_ts: string | null;
//   last_seen_ts: string | null;
// }

// export interface PropertyDetailRow extends PropertyListItem {
//   year_built: number | null;
//   days_on_market: number | null;
//   price_change_ts: string | null;
//   previous_list_price: number | null;
//   current_price: number | null;
//   pool_features: string | null;
//   view: string | null;
//   view_yn: boolean | null;
//   waterfront_yn: boolean | null;
//   heating: string | null;
//   cooling: string | null;
//   parking_features: string | null;
//   garage_spaces: number | null;
//   media_urls: any;
//   raw_json: any;
//   public_remarks?: string | null;
// }

// export interface PropertySearchParams {
//   city?: string;
//   state?: string;
//   minPrice?: number;
//   maxPrice?: number;
//   minBedrooms?: number;
//   maxBedrooms?: number;
//   minBathrooms?: number;
//   maxBathrooms?: number;
//   propertyType?: string;
//   hasPool?: boolean;
//   hasView?: boolean;
//   isWaterfront?: boolean;
//   keywords?: string[];
//   limit?: number;
//   offset?: number;
//   sort?: 'price_asc' | 'price_desc' | 'newest' | 'updated';
// }

// export async function getPropertyByListingKey(listingKey: string): Promise<PropertyDetailRow | null> {
//   const pool = await getPgPool();
//   const { rows } = await pool.query(
//     `SELECT * FROM properties WHERE listing_key = $1`,
//     [listingKey]
//   );
//   if (!rows[0]) return null;
//   const row = rows[0];
//   if (!row.public_remarks && row.raw_json) {
//     try { row.public_remarks = row.raw_json.PublicRemarks || row.raw_json.public_remarks || null; } catch {}
//   }
//   return row;
// }

// export async function searchProperties(params: PropertySearchParams) {
//   // Short-circuit during static builds or when landing external fetches are disabled.
//   // Setting SKIP_LANDING_EXTERNAL_FETCHES=1 (or VERCEL=1) prevents expensive DB/list queries
//   // from blocking the Next.js static export. Additionally detect when we're running inside
//   // a Next.js `next build` worker (process.argv contains 'next' and 'build') or when the
//   // env var NEXT_BUILD=1 is set by CI. In these cases return an empty result quickly so
//   // pages can be exported without waiting for external listing data.
//   const argv = Array.isArray(process.argv) ? process.argv.join(' ') : ''
//   const likelyNextBuild = argv.includes('next') && argv.includes('build')
//   if (
//     process.env.SKIP_LANDING_EXTERNAL_FETCHES === '1' ||
//     process.env.VERCEL === '1' ||
//     process.env.npm_lifecycle_event === 'build' ||
//     process.env.NPM_LIFECYCLE_EVENT === 'build' ||
//     process.env.NEXT_BUILD === '1' ||
//     likelyNextBuild
//   ) {
//     try {
//       // lightweight log to aid debugging during CI/builds
//       // eslint-disable-next-line no-console
//       console.log(JSON.stringify({ lvl: 'debug', at: 'searchProperties', event: 'skipped-due-to-skip-flag' }))
//     } catch {}
//     return { properties: [], total: 0, hasMore: false, totalEstimated: false }
//   }
//   const pool = await getPgPool();
//   const started = Date.now();
//   const values: any[] = [];
//   const where: string[] = ["status = 'Active'"];
//   // Exclude hidden properties from public search
//   where.push('(hidden IS NULL OR hidden = false)');

//   // Defensive cap on limit to avoid extremely large requests hammering DB
//   if (params.limit && params.limit > 1000) params.limit = 1000; // hard upper bound

//   function isTransient(err: any): boolean {
//     if (!err) return false;
//     const msg = String(err.message || err.toString() || '').toLowerCase();
//     const code = (err.code || '').toString();
//     return (
//       msg.includes('terminat') ||
//       msg.includes('econnreset') ||
//       msg.includes('server closed the connection unexpectedly') ||
//       msg.includes('timeout') ||
//       code === 'ECONNRESET' ||
//       // Postgres error codes for transient issues
//       ['57P01','57P02','57P03','53300','53400','08006','08000','HY000'].includes(code)
//     );
//   }

//   function log(event: string, extra?: Record<string, any>) {
//     // Lightweight structured logging (avoid noisy stack traces)
//     try {
//       // eslint-disable-next-line no-console
//       console.log(JSON.stringify({
//         lvl: 'debug',
//         at: 'searchProperties',
//         event,
//         dur_ms: Date.now() - started,
//         ...extra,
//       }));
//     } catch {}
//   }

//   function add(cond: string, val?: any) {
//     if (val === undefined || val === null) return;
//     values.push(val);
//     where.push(cond.replace('$IDX', '$' + values.length));
//   }

//   // Helper to race a promise against a timeout while ensuring the timeout is cleared
//   // when either side settles to avoid dangling timers or unhandled rejections.
//   function withTimeout<T>(p: Promise<T>, ms: number, timeoutValue: any, rejectOnTimeout = false): Promise<any> {
//     let timer: NodeJS.Timeout | null = null;
//     const timeoutP = new Promise((resolve, reject) => {
//       timer = setTimeout(() => {
//         if (rejectOnTimeout) reject(timeoutValue instanceof Error ? timeoutValue : new Error(String(timeoutValue)));
//         else resolve(timeoutValue);
//       }, ms);
//     });

//     return Promise.race([
//       p.then((res) => {
//         if (timer) clearTimeout(timer);
//         return res;
//       }).catch((err) => {
//         if (timer) clearTimeout(timer);
//         throw err;
//       }),
//       timeoutP.then((res) => {
//         if (timer) clearTimeout(timer);
//         return res;
//       }, (err) => {
//         if (timer) clearTimeout(timer);
//         throw err;
//       })
//     ]);
//   }

//   add('LOWER(city) LIKE LOWER($IDX)', params.city ? `%${params.city}%` : undefined);
//   add('LOWER(state) = LOWER($IDX)', params.state);
//   add('list_price >= $IDX', params.minPrice);
//   add('list_price <= $IDX', params.maxPrice);
//   add('bedrooms >= $IDX', params.minBedrooms);
//   add('bedrooms <= $IDX', params.maxBedrooms);
//   add('bathrooms_total >= $IDX', params.minBathrooms);
//   add('bathrooms_total <= $IDX', params.maxBathrooms);
//   add('LOWER(property_type) LIKE LOWER($IDX)', params.propertyType ? `%${params.propertyType}%` : undefined);
//   if (params.hasPool) where.push("(pool_features IS NOT NULL AND pool_features <> '')");
//   if (params.hasView) where.push("(view_yn = true OR (view IS NOT NULL AND view <> ''))");
//   if (params.isWaterfront) where.push('waterfront_yn = true');

//   // Keyword search across address & remarks & search_keywords array in raw_json if present
//   if (params.keywords && params.keywords.length) {
//     const keywordConds: string[] = [];
//     params.keywords.forEach((kw) => {
//       values.push(`%${kw}%`);
//       const ref = '$' + values.length;
//       keywordConds.push(`(LOWER(city) LIKE LOWER(${ref}) OR LOWER(state) LIKE LOWER(${ref}) OR LOWER(COALESCE(raw_json->>'PublicRemarks','')) LIKE LOWER(${ref}))`);
//     });
//     where.push('(' + keywordConds.join(' AND ') + ')');
//   }

//   const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

//   // Sorting
//   let orderBy = 'modification_ts DESC NULLS LAST';
//   switch (params.sort) {
//     case 'price_asc': orderBy = 'list_price ASC NULLS LAST'; break;
//     case 'price_desc': orderBy = 'list_price DESC NULLS LAST'; break;
//     case 'newest': orderBy = 'first_seen_ts DESC NULLS LAST'; break;
//     case 'updated': orderBy = 'modification_ts DESC NULLS LAST'; break;
//   }

//   const limit = params.limit ?? 20;
//   const offset = params.offset ?? 0;
//   values.push(limit, offset);

//   const sql = `SELECT listing_key, list_price, city, state, bedrooms, bathrooms_total, living_area, lot_size_sqft, property_type,
//       status, hidden, photos_count, latitude, longitude, main_photo_url, modification_ts, first_seen_ts, last_seen_ts, raw_json
//     FROM properties
//     ${whereSql}
//     ORDER BY ${orderBy}
//     LIMIT $${values.length - 1} OFFSET $${values.length}`;

//   const countSql = `SELECT COUNT(*) FROM properties ${whereSql}`;

//   const baseValuesForCount = values.slice(0, values.length - 2);

//   // Emit debug info about the built query (without dumping entire SQL if not needed)
//   const paramsPreview = values.map((v) => {
//     if (v === null || v === undefined) return v;
//     if (typeof v === 'string') return v.length > 80 ? v.slice(0, 80) + '…' : v;
//     return v;
//   });
//   log('list-build', {
//     where_count: where.length,
//     where_sql: whereSql.length > 800 ? (whereSql.slice(0, 800) + '…') : whereSql,
//     orderBy,
//     limit,
//     offset,
//     params_count: values.length,
//     params_preview: paramsPreview,
//   });

//   const MAX_RETRIES = 3;
//   const results: { list?: any; count?: any; estimated?: boolean } = {};
//   let attempt = 0;
//   let lastErr: any;

//   while (attempt <= MAX_RETRIES) {
//     const usePool = attempt === 0 ? pool : await getPgPool();
//     const attemptStart = Date.now();
//       try {
//   // First: run list query alone with shorter client timeout (default 20s)
//   const LIST_TIMEOUT_MS = Number(process.env.PROPERTY_LIST_TIMEOUT_MS || 20000);
//   const listResult: any = await withTimeout(usePool.query(sql, values), LIST_TIMEOUT_MS, new Error('list-timeout'), true);
//       results.list = listResult;
//       log('list-success', { attempt, rows: listResult?.rowCount });

//       // Second: run count query separately with shorter timeout (10s). If it times out, estimate.
//   const COUNT_TIMEOUT_MS = Number(process.env.PROPERTY_COUNT_TIMEOUT_MS || 10000);
//   const countOrTimeout: any = await withTimeout(usePool.query(countSql, baseValuesForCount), COUNT_TIMEOUT_MS, 'count-timeout', false);
//       if (countOrTimeout === 'count-timeout') {
//         // Fallback estimate: if we got 'limit' rows assume more exist; set estimated flag.
//         results.estimated = true;
//         const baseTotal = offset + listResult.rows.length;
//         const hasMore = listResult.rows.length === limit;
//         results.count = { rows: [{ count: String(hasMore ? baseTotal + 1 : baseTotal) }] };
//         log('count-timeout', { attempt, baseTotal, hasMore });
//       } else {
//         results.count = countOrTimeout;
//         log('count-success', { attempt, count: countOrTimeout?.rows?.[0]?.count });
//       }
//       break;
//     } catch (err: any) {
//       lastErr = err;
//       const transient = isTransient(err);
//       log('list-failure', { attempt, transient, err: err?.message, code: err?.code, elapsed_ms: Date.now() - attemptStart, limit, offset });
//       // Optional: attempt to fetch a quick EXPLAIN plan to diagnose slow queries (no ANALYZE to avoid execution)
//       if (String(err?.message || '').includes('list-timeout')) {
//         try {
//           const explainSql = 'EXPLAIN ' + sql;
//           const EXPLAIN_TIMEOUT_MS = Number(process.env.PROPERTY_EXPLAIN_TIMEOUT_MS || 5000);
//           const planRes: any = await withTimeout(usePool.query(explainSql, values), EXPLAIN_TIMEOUT_MS, 'explain-timeout', false);
//           if (planRes !== 'explain-timeout' && planRes?.rows) {
//             // Flatten first few lines of the plan for logs
//             const planLines = planRes.rows.map((r: any) => r['QUERY PLAN']).filter(Boolean).slice(0, 12);
//             log('explain-plan', { attempt, lines: planLines });
//           } else {
//             log('explain-skip', { attempt, reason: String(planRes) });
//           }
//         } catch (e: any) {
//           log('explain-error', { attempt, err: e?.message || String(e) });
//         }
//       }
//       if (!transient || attempt === MAX_RETRIES) {
//         throw err;
//       }
//       try {
//         const { resetPgPool } = await import('./connection');
//         await resetPgPool('transient-error-retry');
//       } catch {}
//       const backoff = Math.min(400 * 2 ** attempt, 3_000) + Math.random() * 120;
//       await new Promise(r => setTimeout(r, backoff));
//       attempt += 1;
//       continue;
//     }
//   }

//   if (!results.list || !results.count) {
//     // If we timed out repeatedly, return a safe fallback instead of crashing the page.
//     const isTimeout = String(lastErr?.message || lastErr || '').toLowerCase().includes('timeout');
//     if (isTimeout) {
//       log('timeout-fallback', { reason: String(lastErr?.message || lastErr || 'timeout'), limit, offset });
//       return { properties: [], total: 0, hasMore: false, totalEstimated: true };
//     }
//     throw lastErr || new Error('Unknown query failure');
//   }

//   const total = parseInt(results.count.rows[0].count, 10);
//   return {
//     properties: results.list.rows,
//     total,
//     hasMore: offset + limit < total,
//     totalEstimated: !!results.estimated
//   };
// }

























import { pool } from "./connection";

export interface PropertyListItem {
  listing_key: string;
  list_price: number | null;
  city: string | null;
  state: string | null;
  bedrooms: number | null;
  bathrooms_total: number | null;
  living_area: number | null;
  lot_size_sqft: number | null;
  property_type: string | null;
  status: string | null;
  hidden?: boolean | null;
  photos_count: number | null;
  latitude: number | null;
  longitude: number | null;
  main_photo_url: string | null;
  modification_ts: string | null;
  first_seen_ts: string | null;
  last_seen_ts: string | null;
}

export interface PropertyDetailRow extends PropertyListItem {
  year_built: number | null;
  days_on_market: number | null;
  price_change_ts: string | null;
  previous_list_price: number | null;
  current_price: number | null;
  pool_features: string | null;
  view: string | null;
  view_yn: boolean | null;
  waterfront_yn: boolean | null;
  heating: string | null;
  cooling: string | null;
  parking_features: string | null;
  garage_spaces: number | null;
  media_urls: any;
  raw_json: any;
  public_remarks?: string | null;
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
  hasPool?: boolean;
  hasView?: boolean;
  isWaterfront?: boolean;
  keywords?: string[];
  limit?: number;
  offset?: number;
  sort?: "price_asc" | "price_desc" | "newest" | "updated";
  // Hint to force exact city match (index-friendly) instead of OR/LIKE
  exactCity?: boolean;
}

function isTransient(err: any): boolean {
  const msg = String(err?.message || "").toLowerCase();
  const code = String((err && err.code) || "");
  return (
    msg.includes("terminat") ||
    msg.includes("reset") ||
    msg.includes("timeout") ||
    msg.includes("unexpectedly") ||
    ["57P01", "57P02", "57P03", "53300", "53400", "08006", "08000"].includes(
      code
    )
  );
}

function withTimeout<T>(
  p: Promise<T>,
  ms: number,
  timeoutValue: any,
  rejectOnTimeout = false
): Promise<any> {
  let t: NodeJS.Timeout | null = null;
  const timeout = new Promise((resolve, reject) => {
    t = setTimeout(
      () => (rejectOnTimeout ? reject(timeoutValue) : resolve(timeoutValue)),
      ms
    );
  });
  return Promise.race([
    p.finally(() => t && clearTimeout(t)),
    timeout,
  ]);
}

export async function getPropertyByListingKey(
  listingKey: string
): Promise<PropertyDetailRow | null> {
  
  const { rows } = await pool.query(
    `SELECT * FROM properties WHERE listing_key = $1`,
    [listingKey]
  );
  if (!rows[0]) return null;
  const row = rows[0];
  if (!row.public_remarks && row.raw_json) {
    try {
      row.public_remarks =
        row.raw_json.PublicRemarks || row.raw_json.public_remarks || null;
    } catch {}
  }
  return row;
}

export async function searchProperties(params: PropertySearchParams) {
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 50);
  const offset = Math.max(params.offset ?? 0, 0);
  

  const values: any[] = [];
  const where: string[] = ["status = 'Active'", "(hidden IS NULL OR hidden = false)"];

  const add = (cond: string, val?: any) => {
    if (val === undefined || val === null) return;
    values.push(val);
    where.push(cond.replace("$IDX", "$" + values.length));
  };

  const hasAnyFilter =
    !!params.city ||
    !!params.state ||
    params.minPrice != null ||
    params.maxPrice != null ||
    params.minBedrooms != null ||
    params.maxBedrooms != null ||
    params.minBathrooms != null ||
    params.maxBathrooms != null ||
    !!params.propertyType ||
    !!params.hasPool ||
    !!params.hasView ||
    !!params.isWaterfront ||
    (params.keywords && params.keywords.length > 0);

  // Prefer exact city match when flagged; otherwise allow LIKE fallback
  if (params.city) {
    if (params.exactCity) {
      add("LOWER(city) = LOWER($IDX)", params.city);
    } else {
      const exactRef = '$' + (values.push(params.city));
      const likeRef = '$' + (values.push(`%${params.city}%`));
      where.push(`(LOWER(city) = LOWER(${exactRef}) OR LOWER(city) LIKE LOWER(${likeRef}))`);
    }
  }
  add("LOWER(state) = LOWER($IDX)", params.state);
  add("list_price >= $IDX", params.minPrice);
  add("list_price <= $IDX", params.maxPrice);
  add("bedrooms >= $IDX", params.minBedrooms);
  add("bedrooms <= $IDX", params.maxBedrooms);
  add("bathrooms_total >= $IDX", params.minBathrooms);
  add("bathrooms_total <= $IDX", params.maxBathrooms);
  add(
    "LOWER(property_type) LIKE LOWER($IDX)",
    params.propertyType ? `%${params.propertyType}%` : undefined
  );

  if (params.hasPool) where.push("(pool_features IS NOT NULL AND pool_features <> '')");
  if (params.hasView)
    where.push("(view_yn = true OR (view IS NOT NULL AND view <> ''))");
  if (params.isWaterfront) where.push("waterfront_yn = true");

  if (params.keywords?.length) {
    const conds: string[] = [];
    for (const kw of params.keywords) {
      values.push(`%${kw}%`);
      const ref = "$" + values.length;
      conds.push(
        `(LOWER(city) LIKE LOWER(${ref}) OR LOWER(state) LIKE LOWER(${ref}) OR LOWER(COALESCE(raw_json->>'PublicRemarks','')) LIKE LOWER(${ref}))`
      );
    }
    where.push("(" + conds.join(" AND ") + ")");
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  let orderBy = "modification_ts DESC NULLS LAST";
  switch (params.sort) {
    case "price_asc":
      orderBy = "list_price ASC NULLS LAST"; break;
    case "price_desc":
      orderBy = "list_price DESC NULLS LAST"; break;
    case "newest":
      orderBy = "first_seen_ts DESC NULLS LAST"; break;
    case "updated":
      orderBy = "modification_ts DESC NULLS LAST"; break;
  }

  values.push(limit, offset);

  // Fast-path when no filters: avoid expensive sort if the index isn't there yet.
  // We try ORDER BY modification_ts first; if it times out, we fall back to a cheap order.
  const listSqlFiltered = `SELECT listing_key, list_price, city, state, bedrooms, bathrooms_total,
      living_area, lot_size_sqft, property_type, status, hidden, photos_count,
      latitude, longitude, main_photo_url, modification_ts, first_seen_ts, last_seen_ts, raw_json
    FROM properties
    ${whereSql}
    ORDER BY ${orderBy}
    LIMIT $${values.length - 1} OFFSET $${values.length}`;

  const listSqlFast = `SELECT listing_key, list_price, city, state, bedrooms, bathrooms_total,
      living_area, lot_size_sqft, property_type, status, hidden, photos_count,
      latitude, longitude, main_photo_url, modification_ts, first_seen_ts, last_seen_ts, raw_json
    FROM properties
    ${whereSql}
    ORDER BY listing_key DESC
    LIMIT $${values.length - 1} OFFSET $${values.length}`;

  const countSql = `SELECT COUNT(*) FROM properties ${whereSql}`;
  const countValues = values.slice(0, -2);

  const MAX_RETRIES = 2;
  let attempt = 0;

  while (true) {
    try {
  const LIST_TIMEOUT_MS = Number(process.env.PROPERTY_LIST_TIMEOUT_MS || 12_000);
  const COUNT_TIMEOUT_MS = Number(process.env.PROPERTY_COUNT_TIMEOUT_MS || 8_000);

      let listRes: any;

      // Try the filtered/ordered plan first
      try {
        listRes = await withTimeout(pool.query(listSqlFiltered, values), LIST_TIMEOUT_MS, new Error("list-timeout"), true);
      } catch (e: any) {
        // On timeout, retry once with the cheap order regardless of filters to avoid page stalls
        const isTimeout = String(e?.message || "").toLowerCase().includes("timeout");
        if (isTimeout) {
          try {
            listRes = await withTimeout(pool.query(listSqlFast, values), LIST_TIMEOUT_MS, new Error("list-timeout"), true);
          } catch (e2: any) {
            // If the fast path also times out, bail out quickly with an empty result to keep the page responsive
            const isTimeout2 = String(e2?.message || "").toLowerCase().includes("timeout");
            if (isTimeout2) {
              return {
                properties: [],
                total: 0,
                hasMore: false,
                totalEstimated: true,
              };
            }
            throw e2;
          }
        } else {
          throw e;
        }
      }

      // Independent count with short timeout (estimate on timeout)
      const countOrTimeout: any = await withTimeout(
        pool.query(countSql, countValues),
        COUNT_TIMEOUT_MS,
        "count-timeout",
        false
      );

      let total = 0;
      let totalEstimated = false;

      if (countOrTimeout === "count-timeout") {
        totalEstimated = true;
        const base = offset + listRes.rows.length;
        const hasMore = listRes.rows.length === limit;
        total = hasMore ? base + 1 : base;
      } else {
        total = parseInt(countOrTimeout.rows[0].count, 10);
      }

      return {
        properties: listRes.rows,
        total,
        hasMore: offset + limit < total,
        totalEstimated,
      };
    } catch (err) {
      if (isTransient(err) && attempt < MAX_RETRIES) {
        attempt += 1;
        const backoff = 400 * 2 ** attempt + Math.random() * 200;
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
      console.error("[properties] query failed:", err);
      throw err;
    }
  }
}

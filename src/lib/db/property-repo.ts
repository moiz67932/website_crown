import { getPgPool } from './connection';

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
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'updated';
}

export async function getPropertyByListingKey(listingKey: string): Promise<PropertyDetailRow | null> {
  const pool = await getPgPool();
  const { rows } = await pool.query(
    `SELECT * FROM properties WHERE listing_key = $1`,
    [listingKey]
  );
  if (!rows[0]) return null;
  const row = rows[0];
  if (!row.public_remarks && row.raw_json) {
    try { row.public_remarks = row.raw_json.PublicRemarks || row.raw_json.public_remarks || null; } catch {}
  }
  return row;
}

export async function searchProperties(params: PropertySearchParams) {
  const pool = await getPgPool();
  const started = Date.now();
  const values: any[] = [];
  const where: string[] = ["status = 'Active'"];

  // Defensive cap on limit to avoid extremely large requests hammering DB
  if (params.limit && params.limit > 1000) params.limit = 1000; // hard upper bound

  function isTransient(err: any): boolean {
    if (!err) return false;
    const msg = String(err.message || err.toString() || '').toLowerCase();
    const code = (err.code || '').toString();
    return (
      msg.includes('terminat') ||
      msg.includes('econnreset') ||
      msg.includes('server closed the connection unexpectedly') ||
      msg.includes('timeout') ||
      code === 'ECONNRESET' ||
      // Postgres error codes for transient issues
      ['57P01','57P02','57P03','53300','53400','08006','08000','HY000'].includes(code)
    );
  }

  function log(event: string, extra?: Record<string, any>) {
    // Lightweight structured logging (avoid noisy stack traces)
    try {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({
        lvl: 'debug',
        at: 'searchProperties',
        event,
        dur_ms: Date.now() - started,
        ...extra,
      }));
    } catch {}
  }

  function add(cond: string, val?: any) {
    if (val === undefined || val === null) return;
    values.push(val);
    where.push(cond.replace('$IDX', '$' + values.length));
  }

  // Helper to race a promise against a timeout while ensuring the timeout is cleared
  // when either side settles to avoid dangling timers or unhandled rejections.
  function withTimeout<T>(p: Promise<T>, ms: number, timeoutValue: any, rejectOnTimeout = false): Promise<any> {
    let timer: NodeJS.Timeout | null = null;
    const timeoutP = new Promise((resolve, reject) => {
      timer = setTimeout(() => {
        if (rejectOnTimeout) reject(timeoutValue instanceof Error ? timeoutValue : new Error(String(timeoutValue)));
        else resolve(timeoutValue);
      }, ms);
    });

    return Promise.race([
      p.then((res) => {
        if (timer) clearTimeout(timer);
        return res;
      }).catch((err) => {
        if (timer) clearTimeout(timer);
        throw err;
      }),
      timeoutP.then((res) => {
        if (timer) clearTimeout(timer);
        return res;
      }, (err) => {
        if (timer) clearTimeout(timer);
        throw err;
      })
    ]);
  }

  add('LOWER(city) LIKE LOWER($IDX)', params.city ? `%${params.city}%` : undefined);
  add('LOWER(state) = LOWER($IDX)', params.state);
  add('list_price >= $IDX', params.minPrice);
  add('list_price <= $IDX', params.maxPrice);
  add('bedrooms >= $IDX', params.minBedrooms);
  add('bedrooms <= $IDX', params.maxBedrooms);
  add('bathrooms_total >= $IDX', params.minBathrooms);
  add('bathrooms_total <= $IDX', params.maxBathrooms);
  add('LOWER(property_type) LIKE LOWER($IDX)', params.propertyType ? `%${params.propertyType}%` : undefined);
  if (params.hasPool) where.push("(pool_features IS NOT NULL AND pool_features <> '')");
  if (params.hasView) where.push("(view_yn = true OR (view IS NOT NULL AND view <> ''))");
  if (params.isWaterfront) where.push('waterfront_yn = true');

  // Keyword search across address & remarks & search_keywords array in raw_json if present
  if (params.keywords && params.keywords.length) {
    const keywordConds: string[] = [];
    params.keywords.forEach((kw) => {
      values.push(`%${kw}%`);
      const ref = '$' + values.length;
      keywordConds.push(`(LOWER(city) LIKE LOWER(${ref}) OR LOWER(state) LIKE LOWER(${ref}) OR LOWER(COALESCE(raw_json->>'PublicRemarks','')) LIKE LOWER(${ref}))`);
    });
    where.push('(' + keywordConds.join(' AND ') + ')');
  }

  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

  // Sorting
  let orderBy = 'modification_ts DESC NULLS LAST';
  switch (params.sort) {
    case 'price_asc': orderBy = 'list_price ASC NULLS LAST'; break;
    case 'price_desc': orderBy = 'list_price DESC NULLS LAST'; break;
    case 'newest': orderBy = 'first_seen_ts DESC NULLS LAST'; break;
    case 'updated': orderBy = 'modification_ts DESC NULLS LAST'; break;
  }

  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;
  values.push(limit, offset);

  const sql = `SELECT listing_key, list_price, city, state, bedrooms, bathrooms_total, living_area, lot_size_sqft, property_type,
      status, photos_count, latitude, longitude, main_photo_url, modification_ts, first_seen_ts, last_seen_ts, raw_json
    FROM properties
    ${whereSql}
    ORDER BY ${orderBy}
    LIMIT $${values.length - 1} OFFSET $${values.length}`;

  const countSql = `SELECT COUNT(*) FROM properties ${whereSql}`;

  const baseValuesForCount = values.slice(0, values.length - 2);

  const MAX_RETRIES = 3;
  const results: { list?: any; count?: any; estimated?: boolean } = {};
  let attempt = 0;
  let lastErr: any;

  while (attempt <= MAX_RETRIES) {
    const usePool = attempt === 0 ? pool : await getPgPool();
    const attemptStart = Date.now();
      try {
  // First: run list query alone with shorter client timeout (default 20s)
  const LIST_TIMEOUT_MS = Number(process.env.PROPERTY_LIST_TIMEOUT_MS || 20000);
  const listResult: any = await withTimeout(usePool.query(sql, values), LIST_TIMEOUT_MS, new Error('list-timeout'), true);
      results.list = listResult;
      log('list-success', { attempt, rows: listResult?.rowCount });

      // Second: run count query separately with shorter timeout (10s). If it times out, estimate.
  const COUNT_TIMEOUT_MS = Number(process.env.PROPERTY_COUNT_TIMEOUT_MS || 10000);
  const countOrTimeout: any = await withTimeout(usePool.query(countSql, baseValuesForCount), COUNT_TIMEOUT_MS, 'count-timeout', false);
      if (countOrTimeout === 'count-timeout') {
        // Fallback estimate: if we got 'limit' rows assume more exist; set estimated flag.
        results.estimated = true;
        const baseTotal = offset + listResult.rows.length;
        const hasMore = listResult.rows.length === limit;
        results.count = { rows: [{ count: String(hasMore ? baseTotal + 1 : baseTotal) }] };
        log('count-timeout', { attempt, baseTotal, hasMore });
      } else {
        results.count = countOrTimeout;
        log('count-success', { attempt, count: countOrTimeout?.rows?.[0]?.count });
      }
      break;
    } catch (err: any) {
      lastErr = err;
      const transient = isTransient(err);
      log('list-failure', { attempt, transient, err: err?.message, code: err?.code, elapsed_ms: Date.now() - attemptStart });
      if (!transient || attempt === MAX_RETRIES) {
        throw err;
      }
      try {
        const { resetPgPool } = await import('./connection');
        await resetPgPool('transient-error-retry');
      } catch {}
      const backoff = Math.min(400 * 2 ** attempt, 3_000) + Math.random() * 120;
      await new Promise(r => setTimeout(r, backoff));
      attempt += 1;
      continue;
    }
  }

  if (!results.list || !results.count) {
    throw lastErr || new Error('Unknown query failure');
  }

  const total = parseInt(results.count.rows[0].count, 10);
  return {
    properties: results.list.rows,
    total,
    hasMore: offset + limit < total,
    totalEstimated: !!results.estimated
  };
}

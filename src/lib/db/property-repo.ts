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
  const values: any[] = [];
  const where: string[] = ["status = 'Active'"];

  function add(cond: string, val?: any) {
    if (val === undefined || val === null) return;
    values.push(val);
    where.push(cond.replace('$IDX', '$' + values.length));
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
      status, photos_count, latitude, longitude, main_photo_url, modification_ts, first_seen_ts, last_seen_ts
    FROM properties
    ${whereSql}
    ORDER BY ${orderBy}
    LIMIT $${values.length - 1} OFFSET $${values.length}`;

  const countSql = `SELECT COUNT(*) FROM properties ${whereSql}`;

  async function run(): Promise<[any, any]> {
    return Promise.all([
      pool.query(sql, values),
      pool.query(countSql, values.slice(0, values.length - 2))
    ]);
  }

  let listResult: any, countResult: any;
  try {
    [listResult, countResult] = await run();
  } catch (err: any) {
    const msg = String(err?.message || '');
    if (msg.includes('Connection terminated unexpectedly') || msg.includes('ECONNRESET')) {
      // Lazy import to avoid circular
      const { resetPgPool } = await import('./connection');
      await resetPgPool('retry-after-termination');
      const retryPool = await getPgPool();
      try {
        [listResult, countResult] = await Promise.all([
          retryPool.query(sql, values),
          retryPool.query(countSql, values.slice(0, values.length - 2))
        ]);
      } catch (e2) {
        throw e2; // bubble after retry
      }
    } else {
      throw err;
    }
  }

  const total = parseInt(countResult.rows[0].count, 10);
  return {
    properties: listResult.rows,
    total,
    hasMore: offset + limit < total
  };
}

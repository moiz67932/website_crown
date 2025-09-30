import { z } from 'zod';
import { supaPublic } from '@/lib/supabase';

// ---------------- Types ----------------
export const PropertySchema = z.object({
  listing_key: z.string(),
  list_price: z.number().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  postal_code: z.string().nullable().optional(),
  bedrooms: z.number().nullable().optional(), // some rows use bedrooms vs bedrooms_total
  bedrooms_total: z.number().nullable().optional(),
  bathrooms_total: z.number().nullable(),
  living_area: z.number().nullable(),
  lot_size_sqft: z.number().nullable().optional(),
  property_type: z.string().nullable(),
  status: z.string().nullable(),
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
  media_urls: z.any().optional(),
  raw_json: z.any().optional()
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

export type PropertySort = 'price_asc' | 'price_desc' | 'newest' | 'updated';

// ---------------- Helpers ----------------
// We intentionally keep the builder typing loose (any) because Supabase's postgrest
// generic types are verbose and the exact chain changes (select returns a FilterBuilder
// while from() returns a QueryBuilder). Using `any` here avoids incorrect narrowing
// that caused TS errors (ilike/gte/lte/order not found) while preserving runtime safety.
function applyFilters<T>(query: T, filters: PropertyFilters): T {
  const q: any = query;
  if (filters.city) q.ilike('city', `%${filters.city}%`);
  if (filters.state) q.ilike('state', filters.state);
  if (filters.minPrice != null) q.gte('list_price', filters.minPrice);
  if (filters.maxPrice != null) q.lte('list_price', filters.maxPrice);
  if (filters.minBedrooms != null) q.gte('bedrooms_total', filters.minBedrooms);
  if (filters.maxBedrooms != null) q.lte('bedrooms_total', filters.maxBedrooms);
  if (filters.minBathrooms != null) q.gte('bathrooms_total', filters.minBathrooms);
  if (filters.maxBathrooms != null) q.lte('bathrooms_total', filters.maxBathrooms);
  if (filters.propertyType) q.ilike('property_type', `%${filters.propertyType}%`);
  return q;
}

function applySort<T>(query: T, sort?: PropertySort): T {
  const q: any = query;
  switch (sort) {
    case 'price_asc':
      return q.order('list_price', { ascending: true, nullsFirst: false });
    case 'price_desc':
      return q.order('list_price', { ascending: false, nullsFirst: false });
    case 'newest':
      return q.order('first_seen_ts', { ascending: false, nullsFirst: false });
    case 'updated':
    default:
      return q.order('modification_ts', { ascending: false, nullsFirst: false });
  }
}

// ---------------- Public API ----------------
export async function getProperties(limit = 18, offset = 0, filters: PropertyFilters = {}, sort: PropertySort = 'updated') {
  const supabase = supaPublic();

  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const rangeFrom = offset;
  const rangeTo = offset + safeLimit - 1;

  let base = supabase
    .from('properties')
    .select('*', { count: 'exact' })
    // Always enforce public visibility constraints
    .eq('status', 'Active')
    .or('hidden.is.null,hidden.eq.false');

  base = applyFilters(base, filters);
  base = applySort(base, sort);

  const { data, error, count } = await base.range(rangeFrom, rangeTo);
  if (error) throw error;

  const parsed: Property[] = [];
  for (const row of data || []) {
    const result = PropertySchema.safeParse(row);
    if (result.success) parsed.push(result.data);
    else {
      // eslint-disable-next-line no-console
      console.warn('[properties] row validation failed', result.error.issues);
    }
  }

  return { properties: parsed, total: count ?? parsed.length };
}

export async function getPropertyByListingKey(listingKey: string) {
  const supabase = supaPublic();
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('listing_key', listingKey)
    .eq('status', 'Active')
    .or('hidden.is.null,hidden.eq.false')
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const parsed = PropertySchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

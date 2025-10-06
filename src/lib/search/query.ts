import { createClient } from '@supabase/supabase-js'
import type { SearchFilters } from './parse'
import type { PropertyCard } from '@/lib/ui-spec'
import { embedText } from '@/lib/embeddings'
import { vectorSearch, resolveVectorSpec, dlog as vLog, strictModeBlocksUnindexedFiltering } from '@/lib/qdrant'
import { buildQdrantFilter } from '@/lib/qdrantFilter'
import { getPropertyVectorSearch } from '@/lib/vector-search'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const publicClient = anonKey ? createClient(supabaseUrl, anonKey, { auth: { persistSession: false } }) : null
const adminClient = serviceKey ? createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } }) : null

// Debug logging control: prefer DEBUG_VECTOR (shared with qdrant.ts)
const DEBUG = (process.env.DEBUG_VECTOR_SEARCH ?? '').toLowerCase() !== '0' || !!process.env.DEBUG_VECTOR
function dlog(...args: any[]) { if (DEBUG) console.log('[vector-search]', ...args) }

type RawRow = {
  id?: string | number
  slug?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  list_price?: number | null
  bedrooms?: number | null
  bedrooms_total?: number | null
  bathrooms_total?: number | null
  living_area?: number | null
  photos?: any | null
  main_photo_url?: string | null
  has_pool?: boolean | null
  features?: any | null
}

export async function searchProperties(filters: SearchFilters, offset = 0, limit = 6): Promise<{ rows: PropertyCard[]; total: number }>{
  const safeLimit = Math.min(Math.max(limit || 6, 1), 24)
  const payload = {
    city: filters.city ?? null,
    max_price: filters.maxPrice ?? null,
    min_price: filters.minPrice ?? null,
    beds: filters.beds ?? null,
    baths: filters.baths ?? null,
    has_pool: filters.hasPool ?? null,
    p_offset: offset,
    p_limit: safeLimit,
  }

  const client = adminClient || publicClient
  if (!client) throw new Error('Supabase client not configured')

  try {
    dlog('RPC search_properties_basic payload:', payload)
    const { data, error } = await client.rpc('search_properties_basic', payload)
    if (error) throw error
    const rows: RawRow[] = (data?.rows as any) || data || []
    const total: number = (data?.total as any) ?? (Array.isArray(rows) ? rows.length : 0)
    const cards: PropertyCard[] = (rows || []).map(toCard)
    dlog('RPC search_properties_basic OK -> rows:', cards.length, 'total:', total)
    return { rows: cards, total }
  } catch {
    // Fallback: direct query on properties table
    dlog('RPC search_properties_basic FAILED. Falling back to direct properties query. Filters:', filters, 'offset:', offset, 'limit:', safeLimit)
    let q = client
      .from('properties')
      .select('id, slug, address, city, state:state_or_province, postal_code, list_price, bedrooms_total, bathrooms_total, living_area, photos, main_photo_url', { count: 'exact' })

    if (filters.city) q = q.ilike('city', filters.city)
    if (filters.maxPrice) q = q.lte('list_price', filters.maxPrice)
    if (filters.minPrice) q = q.gte('list_price', filters.minPrice)
    if (filters.beds) q = q.gte('bedrooms_total', filters.beds)
    if (filters.baths) q = q.gte('bathrooms_total', filters.baths)

    const { data, error, count } = await q.range(offset, offset + safeLimit - 1)
    if (error) {
      // If bathrooms_total not present, retry without baths filter
      dlog('Direct query error:', (error as any)?.message || error)
      if (filters.baths) {
        dlog('Retrying direct query without bathrooms filter')
        let q2 = client
          .from('properties')
          .select('id, slug, address, city, state:state_or_province, postal_code, list_price, bedrooms_total, living_area, photos, main_photo_url', { count: 'exact' })
        if (filters.city) q2 = q2.ilike('city', filters.city)
        if (filters.maxPrice) q2 = q2.lte('list_price', filters.maxPrice)
        if (filters.minPrice) q2 = q2.gte('list_price', filters.minPrice)
        if (filters.beds) q2 = q2.gte('bedrooms_total', filters.beds)
        const { data: d2, error: e2, count: c2 } = await q2.range(offset, offset + safeLimit - 1)
        if (e2) throw e2
        const cards = (d2 || []).map(toCard)
        dlog('Direct query (no baths) OK -> rows:', cards.length, 'total:', c2 ?? cards.length)
        return { rows: cards, total: c2 ?? cards.length }
      }
      throw error
    }
    const cards = (data || []).map(toCard)
    dlog('Direct query OK -> rows:', cards.length, 'total:', count ?? cards.length)
    return { rows: cards, total: count ?? cards.length }
  }
}

export function toCard(r: RawRow): PropertyCard {
  const photoUrl = firstPhoto(r) || null
  const idStr = r.id != null ? String(r.id) : ''
  const url = r.slug ? `/properties/${r.slug}` : (idStr ? `/properties/${idStr}` : undefined)
  const highlights: string[] = []
  try {
    if ((r as any).has_pool) highlights.push('Pool')
    else if (typeof r.features === 'string' && /pool/i.test(r.features)) highlights.push('Pool')
  } catch {}

  return {
    id: idStr || r.slug || crypto.randomUUID(),
    slug: r.slug ?? undefined,
    title: r.address ?? undefined,
    address: r.address ?? undefined,
    city: r.city ?? undefined,
    state: r.state ?? undefined,
    postalCode: r.postal_code ?? undefined,
    price: r.list_price ?? undefined,
    bedrooms: r.bedrooms_total ?? r.bedrooms ?? undefined,
    bathrooms: r.bathrooms_total ?? undefined,
    livingArea: r.living_area ?? undefined,
    photoUrl,
    url,
    highlights,
  }
}

function firstPhoto(r: RawRow): string | null {
  if (r.main_photo_url) return r.main_photo_url
  const photos = r.photos
  if (!photos) return null
  if (Array.isArray(photos) && photos.length) {
    const p = photos[0]
    if (typeof p === 'string') return p
    if (p?.url) return p.url
  }
  if (typeof photos === 'object' && (photos as any)?.[0]?.url) return (photos as any)[0].url
  return null
}

// Semantic vector search via pgvector RPC with filtered candidates
export async function semanticSearchWithFilters(
  query: string,
  filters: SearchFilters,
  limit = 12
): Promise<PropertyCard[]> {
  const client = adminClient || publicClient
  dlog('semanticSearchWithFilters:start', { query, filters, limit, qdrant: !!process.env.QDRANT_URL })

  // 1) Qdrant (primary path)
  if (process.env.QDRANT_URL) {
    try {
      const { collection, expectedSize, info } = await resolveVectorSpec()
      const vec = await embedText(query)
      vLog('qdrant:vector_length', Array.isArray(vec) ? vec.length : typeof vec)
      if (expectedSize && vec.length !== expectedSize) {
        vLog('qdrant:vector_dim_mismatch', { got: vec.length, expected: expectedSize })
        throw new Error(`Vector dim mismatch: got ${vec.length}, expected ${expectedSize}`)
      }
      let qFilter = buildQdrantFilter(filters)
      const strictBlocks = strictModeBlocksUnindexedFiltering(info)
      vLog('qdrant:strict_mode', { enabled: !!info?.config?.strict_mode_config?.enabled, unindexed_filtering_retrieve: info?.config?.strict_mode_config?.unindexed_filtering_retrieve, dropFilter: strictBlocks })
      // If strict mode forbids unindexed filtering, avoid sending filters to prevent 400 while we align payload schema indexes
      if (strictBlocks) {
        vLog('qdrant:dropping_filter_due_to_strict_mode')
        qFilter = undefined
      }
      vLog('qdrant:filter', qFilter)
      const hits = await vectorSearch(collection, vec as number[], Math.max(limit * 4, 24), qFilter)
      vLog('qdrant:hits', hits?.length || 0)

      const cards: PropertyCard[] = []
      for (const h of (hits || []) as any[]) {
        const p = h.payload || {}
        const pid = p.property_id || p.id || p.propertyId || p._id || h.id

        if (p.address || p.city || p.list_price) {
          cards.push({
            id: String(pid),
            slug: p.slug,
            title: p.address ?? p.title ?? undefined,
            address: p.address ?? undefined,
            city: p.city ?? undefined,
            state: p.state ?? undefined,
            postalCode: p.postal_code ?? undefined,
            price: p.list_price ?? p.price ?? undefined,
            bedrooms: p.bedrooms ?? p.bedrooms_total ?? undefined,
            bathrooms: p.bathrooms_total ?? p.bathrooms ?? undefined,
            livingArea: p.living_area ?? undefined,
            photoUrl: p.photo_url ?? p.photoUrl ?? p.main_photo_url ?? p.hero_image_url ?? null,
            url: p.slug ? `/properties/${p.slug}` : (pid ? `/properties/${pid}` : undefined),
            highlights: (() => {
              try {
                if (p.has_pool) return ['Pool']
                if (typeof p.features === 'string' && /pool/i.test(p.features)) return ['Pool']
              } catch {}
              return []
            })()
          })
        }
        if (cards.length >= limit) break
      }

      if (cards.length) {
        vLog('qdrant:cards_returned', cards.length)
        return cards.slice(0, limit)
      }
      vLog('qdrant:no_cards_fallback_sql')
    } catch (e: any) {
      vLog('qdrant:error', e?.message || e)
      // Do not fall back to SQL while Supabase keys are not ready
    }
  }

  // 2) No SQL fallback: return [] so UI can show notice/contact block
  dlog('semanticSearchWithFilters: returning empty (no SQL fallback)')
  return []
}

// Unified search: try semantic first, fall back to basic
export async function searchWithSemantic(
  queryText: string,
  filters: SearchFilters,
  offset = 0,
  limit = 6
): Promise<{ rows: PropertyCard[]; total: number }>{
  dlog('searchWithSemantic called', { queryText, filters, offset, limit })
  const semantic = await semanticSearchWithFilters(queryText, filters, offset + limit)
  if (semantic.length) {
    const paged = semantic.slice(offset, offset + limit)
    // We do not have an exact total from RPC; approximate by combining with basic count
    try {
      const basic = await searchProperties(filters, 0, 1)
      const total = Math.max(semantic.length, basic.total)
      dlog('searchWithSemantic: using semantic results', { paged: paged.length, total })
      return { rows: paged, total }
    } catch {
      dlog('searchWithSemantic: semantic results without basic count', { paged: paged.length, total: semantic.length })
      return { rows: paged, total: semantic.length }
    }
  }
  dlog('searchWithSemantic: semantic empty, falling back to basic search')
  return searchProperties(filters, offset, limit)
}

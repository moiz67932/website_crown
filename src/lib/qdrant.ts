import { QdrantClient } from "@qdrant/js-client-rest"
import { createClient } from "@supabase/supabase-js"

// Env
const QURL = process.env.QDRANT_URL
const QKEY = process.env.QDRANT_API_KEY || undefined
export const QCOL = process.env.QDRANT_PROPERTY_COLLECTION || "properties_seo_v1"

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!
const SUPA_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supa = createClient(SUPA_URL, SUPA_SERVICE, { auth: { persistSession: false } })

// Qdrant client singleton
let _qdrant: QdrantClient | null = null
let _cache: Record<string, any> = {}
export function getQdrant(): QdrantClient | null {
  if (!QURL) return null
  if (_qdrant) return _qdrant
  _qdrant = new QdrantClient({ url: QURL, apiKey: QKEY })
  return _qdrant
}

// Debug logger for vector/search path
export function dlog(...args: any[]) {
  if (process.env.DEBUG_VECTOR || (process.env.DEBUG_VECTOR_SEARCH ?? '').toLowerCase() !== '0') {
    // eslint-disable-next-line no-console
    console.log("[vector]", ...args)
  }
}

export function qdrantNormalizeCity(input?: string | null): string | undefined {
  if (!input) return undefined
  return input.trim().toLowerCase()
}

export function digitsOnly(s?: string) {
  return (s || "").replace(/\D/g, "")
}

// Back-compat types and filter for older callers
export type PropertyFilter = { city?: string; priceMin?: number; priceMax?: number; beds?: number }

export function toFilter(f?: PropertyFilter) {
  if (!f) return undefined
  const must: any[] = []
  if (f.city) must.push({ key: "city", match: { value: f.city.toLowerCase() } })
  if (f.beds) must.push({ key: "beds", range: { gte: f.beds } })
  if (f.priceMin != null || f.priceMax != null)
    must.push({ key: "price", range: { gte: f.priceMin ?? 0, lte: f.priceMax ?? 1e12 } })
  return must.length ? { must } : undefined
}

/**
 * Collection metadata helpers
 */
export async function getCollectionInfo(name: string) {
  const key = `col:${name}`
  if (_cache[key]) return _cache[key]
  const client = getQdrant()
  if (!client) throw new Error("QDRANT_URL missing")
  const info = await client.getCollection(name)
  _cache[key] = info
  return info
}

/** Decide collection + expected vector size (default unnamed vector). */
export async function resolveVectorSpec() {
  const collection = QCOL
  const info = await getCollectionInfo(collection)
  // Support both shapes: bare object vs. { result: {...} }
  const base = (info as any)?.result ?? info
  const vectors = base?.config?.params?.vectors
  const expectedSize = typeof vectors?.size === "number" ? vectors.size : undefined
  dlog("resolveVectorSpec", { collection, expectedSize })
  return { collection, expectedSize, info: base }
}

/** Whether strict mode forbids unindexed filtering on this collection */
export function strictModeBlocksUnindexedFiltering(colInfo: any): boolean {
  const strict = colInfo?.config?.strict_mode_config
  // If enabled and unindexed_filtering_retrieve is false, we must not send filters on non-indexed fields
  return !!(strict?.enabled && strict?.unindexed_filtering_retrieve === false)
}

/** Qdrant vector search with full error introspection */
export async function vectorSearch(collection: string, vector: number[], limit = 8, filter?: any) {
  const client = getQdrant()
  if (!client) throw new Error("Qdrant not configured (QDRANT_URL missing)")
  const payload: any = { vector, limit, with_payload: true, filter }
  dlog("qdrant.search params", { collection, limit, filter })
  try {
    return await client.search(collection, payload)
  } catch (e: any) {
    const status = e?.response?.status
    const body = e?.response?.data
    let extra: any = {}
    try { extra.serialized = JSON.stringify(e) } catch {}
    if (e?.stack) extra.stack = String(e.stack).split('\n').slice(0, 3).join(' | ')
    dlog("qdrant.search error", { status, body, message: e?.message || String(e), ...extra })
    throw e
  }
}

/** Fallback to Supabase table if Qdrant payload is partial */
export async function getPropertyById(id: string) {
  const { data, error } = await supa
    .from("properties")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  return data
}

/*
Test checklist (lib/qdrant):
- vectorSearch returns hits with payload when given a valid vector.
- getPropertyById('some-id') returns row or null without throwing.
*/

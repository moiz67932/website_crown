import { QdrantClient } from "@qdrant/js-client-rest"

export const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_API_KEY!,
})

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

export async function vectorSearch(collection: string, vector: number[], limit = 8, filter?: any) {
  return qdrant.search(collection, {
    vector,
    limit,
    with_payload: true,
    with_vector: false,
    filter,
    params: { ef: 128 }, // ef tuned for k<=12 per perf notes
    score_threshold: 0.2,
  })
}

// Retrieve a property payload by ID from the properties collection.
export async function getPropertyById(id: string) {
  const res: any = await (qdrant as any).retrieve("properties_seo_v1", {
    ids: [id],
    with_payload: true,
    with_vector: false as any,
  })
  return res?.[0]?.payload || null
}

/*
Test checklist (lib/qdrant):
- vectorSearch returns hits with payload when given a valid vector.
- getPropertyById('some-id') returns payload or null without throwing.
*/

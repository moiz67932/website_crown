import { embed } from "./embeddings"
import { vectorSearch, toFilter, PropertyFilter } from "./qdrant"

export type RagHit = { text: string; meta: any; score: number }

// Simplified: only use properties_seo_v1 for retrieval in this project.
export async function retrieve(query: string, f?: PropertyFilter, k = 8): Promise<RagHit[]> {
  const [vec] = await embed([query])
  const filter = toFilter(f)
  try {
    const hits = await vectorSearch("properties_seo_v1", vec, k, filter)
    return hits.map((h: any) => ({
      text: (h.payload?.chunk || h.payload?.text || h.payload?.description || ""),
      meta: h.payload,
      score: h.score,
    }))
  } catch (err: any) {
    console.warn('[rag] properties retrieval failed:', err?.message || err)
    return []
  }
}

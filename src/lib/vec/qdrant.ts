import { QdrantClient } from '@qdrant/js-client-rest'

export const COLLECTION_CONTEXT = 'blog_context_v1'
export const VECTOR_SIZE = 1536 // text-embedding-3-small

export const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_API_KEY!
})

export async function ensureCollections() {
  const existing = await qdrant.getCollections()
  const names = (existing.collections ?? []).map((c: any) => c.name)
  if (!names.includes(COLLECTION_CONTEXT)) {
    await qdrant.createCollection(COLLECTION_CONTEXT, {
      vectors: { size: VECTOR_SIZE, distance: 'Cosine' }
    })
  }
}

export async function upsertContextPoints(points: Array<{ id: string|number; text: string; city: string; neighborhood?: string; embedding: number[] }>) {
  await ensureCollections()
  await qdrant.upsert(COLLECTION_CONTEXT, {
    points: points.map(p => ({
      id: p.id,
      vector: p.embedding,
      payload: {
        city: p.city,
        neighborhood: p.neighborhood,
        text: p.text,
        type: p.neighborhood ? 'neighborhood' : 'city'
      }
    }))
  })
}

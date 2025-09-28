#!/usr/bin/env ts-node
import 'dotenv/config'
import { supaServer } from '@/lib/supabase'
import OpenAI from 'openai'
import crypto from 'crypto'
import { QdrantClient } from '@qdrant/js-client-rest'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
const supa = supaServer()
const qdrant = new QdrantClient({ url: process.env.QDRANT_URL!, apiKey: process.env.QDRANT_API_KEY! })
const COLLECTION_CONTEXT = 'blog_context_v1'
const VECTOR_SIZE = 1536

async function ensureCollection() {
  const existing = await qdrant.getCollections()
  const names = (existing.collections ?? []).map((c: any) => c.name)
  if (!names.includes(COLLECTION_CONTEXT)) {
    await qdrant.createCollection(COLLECTION_CONTEXT, { vectors: { size: VECTOR_SIZE, distance: 'Cosine' } })
  }
}

async function upsertContextPoints(points: Array<{ id: string | number; vector?: number[]; payload?: any }>) {
  await ensureCollection()
  // Inspect collection config to determine if Qdrant expects named vectors or unnamed
  const cols = await qdrant.getCollections()
  const coll: any = (cols.collections || []).find((c: any) => c.name === COLLECTION_CONTEXT)
  const vectorsConfig = (coll && (coll.config?.vectors ?? coll.vectors)) ?? null
  const useNamedVectors = vectorsConfig && typeof vectorsConfig === 'object' && !('size' in vectorsConfig)

  const payloadPoints = points.map(p => {
    const vec = (p as any).vector || (p as any).embedding
    const payload = (p as any).payload || { city: (p as any).city, neighborhood: (p as any).neighborhood, text: (p as any).text, type: (p as any).neighborhood ? 'neighborhood' : 'city' }
    if (useNamedVectors) {
      // If named vectors are configured, pick the first name (fallback to 'vector')
      const firstName = Object.keys(vectorsConfig)[0] || 'vector'
      return { id: p.id, vectors: { [firstName]: vec }, payload }
    }
    return { id: p.id, vector: vec, payload }
  })

  // Debug: show a sample point structure
  console.log('Sample prepared point:', JSON.stringify(payloadPoints[0], null, 2))

  // Filter out invalid points (missing or non-array vectors)
  const valid = payloadPoints.filter((p: any) => {
    if (useNamedVectors) {
      const vecObj = p.vectors || {}
      const first = Object.values(vecObj)[0]
      return Array.isArray(first) && first.length > 0
    }
    return Array.isArray(p.vector) && p.vector.length > 0
  })

  if (valid.length === 0) {
    console.log('No valid vectors to upsert (all points missing embeddings)')
    return
  }

  try {
  // cast to any to avoid strict client typing for named/unnamed vector shapes
  const res = await (qdrant as any).upsert(COLLECTION_CONTEXT, { points: valid })
  console.log('Qdrant upsert response:', res)
  } catch (err: any) {
    console.error('Qdrant upsert error:', err?.data ?? err?.message ?? err)
    throw err
  }
}

async function embed(text: string) {
  const model = process.env.EMBEDDING_MODEL || 'text-embedding-3-small'
  const resp = await openai.embeddings.create({ model, input: text })
  const emb = resp?.data?.[0]?.embedding
  if (!Array.isArray(emb)) {
    console.error('OpenAI embedding missing or invalid for text:', text.slice(0,120))
    return []
  }
  // Debug: length
  console.log('Embedding length:', emb.length)
  return emb
}

async function run() {
  const city = process.argv[2]
  if (!city) {
    console.error('Usage: ts-node scripts/ingest_city_context.ts <city>')
    process.exit(1)
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in env')
  const { data: nbh } = await supa
    .from('properties')
    .select('neighborhood')
    .eq('city', city)
    .not('neighborhood', 'is', null)

  const neighborhoods = Array.from(new Set((nbh ?? []).map(r => r.neighborhood))).slice(0,40)

  const snippets = neighborhoods.map(n => ({
    // pointId will be an actual UUID (Qdrant requires unsigned int or UUID)
    id: crypto.randomUUID(),
    key: `${city}-${n}`,
    city,
    neighborhood: n,
    text: `Neighborhood: ${n} — qualitative residential area in ${city}. (No pricing data.)`
  }))

  const points: any[] = []
  for (const snip of snippets) {
    const vec = await embed(snip.text)
  points.push({ id: snip.id, vector: vec, payload: { city: snip.city, neighborhood: snip.neighborhood, text: snip.text, text_id: snip.key } })
  }
  await upsertContextPoints(points)
  console.log(`Ingested ${points.length} context points for ${city}`)
}

run().catch(e => { console.error(e); process.exit(1) })

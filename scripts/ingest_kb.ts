#!/usr/bin/env ts-node
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import OpenAI from 'openai'
import { QdrantClient } from '@qdrant/js-client-rest'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
const qdrant = new QdrantClient({ url: process.env.QDRANT_URL!, apiKey: process.env.QDRANT_API_KEY! })

const COLLECTION = 'kb_realestate_v1'
const VECTOR_SIZE = 1536

async function ensureCollection() {
  const cols = await qdrant.getCollections()
  const names = (cols.collections || []).map((c: any) => c.name)
  if (!names.includes(COLLECTION)) {
    await qdrant.createCollection(COLLECTION, { vectors: { size: VECTOR_SIZE, distance: 'Cosine' } })
  }
}

async function embedBatch(texts: string[]) {
  const model = process.env.EMBED_MODEL || process.env.EMBEDDING_MODEL || 'text-embedding-3-small'
  const r = await openai.embeddings.create({ model, input: texts })
  return r.data.map(d => d.embedding as number[])
}

type Doc = { id: string; text: string; lang?: string; title?: string; city?: string; state?: string; type?: string; source?: string }

async function ingest(docs: Doc[]) {
  await ensureCollection()
  const B = 48
  for (let i = 0; i < docs.length; i += B) {
    const batch = docs.slice(i, i + B)
    const embs = await embedBatch(batch.map(d => d.text))
    const points = batch.map((d, idx) => ({
      id: d.id,
      vector: embs[idx],
      payload: {
        type: d.type || 'kb',
        title: d.title || '',
        city: d.city || '',
        state: d.state || '',
        source: d.source || '',
        updated_at: new Date().toISOString(),
        lang: d.lang || 'en',
        text: d.text,
      },
    }))
    await qdrant.upsert(COLLECTION, { points })
    console.log(`Upserted ${points.length} -> ${i + points.length}/${docs.length}`)
  }
}

async function main() {
  // Minimal seed content; replace with real knowledge files
  const docs: Doc[] = [
    {
      id: 'guide-buying-en',
      lang: 'en',
      type: 'guide',
      title: 'Home Buying Steps',
      text: 'Typical buying steps: get pre-approved, find agent, tour homes, make offers, inspection, appraisal, underwriting, closing.'
    },
    {
      id: 'faq-escrow-en',
      lang: 'en',
      type: 'faq',
      title: 'What is escrow?',
      text: 'Escrow is a neutral account where funds are held during a real estate transaction until conditions are met.'
    },
    { id: 'neighborhood-es', lang: 'es', type: 'city', city: 'San Diego', text: 'San Diego ofrece barrios costeros, excelente clima y actividades al aire libre durante todo el año.' },
    { id: 'markt-de', lang: 'de', type: 'market', city: 'San Diego', text: 'Der Immobilienmarkt in San Diego ist wettbewerbsfähig, mit begrenztem Angebot und stabiler Nachfrage.' },
  ]
  await ingest(docs)
}

main().catch(e => { console.error(e); process.exit(1) })

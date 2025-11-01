import 'dotenv/config'
import { getOpenAI } from './openai'
import { getSupabase } from '../lib/supabase'

export async function embedText(text: string): Promise<number[]> {
  const trimmed = (text || '').slice(0, 8000) // safety cap
  const client = getOpenAI()
  const res = await client.embeddings.create({
    model: process.env.EMBEDDING_MODEL || process.env.EMBED_MODEL || 'text-embedding-3-small',
    input: trimmed,
  })
  return res.data[0].embedding as unknown as number[]
}

// Batch embedding helper for RAG retrieval
export async function embed(texts: string[], model = process.env.EMBED_MODEL || process.env.EMBEDDING_MODEL || 'text-embedding-3-small') {
  const client = getOpenAI()
  const r = await client.embeddings.create({ model, input: texts })
  return r.data.map(d => d.embedding as unknown as number[])
}

export async function upsertPostEmbedding(postId: string, text: string) {
  const supa = getSupabase()
  if (!supa) throw new Error('Supabase not configured')
  const vec = await embedText(text)
  const { error } = await supa.from('posts').update({ embedding: vec as any }).eq('id', postId)
  if (error) throw new Error(error.message)
}

export async function upsertPropertyEmbedding(propertyId: string, text: string) {
  const supa = getSupabase()
  if (!supa) throw new Error('Supabase not configured')
  const vec = await embedText(text)
  const { error } = await supa.from('properties').update({ embedding: vec as any }).eq('id', propertyId)
  if (error) throw new Error(error.message)
}

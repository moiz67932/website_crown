import 'dotenv/config';

import OpenAI from 'openai'
import { getSupabase } from '../lib/supabase'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function embedText(text: string): Promise<number[]> {
  const trimmed = (text || '').slice(0, 8000) // safety cap
  const res = await openai.embeddings.create({
    model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
    input: trimmed,
  })
  return res.data[0].embedding as unknown as number[]
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

import { getSupabase } from '@/lib/supabase'
import { embedText, upsertPostEmbedding } from '@/lib/embeddings'

type Params = { postId: string; city: string; topK?: number }

export async function attachTopPropertiesToPost({ postId, city, topK = 6 }: Params) {
  const supa = getSupabase()
  if (!supa) throw new Error('Supabase not configured')

  // Fetch post for title/content and existing embedding
  const { data: post, error } = await supa
    .from('posts')
    .select('id,title_primary,content_md,embedding')
    .eq('id', postId)
    .single()
  if (error || !post) throw new Error(error?.message || 'Post not found')

  let embedding: number[] | null = (post as any).embedding || null
  if (!embedding) {
    const keywords = extractTopKeywords(post.content_md || '')
    const seed = [post.title_primary, city, keywords.join(' ')].filter(Boolean).join(' ')
    embedding = await embedText(seed)
    await upsertPostEmbedding(postId, seed)
  }

  // Call SQL helper to match properties by embedding within city
  const { data: matches, error: mErr } = await supa
    .rpc('match_properties_by_embedding', { p_city: city, query: embedding as any, match_count: topK })
  if (mErr) throw new Error(mErr.message)

  const rows = (matches || []).map((m: any) => ({
    post_id: postId,
    property_id: m.property_id,
    score: 1 - Number(m.distance || 0)
  }))
  if (rows.length) {
    // Upsert by primary key (post_id, property_id)
    const { error: upErr } = await supa.from('post_properties').upsert(rows, { onConflict: 'post_id,property_id' })
    if (upErr) throw new Error(upErr.message)
  }
  return rows.length
}

function extractTopKeywords(text: string): string[] {
  const cleaned = (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
  const words = cleaned.split(/\s+/).filter(w => w.length > 3)
  const counts = new Map<string, number>()
  for (const w of words) counts.set(w, (counts.get(w) || 0) + 1)
  return Array.from(counts.entries()).sort((a,b)=>b[1]-a[1]).slice(0, 8).map(([w])=>w)
}

import { getSupabase } from '@/lib/supabase'
import { embedText, upsertPostEmbedding } from '@/lib/embeddings'

type Params = { postId: string; city: string; topK?: number }

export async function getRelatedPosts({ postId, city, topK = 3 }: Params) {
  const supa = getSupabase()
  if (!supa) throw new Error('Supabase not configured')
  const { data: post, error } = await supa
    .from('posts')
    .select('id,title_primary,content_md,embedding')
    .eq('id', postId)
    .single()
  if (error || !post) throw new Error(error?.message || 'Post not found')

  let vec: number[] | null = (post as any).embedding || null
  if (!vec) {
    const seed = [post.title_primary, city].join(' ')
    vec = await embedText(seed)
    await upsertPostEmbedding(postId, seed)
  }

  const { data: matches, error: mErr } = await supa
    .rpc('match_posts_by_embedding', { p_city: city, p_status: 'published', p_exclude: postId, query: vec as any, match_count: topK + 1 })
  if (mErr) throw new Error(mErr.message)

  if (!matches || matches.length === 0) return []
  const ids = matches.map((m: any) => m.post_id)
  const { data: rows } = await supa
    .from('posts')
    .select('id,slug,title_primary,city,meta_description,hero_image_url')
    .in('id', ids)

  // preserve similarity order
  const order = new Map<string, number>()
  matches.forEach((m: any, i: number) => order.set(m.post_id, i))
  return (rows || []).sort((a: any, b: any) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)).slice(0, topK)
}

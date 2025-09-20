import { getSupabase } from '../src/lib/supabase'
import { upsertPostEmbedding } from '../src/lib/embeddings'

async function main() {
  const supa = getSupabase()
  if (!supa) throw new Error('Supabase not configured')
  const { data: posts } = await supa
    .from('posts')
    .select('id,title_primary,city,content_md,embedding')
    .is('embedding', null)
    .limit(2000)
  for (const p of (posts || [])) {
    const text = [p.title_primary, p.city].filter(Boolean).join(' ')
    try { await upsertPostEmbedding(p.id, text) } catch (e) { console.warn('fail post', p.id, e) }
  }
  console.log('done')
}

main().catch(e => { console.error(e); process.exit(1) })

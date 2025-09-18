import { getSupabase } from '../src/lib/supabase'
import { upsertPropertyEmbedding } from '../src/lib/embeddings'

async function main() {
  const supa = getSupabase()
  if (!supa) throw new Error('Supabase not configured')
  const { data: props } = await supa
    .from('properties')
    .select('id,address,city,neighborhood,description,embedding')
    .is('embedding', null)
    .limit(2000)
  for (const p of (props || [])) {
    const text = [p.address, p.city, p.neighborhood, p.description].filter(Boolean).join(' ')
    try { await upsertPropertyEmbedding(p.id, text) } catch (e) { console.warn('fail property', p.id, e) }
  }
  console.log('done')
}

main().catch(e => { console.error(e); process.exit(1) })

import { supaServer } from '../supabase'
import { getOpenAI } from '../singletons'
import { qdrant, COLLECTION_CONTEXT } from '../vec/qdrant'

const supa = supaServer()

export type CityContext = {
  city: string
  neighborhoods: string[]
  property_types: string[]
  example_listings: { id: string; title: string; url?: string; neighborhood?: string }[]
}

export async function buildCityContext(city: string): Promise<CityContext> {
  const { data: nbh } = await supa
    .from('properties')
    .select('neighborhood')
    .eq('city', city)
    .not('neighborhood', 'is', null)
  const neighborhoods = Array.from(new Set((nbh ?? []).map(r => r.neighborhood))).slice(0, 30)

  const { data: types } = await supa
    .from('properties')
    .select('property_type')
    .eq('city', city)
    .not('property_type', 'is', null)
  const property_types = Array.from(new Set((types ?? []).map(r => r.property_type))).slice(0, 12)

  const { data: samples } = await supa
    .from('properties')
    .select('id,title,neighborhood,slug')
    .eq('city', city)
    .limit(12)

  return {
    city,
    neighborhoods,
    property_types,
    example_listings: (samples ?? []).map(s => ({
      id: s.id,
      title: s.title,
      neighborhood: s.neighborhood,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/property/${s.slug}`
    }))
  }
}

export async function retrieveCityBlurbs(city: string, k = 12) {
  try {
    // Inspect collection to determine vector config (named vs unnamed)
    let info: any = null
    try { info = await qdrant.getCollection(COLLECTION_CONTEXT) } catch {}
    const params = info?.result?.config?.params?.vectors
    const zero = new Array(1536).fill(0)
    let searchVector: any = zero
    if (params && typeof params === 'object' && 'vectors' in params) {
      // named vectors map
      const firstName = Object.keys(params.vectors)[0]
      searchVector = { name: firstName, vector: zero }
    }
    const res = await qdrant.search(COLLECTION_CONTEXT, {
      vector: searchVector,
      limit: k,
      with_payload: true,
      filter: { must: [{ key: 'city', match: { value: city } }] }
    } as any)
    return res
  } catch (e:any) {
    console.warn('[retrieveCityBlurbs] search failed, returning empty array:', e?.message || e)
    return []
  }
}

export async function embed(text: string) {
  const client = getOpenAI()
  const emb = await client.embeddings.create({
    model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
    input: text
  })
  return emb.data[0].embedding
}

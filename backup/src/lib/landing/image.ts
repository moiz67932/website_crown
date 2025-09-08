import { getSupabase } from '@/lib/supabase'

// Simple in-memory cache (per server runtime)
const memCache = new Map<string, string | null>()
const pending = new Map<string, Promise<string | undefined>>()

/**
 * Fetch (and cache) a hero image for a landing page (city + kind).
 * Order of operations:
 * 1. Memory cache
 * 2. Supabase landing_pages.hero_image_url
 * 3. Unsplash search -> persist to Supabase (upsert) -> memory cache
 */
export async function getLandingHeroImage(city: string, kind: string): Promise<string | undefined> {
  const loweredCity = city.toLowerCase()
  const key = `${loweredCity}::${kind}`
  const trace = !!process.env.LANDING_TRACE
  if (trace) console.log('[landing.hero] START', { city: loweredCity, kind })
  if (memCache.has(key)) {
    const cached = memCache.get(key)
    if (trace) console.log('[landing.hero] memCache hit', { key, has: !!cached })
    return cached === null ? undefined : cached
  }

  if (pending.has(key)) return pending.get(key)!
  const p = (async () => {
    // 1. Supabase lookup
    try {
      const sb = getSupabase()
      if (sb) {
        const { data, error } = await sb
          .from('landing_pages')
          .select('hero_image_url')
          .eq('city', loweredCity)
          .eq('page_name', kind)
          .maybeSingle()
        if (!error && data?.hero_image_url) {
          memCache.set(key, data.hero_image_url)
          if (trace) console.log('[landing.hero] supabase hit', { key })
          return data.hero_image_url
        } else if (error && trace) {
          console.warn('[landing.hero] supabase select error', { key, msg: error.message, code: error.code })
        } else if (trace) {
          console.log('[landing.hero] supabase miss', { key })
        }
      }
      else if (trace) console.log('[landing.hero] no supabase client (missing env)')
    } catch (e) {
      // ignore lookup errors, proceed to fetch
      if (trace) console.warn('[landing.hero] supabase lookup exception', (e as any)?.message)
    }

    // 2. External fetch (Unsplash)
    const accessKey = process.env.UNSPLASH_ACCESS_KEY
    if (!accessKey) {
      memCache.set(key, null)
      if (trace) console.warn('[landing.hero] UNSPLASH_ACCESS_KEY missing', { key })
      return undefined
    }
    const query = encodeURIComponent(`${city} skyline city real estate`)
    const url = `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape&client_id=${accessKey}`
    let imageUrl: string | undefined
    try {
      if (trace) console.log('[landing.hero] unsplash fetch', { key, url })
      const resp = await fetch(url, { headers: { 'Accept-Version': 'v1' }, cache: 'no-store' })
      if (resp.ok) {
        const json = await resp.json()
        imageUrl = json?.results?.[0]?.urls?.regular || json?.results?.[0]?.urls?.full
        if (trace) console.log('[landing.hero] unsplash ok', { key, hasImage: !!imageUrl })
      } else if (trace) {
        console.warn('[landing.hero] unsplash http_error', { key, status: resp.status })
      }
    } catch (e: any) {
      // network error -> give up
      if (trace) console.warn('[landing.hero] unsplash exception', { key, msg: e?.message })
    }
    if (!imageUrl) {
      memCache.set(key, null)
      if (trace) console.log('[landing.hero] unsplash no-image', { key })
      return undefined
    }

    // 3. Persist (best-effort)
    try {
      const sb2 = getSupabase()
      if (sb2) {
        const { error } = await sb2
          .from('landing_pages')
          .upsert({
            city: loweredCity,
            page_name: kind,
            kind,
            hero_image_url: imageUrl,
            updated_at: new Date().toISOString()
          }, { onConflict: 'city,page_name' })
          .select('id')
          .maybeSingle()
        if (error && trace) console.warn('[landing.hero] supabase upsert failed', { key, msg: error.message, code: error.code })
        else if (trace) console.log('[landing.hero] supabase upsert ok', { key })
      }
    } catch {
      // ignore persist errors
      if (trace) console.warn('[landing.hero] supabase upsert exception', { key })
    }
    memCache.set(key, imageUrl)
    if (trace) console.log('[landing.hero] DONE', { key })
    return imageUrl
  })().finally(() => pending.delete(key))
  pending.set(key, p)
  return p
}

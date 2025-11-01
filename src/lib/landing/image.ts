import { supaPublic, supaServer } from '../supabase'

// Simple in-memory cache (per server runtime)
const memCache = new Map<string, string | null>()
const pending = new Map<string, Promise<string | undefined>>()


type InlineImg = { url: string; alt: string; position: 'inline_1' | 'inline_2' | 'inline_3' | 'inline_4' }

const memHero = new Map<string, string | null>()
const pendingHero = new Map<string, Promise<string | undefined>>()

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
  // Detect build environments (npm lifecycle or next build) and skip external fetches
  const argv = Array.isArray(process.argv) ? process.argv.join(' ') : ''
  const likelyNextBuild = argv.includes('next') && argv.includes('build')
  if (process.env.SKIP_LANDING_EXTERNAL_FETCHES === '1' || process.env.VERCEL === '1' || process.env.NEXT_BUILD === '1' || process.env.npm_lifecycle_event === 'build' || process.env.NPM_LIFECYCLE_EVENT === 'build' || likelyNextBuild) {
    if (trace) console.log('[landing.hero] skipping unsplash due to build-detection', { key })
    memCache.set(key, null)
    return undefined
  }
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
      let sb: any = null
      try { sb = supaPublic() } catch { sb = null }
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
    // Allow builds to opt-out of making external network calls (Unsplash) by
    // setting SKIP_LANDING_EXTERNAL_FETCHES=1. We still respect Supabase cache
    // above, but avoid doing a potentially slow external request during static
    // generation or CI builds.
    if (process.env.SKIP_LANDING_EXTERNAL_FETCHES === '1' || process.env.VERCEL === '1') {
      if (trace) console.log('[landing.hero] skipping unsplash due to SKIP_LANDING_EXTERNAL_FETCHES', { key })
      memCache.set(key, null)
      return undefined
    }
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
      let sb2: any = null
      try { sb2 = supaServer() } catch { sb2 = null }
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


/** NEW: curated inline images, persisted on landing_pages.inline_images_json */
const memInline = new Map<string, InlineImg[] | null>()
const pendingInline = new Map<string, Promise<InlineImg[]>>()

export async function getLandingInlineImages(city: string, kind: string): Promise<InlineImg[]> {
  const loweredCity = city.toLowerCase()
  const key = `${loweredCity}::${kind}::inline`

  if (memInline.has(key)) return memInline.get(key) || []
  if (pendingInline.has(key)) return pendingInline.get(key)!

  const p = (async (): Promise<InlineImg[]> => {
    // 1) Try Supabase cache
    try {
      let sb: any = null
      try { sb = supaPublic() } catch { sb = null }
      if (sb) {
        const { data } = await sb
          .from('landing_pages')
          .select('inline_images_json')
          .eq('city', loweredCity)
          .eq('page_name', kind)
          .maybeSingle()
        if (data?.inline_images_json && Array.isArray(data.inline_images_json) && data.inline_images_json.length) {
          memInline.set(key, data.inline_images_json as InlineImg[])
          return data.inline_images_json as InlineImg[]
        }
      }
    } catch { /* ignore */ }

    // 2) Build topic-aware queries
    const accessKey = process.env.UNSPLASH_ACCESS_KEY
    if (!accessKey) { memInline.set(key, []); return [] }

    const prompts = buildInlinePrompts(city, kind)
    const qs = prompts.map(q => encodeURIComponent(q))

    const fetchOne = async (q: string) => {
      const url = `https://api.unsplash.com/search/photos?query=${q}&per_page=1&orientation=landscape&client_id=${accessKey}`
      try {
        const resp = await fetch(url, { headers: { 'Accept-Version': 'v1' }, cache: 'no-store' })
        const json = await resp.json()
        const u = json?.results?.[0]?.urls?.regular || json?.results?.[0]?.urls?.full
        const alt = json?.results?.[0]?.alt_description || decodeURIComponent(q)
        return u ? { url: u as string, alt: String(alt) } : undefined
      } catch { return undefined }
    }

    const results = await Promise.all(qs.map(fetchOne))
    const imgs: InlineImg[] = results
      .filter(Boolean)
      .slice(0, 4)
      .map((r, i) => ({ url: (r as any).url, alt: (r as any).alt, position: (`inline_${i + 1}` as InlineImg['position']) }))

    // 3) Persist best-effort
    try {
      let sb2: any = null
      try { sb2 = supaServer() } catch { sb2 = null }
      if (sb2) {
        await sb2.from('landing_pages').upsert({
          city: loweredCity,
          page_name: kind,
          kind,
          inline_images_json: imgs,
          updated_at: new Date().toISOString()
        }, { onConflict: 'city,page_name' })
      }
    } catch { /* ignore */ }

    memInline.set(key, imgs)
    return imgs
  })().finally(() => pendingInline.delete(key))

  pendingInline.set(key, p)
  return p
}

function buildInlinePrompts(city: string, kind: string): string[] {
  // hero handled elsewhere; these are inline vibes that work across variants
  const base = city
  const prettyKind = kind.replace(/-/g, ' ')
  return [
    `${base} residential streetscape, tree-lined, day, real estate`,
    `${base} skyline aerial neighborhood, architecture, community`,
    `${base} lifestyle at parks or waterfront, families walking`,
    `${base} modern home interior living room, natural light`
  ].map(p => `${p} — ${prettyKind}`) // lightly bias to the page topic
}

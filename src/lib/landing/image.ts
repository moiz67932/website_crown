import { getSupabase } from '@/lib/supabase'
import { isBuildPhase } from '@/lib/env/buildDetection'

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
 * 2. Supabase landing_pages.content.hero_image_url
 * 3. Unsplash search -> persist to content JSON -> memory cache
 */
export async function getLandingHeroImage(city: string, kind: string): Promise<string | undefined> {
  const loweredCity = city.toLowerCase()
  const key = `${loweredCity}::${kind}`
  const trace = !!process.env.LANDING_TRACE
  
  // Skip external fetches (Unsplash) during build phase only
  // At runtime (even on Vercel), we can fetch hero images if needed
  if (isBuildPhase()) {
    if (trace) console.log('[landing.hero] skipping unsplash due to build phase', { key })
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
    // 1. Supabase lookup - check content JSON for hero_image_url
    try {
      const sb = getSupabase()
      if (sb) {
        // Use order + limit instead of maybeSingle to handle multiple rows safely
        const { data: rows, error } = await sb
          .from('landing_pages')
          .select('content')
          .ilike('city', loweredCity)
          .eq('page_name', kind)
          .order('updated_at', { ascending: false })
          .limit(1)
        const data = rows?.[0]
        const heroUrl = data?.content?.hero_image_url
        if (!error && heroUrl) {
          memCache.set(key, heroUrl)
          if (trace) console.log('[landing.hero] supabase hit', { key })
          return heroUrl
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
    // During build phase, we skip Unsplash fetches (already handled at top of function)
    // At runtime, we can fetch from Unsplash if API key is available
    // Optionally, users can set SKIP_LANDING_EXTERNAL_FETCHES=1 to disable this at runtime too
    if (process.env.SKIP_LANDING_EXTERNAL_FETCHES === '1') {
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

    // 3. Persist (best-effort) - store in content JSON
    try {
      const sb2 = getSupabase()
      if (sb2) {
        // First fetch existing content to merge - handle multiple rows safely
        const { data: existingRows } = await sb2
          .from('landing_pages')
          .select('content')
          .ilike('city', loweredCity)
          .eq('page_name', kind)
          .order('updated_at', { ascending: false })
          .limit(1)
        const existingData = existingRows?.[0]
        
        // Content is stored as TEXT (stringified JSON) - must parse it
        let existingContent: Record<string, any> = {}
        try {
          if (existingData?.content) {
            existingContent = typeof existingData.content === 'string' 
              ? JSON.parse(existingData.content) 
              : existingData.content
          }
        } catch (e) {
          if (trace) console.warn('[landing.hero] Failed to parse existing content', { key, error: (e as any)?.message })
        }
        
        const { error } = await sb2
          .from('landing_pages')
          .upsert({
            city: loweredCity,
            page_name: kind,
            kind,
            content: JSON.stringify({
              ...existingContent,
              hero_image_url: imageUrl,
            }),
            updated_at: new Date().toISOString()
          }, { onConflict: 'city,page_name' })
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


/** NEW: curated inline images, persisted in content.inline_images */
const memInline = new Map<string, InlineImg[] | null>()
const pendingInline = new Map<string, Promise<InlineImg[]>>()

export async function getLandingInlineImages(city: string, kind: string): Promise<InlineImg[]> {
  const loweredCity = city.toLowerCase()
  const key = `${loweredCity}::${kind}::inline`
  const trace = !!process.env.LANDING_TRACE

  console.log('[landing.inline] 🎨 START fetching inline images', { city: loweredCity, kind, key })

  if (memInline.has(key)) {
    const cached = memInline.get(key) || []
    console.log('[landing.inline] ✅ Memory cache hit', { key, count: cached.length })
    return cached
  }
  
  if (pendingInline.has(key)) {
    console.log('[landing.inline] ⏳ Waiting for pending request', { key })
    return pendingInline.get(key)!
  }

  const p = (async (): Promise<InlineImg[]> => {
    // 1) Try Supabase cache - check content JSON for inline_images
    try {
      const sb = getSupabase()
      if (sb) {
        console.log('[landing.inline] 🔍 Checking Supabase cache', { key })
        // Use order + limit instead of maybeSingle to handle multiple rows safely
        const { data: rows, error } = await sb
          .from('landing_pages')
          .select('content')
          .ilike('city', loweredCity)
          .eq('page_name', kind)
          .order('updated_at', { ascending: false })
          .limit(1)
        const data = rows?.[0]
        
        const inlineImages = data?.content?.inline_images
        if (error) {
          console.warn('[landing.inline] ⚠️ Supabase error', { key, error: error.message })
        } else if (inlineImages && Array.isArray(inlineImages) && inlineImages.length) {
          console.log('[landing.inline] ✅ Supabase cache hit', { 
            key, 
            count: inlineImages.length,
            images: inlineImages.map((img: any) => ({ position: img.position, url: img.url.slice(0, 50) + '...' }))
          })
          memInline.set(key, inlineImages as InlineImg[])
          return inlineImages as InlineImg[]
        } else {
          console.log('[landing.inline] ℹ️ Supabase cache miss', { key, hasData: !!data, hasImages: !!inlineImages })
        }
      } else {
        console.warn('[landing.inline] ⚠️ No Supabase client available')
      }
    } catch (e) {
      console.error('[landing.inline] ❌ Supabase lookup exception', { key, error: (e as any)?.message })
    }

    // 2) Build topic-aware queries
    const accessKey = process.env.UNSPLASH_ACCESS_KEY
    if (!accessKey) {
      console.error('[landing.inline] ❌ UNSPLASH_ACCESS_KEY missing')
      memInline.set(key, [])
      return []
    }

    console.log('[landing.inline] 🔍 Fetching from Unsplash', { city: loweredCity, kind })
    const prompts = buildInlinePrompts(city, kind)
    console.log('[landing.inline] 📝 Using prompts:', prompts)
    const qs = prompts.map(q => encodeURIComponent(q))

    const fetchOne = async (q: string, index: number) => {
      const url = `https://api.unsplash.com/search/photos?query=${q}&per_page=1&orientation=landscape&client_id=${accessKey}`
      try {
        console.log(`[landing.inline] 🌐 Fetching image ${index + 1}/4`, { query: decodeURIComponent(q).slice(0, 60) })
        const resp = await fetch(url, { headers: { 'Accept-Version': 'v1' }, cache: 'no-store' })
        if (!resp.ok) {
          console.error(`[landing.inline] ❌ Unsplash HTTP error ${index + 1}`, { status: resp.status, query: decodeURIComponent(q).slice(0, 60) })
          return undefined
        }
        const json = await resp.json()
        const u = json?.results?.[0]?.urls?.regular || json?.results?.[0]?.urls?.full
        const alt = json?.results?.[0]?.alt_description || decodeURIComponent(q)
        
        if (u) {
          console.log(`[landing.inline] ✅ Got image ${index + 1}/4`, { url: u.slice(0, 50) + '...', alt: alt.slice(0, 50) })
        } else {
          console.warn(`[landing.inline] ⚠️ No image found ${index + 1}/4`, { resultsCount: json?.results?.length || 0 })
        }
        
        return u ? { url: u as string, alt: String(alt) } : undefined
      } catch (e) {
        console.error(`[landing.inline] ❌ Fetch exception ${index + 1}/4`, { error: (e as any)?.message })
        return undefined
      }
    }

    const results = await Promise.all(qs.map(fetchOne))
    const imgs: InlineImg[] = results
      .filter(Boolean)
      .slice(0, 4)
      .map((r, i) => ({ url: (r as any).url, alt: (r as any).alt, position: (`inline_${i + 1}` as InlineImg['position']) }))

    console.log('[landing.inline] 📊 Fetched results', { 
      total: results.length, 
      successful: imgs.length,
      images: imgs.map(img => ({ position: img.position, url: img.url.slice(0, 50) + '...' }))
    })

    // 3) Persist best-effort - store in content JSON
    try {
      const sb2 = getSupabase()
      if (sb2 && imgs.length > 0) {
        console.log('[landing.inline] 💾 Persisting to Supabase', { key, count: imgs.length })
        
        // First fetch existing content to merge - handle multiple rows safely
        const { data: existingRows } = await sb2
          .from('landing_pages')
          .select('content')
          .ilike('city', loweredCity)
          .eq('page_name', kind)
          .order('updated_at', { ascending: false })
          .limit(1)
        const existingData = existingRows?.[0]
        
        // Content is stored as TEXT (stringified JSON) - must parse it
        let existingContent: Record<string, any> = {}
        try {
          if (existingData?.content) {
            existingContent = typeof existingData.content === 'string' 
              ? JSON.parse(existingData.content) 
              : existingData.content
          }
        } catch (e) {
          console.warn('[landing.inline] Failed to parse existing content', { key, error: (e as any)?.message })
        }
        
        const { error } = await sb2.from('landing_pages').upsert({
          city: loweredCity,
          page_name: kind,
          kind,
          content: JSON.stringify({
            ...existingContent,
            inline_images: imgs,
          }),
          updated_at: new Date().toISOString()
        }, { onConflict: 'city,page_name' })
        
        if (error) {
          console.error('[landing.inline] ❌ Supabase upsert error', { key, error: error.message })
        } else {
          console.log('[landing.inline] ✅ Supabase upsert success', { key })
        }
      }
    } catch (e) {
      console.error('[landing.inline] ❌ Supabase persist exception', { key, error: (e as any)?.message })
    }

    memInline.set(key, imgs)
    console.log('[landing.inline] ✅ DONE', { key, count: imgs.length })
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

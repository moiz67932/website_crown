// src/lib/unsplash.ts
import { getSupabase } from '@/lib/supabase'

/**
 * One-off Unsplash search for a given query.
 * Returns the first regular/full URL or null.
 */
export async function searchUnsplashOnce(query: string) {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) throw new Error('UNSPLASH_ACCESS_KEY not set')
  const params = new URLSearchParams({ query, per_page: '1', orientation: 'landscape' })
  const res = await fetch(`https://api.unsplash.com/search/photos?${params.toString()}`, {
    headers: { Authorization: `Client-ID ${key}` },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const data = await res.json()
  if (!data?.results?.length) return null
  const best = data.results[0]
  return best?.urls?.regular || best?.urls?.full || null
}

/**
 * Derive a strong hero + inline prompts if the post lacks them.
 * Uses city, title, headings heuristics.
 */
export function deriveImagePromptsFromPost(opts: {
  city?: string | null
  title?: string | null
  headings?: string[]
  fallbackTopic?: string
}) {
  const city = (opts.city || '').replace(/-/g, ' ')
  const title = opts.title || ''
  const base = city ? `${city} luxury homes, neighborhoods, streetscape, warm sunset` : 'modern real estate'
  const hero = city
    ? `${city} skyline & neighborhoods, golden hour, upscale homes, wide angle`
    : `${title || 'real estate'} hero banner, golden hour`

  const derived = [
    hero,
    `${city} palm-lined streets, residential, families walking`,
    `${city} coastline, homes near ocean, dusk`,
    `${city} modern architecture homes, clean lines, greenery`,
    `${city} neighborhood cafes and boutiques, lifestyle`,
  ]

  // Blend in some H2s if available
  const hs = (opts.headings || []).slice(0, 3)
  hs.forEach((h, i) => {
    derived[i + 1] = `${city} ${h.toLowerCase()} homes, street scene`
  })

  return { heroPrompt: derived[0], imagePrompts: derived.slice(1, 5) }
}

/**
 * Attach hero + inline images to a post in Supabase.
 * - Inserts into post_images table if not already present.
 * - Updates posts.hero_image_url if hero is set.
 * - Falls back to /public/... assets if Unsplash fails.
 */
export async function attachImagesToPost(
  supa: any,
  postId: string,
  heroPrompt?: string | null,
  imagePrompts?: string[] | null
) {
  if (!supa) throw new Error('Supabase client required')
  const positions = ['hero', 'inline_1', 'inline_2', 'inline_3', 'inline_4']
  const prompts = [heroPrompt || '', ...(imagePrompts || [])].slice(0, positions.length)

  // Local fallbacks from /public when Unsplash key is missing or fails
  const fallbackUrls = [
    '/modern-ocean-living.png',
    '/luxury-modern-house-exterior.png',
    '/luxury-master-bedroom.png',
    '/professional-real-estate-agent.png',
    '/placeholder.jpg',
  ]
  const haveUnsplash = !!process.env.UNSPLASH_ACCESS_KEY

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i]?.trim()
    if (!prompt) continue

    try {
      let url: string | null = null
      if (haveUnsplash) {
        url = await searchUnsplashOnce(prompt)
      }
      if (!url) {
        url = fallbackUrls[i] || fallbackUrls[fallbackUrls.length - 1]
      }

      const position = positions[i]
      // Skip if already inserted
      const exists = await supa
        .from('post_images')
        .select('id')
        .eq('post_id', postId)
        .eq('position', position)
        .limit(1)
        .maybeSingle()

      if (!exists?.data) {
        await supa.from('post_images').insert({
          post_id: postId,
          url,
          prompt: prompt || 'auto',
          position,
        })
        if (position === 'hero') {
          await supa.from('posts').update({ hero_image_url: url }).eq('id', postId)
        }
      }
    } catch (e) {
      console.warn('[unsplash] search failed for', prompts[i], String(e))
      // Ensure fallback hero at least
      try {
        const position = positions[i]
        const url = fallbackUrls[i] || fallbackUrls[fallbackUrls.length - 1]
        const exists = await supa
          .from('post_images')
          .select('id')
          .eq('post_id', postId)
          .eq('position', position)
          .limit(1)
          .maybeSingle()
        if (!exists?.data) {
          await supa
            .from('post_images')
            .insert({ post_id: postId, url, prompt: 'fallback', position })
          if (position === 'hero') {
            await supa.from('posts').update({ hero_image_url: url }).eq('id', postId)
          }
        }
      } catch {}
    }
  }
}

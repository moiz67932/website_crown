import { getSupabase } from '@/lib/supabase'

export async function searchUnsplashOnce(query: string) {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) throw new Error('UNSPLASH_ACCESS_KEY not set')
  const params = new URLSearchParams({ query, per_page: '1' })
  const res = await fetch(`https://api.unsplash.com/search/photos?${params.toString()}`, {
    headers: { Authorization: `Client-ID ${key}` },
  })
  if (!res.ok) return null
  const data = await res.json()
  if (!data || !data.results || data.results.length === 0) return null
  return data.results[0]?.urls?.regular || data.results[0]?.urls?.full || null
}

export async function attachImagesToPost(supa: any, postId: string, heroPrompt?: string | null, imagePrompts?: string[] | null) {
  if (!supa) throw new Error('Supabase client required')
  const positions = ['hero','inline_1','inline_2','inline_3','inline_4']
  const prompts = [heroPrompt || '', ...(imagePrompts || [])].slice(0, positions.length)
  const images: Array<any> = []
  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i]
    if (!prompt) continue
    try {
      const url = await searchUnsplashOnce(prompt)
      if (!url) continue
      const position = positions[i]
      images.push({ position, url, prompt })
      await supa.from('post_images').insert({ post_id: postId, url, prompt, position })
      if (position === 'hero') {
        await supa.from('posts').update({ hero_image_url: url }).eq('id', postId)
      }
    } catch (e) {
      // continue on errors for individual prompts
      console.warn('[unsplash] search failed for', prompt, String(e))
    }
  }
  return images
}

// import { getSupabase } from '@/lib/supabase'

// export async function searchUnsplashOnce(query: string) {
//   const key = process.env.UNSPLASH_ACCESS_KEY
//   if (!key) throw new Error('UNSPLASH_ACCESS_KEY not set')
//   const params = new URLSearchParams({ query, per_page: '1' })
//   const res = await fetch(`https://api.unsplash.com/search/photos?${params.toString()}`, {
//     headers: { Authorization: `Client-ID ${key}` },
//   })
//   if (!res.ok) return null
//   const data = await res.json()
//   if (!data || !data.results || data.results.length === 0) return null
//   return data.results[0]?.urls?.regular || data.results[0]?.urls?.full || null
// }

// export async function attachImagesToPost(supa: any, postId: string, heroPrompt?: string | null, imagePrompts?: string[] | null) {
//   if (!supa) throw new Error('Supabase client required')
//   const positions = ['hero','inline_1','inline_2','inline_3','inline_4']
//   const prompts = [heroPrompt || '', ...(imagePrompts || [])].slice(0, positions.length)
//   const images: Array<any> = []
//   for (let i = 0; i < prompts.length; i++) {
//     const prompt = prompts[i]
//     if (!prompt) continue
//     try {
//       const url = await searchUnsplashOnce(prompt)
//       if (!url) continue
//       const position = positions[i]
//       images.push({ position, url, prompt })
//       await supa.from('post_images').insert({ post_id: postId, url, prompt, position })
//       if (position === 'hero') {
//         await supa.from('posts').update({ hero_image_url: url }).eq('id', postId)
//       }
//     } catch (e) {
//       // continue on errors for individual prompts
//       console.warn('[unsplash] search failed for', prompt, String(e))
//     }
//   }
//   return images
// }










// src/lib/unsplash.ts
import { getSupabase } from '@/lib/supabase';

export async function searchUnsplashOnce(query: string) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) throw new Error('UNSPLASH_ACCESS_KEY not set');
  const params = new URLSearchParams({ query, per_page: '1', orientation: 'landscape' });
  const res = await fetch(`https://api.unsplash.com/search/photos?${params.toString()}`, {
    headers: { Authorization: `Client-ID ${key}` },
    cache: 'no-store'
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.results?.length) return null;
  const best = data.results[0];
  return best?.urls?.regular || best?.urls?.full || null;
}

// Derive a strong hero + inline prompts if the post lacks them.
// Very lightweight heuristic: city + topic fragments.
export function deriveImagePromptsFromPost(opts: {
  city?: string | null;
  title?: string | null;
  headings?: string[];
  fallbackTopic?: string;
}) {
  const city = (opts.city || '').replace(/-/g, ' ');
  const title = opts.title || '';
  const base = `${city} luxury homes, neighborhoods, streetscape, warm sunset`;
  const hero = `${city} skyline & neighborhoods, golden hour, upscale homes, wide angle`;

  const derived = [
    hero,
    `${city} palm-lined streets, residential, families walking`,
    `${city} coastline, homes near ocean, dusk`,
    `${city} modern architecture homes, clean lines, greenery`,
    `${city} neighborhood cafes and boutiques, lifestyle`
  ];

  // If headings provided, blend a couple
  const hs = (opts.headings || []).slice(0, 3);
  hs.forEach((h, i) => {
    derived[i + 1] = `${city} ${h.toLowerCase()} homes, street scene`;
  });

  return { heroPrompt: derived[0], imagePrompts: derived.slice(1, 5) };
}

export async function attachImagesToPost(
  supa: any,
  postId: string,
  heroPrompt?: string | null,
  imagePrompts?: string[] | null
) {
  if (!supa) throw new Error('Supabase client required');
  const positions = ['hero', 'inline_1', 'inline_2', 'inline_3', 'inline_4'];
  const prompts = [heroPrompt || '', ...(imagePrompts || [])].slice(0, positions.length);

  // Local fallbacks from /public when Unsplash key is missing or fetching fails
  const fallbackUrls = [
    '/modern-ocean-living.png',
    '/luxury-modern-house-exterior.png',
    '/luxury-master-bedroom.png',
    '/professional-real-estate-agent.png',
    '/placeholder.jpg',
  ];
  const haveUnsplash = !!process.env.UNSPLASH_ACCESS_KEY;

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i]?.trim();
    if (!prompt) continue;

    try {
      let url: string | null = null;
      if (haveUnsplash) {
        url = await searchUnsplashOnce(prompt);
      }
      // If Unsplash disabled or returned nothing, pick a stable local fallback
      if (!url) {
        url = fallbackUrls[i] || fallbackUrls[fallbackUrls.length - 1];
      }

      const position = positions[i];
      // Idempotency: skip if we already inserted this position
      const exists = await supa
        .from('post_images')
        .select('id')
        .eq('post_id', postId)
        .eq('position', position)
        .limit(1)
        .maybeSingle();

      if (!exists?.data) {
        await supa.from('post_images').insert({ post_id: postId, url, prompt: prompt || 'auto', position });
        if (position === 'hero') {
          await supa.from('posts').update({ hero_image_url: url }).eq('id', postId);
        }
      }
    } catch (e) {
      console.warn('[unsplash] search failed for', prompt, String(e));
      // Best-effort: still ensure at least a fallback hero exists
      try {
        const position = positions[i];
        const url = fallbackUrls[i] || fallbackUrls[fallbackUrls.length - 1];
        const exists = await supa
          .from('post_images')
          .select('id')
          .eq('post_id', postId)
          .eq('position', position)
          .limit(1)
          .maybeSingle();
        if (!exists?.data) {
          await supa.from('post_images').insert({ post_id: postId, url, prompt: 'fallback', position });
          if (position === 'hero') {
            await supa.from('posts').update({ hero_image_url: url }).eq('id', postId);
          }
        }
      } catch {}
    }
  }
}

import { getSupabase } from '@/lib/supabase'

export default async function FeaturedProperties({ postId, city, limit = 6 }: { postId: string; city?: string | null; limit?: number }) {
  const supa = getSupabase()
  if (!supa) return null

  // First: explicit hand-picked properties linked to this post (scored)
  const { data: rows } = await supa
    .from('post_properties')
    .select('property_id, score')
    .eq('post_id', postId)
    .order('score', { ascending: false })
    .limit(limit)

  const chosenIds = new Set<string>((rows || []).map((r: any) => r.property_id))

  // Fetch details for chosen
  let chosen: any[] = []
  if (chosenIds.size) {
    const { data: p } = await supa
      .from('properties')
      .select('id, title, slug, hero_image_url, price, city')
      .in('id', Array.from(chosenIds))
    chosen = (rows || [])
      .map((r: any) => ({ ...((p || []).find((pp: any) => pp.id === r.property_id) || {}), score: r.score }))
      .filter((x: any) => x && x.id)
  }

  // If we still need more, fill with top properties by city (recent or price-desc)
  let filler: any[] = []
  if ((chosen.length < (limit || 6)) && city) {
    const remaining = (limit || 6) - chosen.length
    const { data: p2 } = await supa
      .from('properties')
      .select('id, title, slug, hero_image_url, price, city')
      .eq('city', city)
      .order('price', { ascending: false })
      .limit(remaining * 3) // fetch extras to filter dupes/missing images

    filler = (p2 || [])
      .filter((pp: any) => !chosenIds.has(pp.id))
      .slice(0, remaining)
  }

  const items = [...chosen, ...filler].slice(0, limit)
  if (!items.length) return null

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Featured Listings{city ? ` in ${city}` : ''}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((p: any) => (
          <a key={p.id} href={`/property/${p.slug}`} className="border rounded-lg overflow-hidden hover:shadow bg-white">
            <div className="aspect-video bg-slate-200">
              {p.hero_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.hero_image_url} alt="" className="w-full h-full object-cover" />
              ) : null}
            </div>
            <div className="p-3">
              <div className="font-medium line-clamp-1">{p.title}</div>
              <div className="text-sm text-slate-600">{p.city}</div>
              {p.price ? <div className="text-sm font-semibold mt-1">{`$${(p.price/1000).toFixed(0)}k`}</div> : null}
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

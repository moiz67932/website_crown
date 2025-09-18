import { getSupabase } from '@/lib/supabase'

export default async function FeaturedProperties({ postId, city, limit = 6 }: { postId: string; city?: string | null; limit?: number }) {
  const supa = getSupabase()
  if (!supa) return null
  const { data: rows } = await supa
    .from('post_properties')
    .select('property_id, score')
    .eq('post_id', postId)
    .order('score', { ascending: false })
    .limit(limit)
  const ids = (rows||[]).map((r:any)=>r.property_id)
  let props: any[] = []
  if (ids.length) {
    const { data: p } = await supa.from('properties').select('id, title, slug, hero_image_url, price, city').in('id', ids)
    props = p || []
  }
  const items = (rows || []).map((r: any) => ({ ...props.find(pp=>pp.id===r.property_id), score: r.score })).filter((x:any)=>x && x.id)
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
                <img src={p.hero_image_url} alt={p.title} className="w-full h-full object-cover" />
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

import { getRelatedPosts } from '../../lib/related-posts'

export default async function RelatedPosts({ postId, city }: { postId: string; city?: string | null }) {
  if (!city) return null
  let posts: any[] = []
  try { posts = await getRelatedPosts({ postId, city, topK: 3 }) } catch {}
  if (!posts.length) return null
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Related Reading</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {posts.map((p: any) => (
          <a key={p.id} href={`/blog/${p.slug}`} className="border rounded-lg overflow-hidden hover:shadow bg-white">
            <div className="aspect-video bg-slate-200">
              {p.hero_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.images?.[0] || p.hero_image_url || '/placeholder-image.jpg'} alt="" className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder-image.jpg' }} />
              ) : null}
            </div>
            <div className="p-3">
              <div className="font-medium line-clamp-2">{p.title_primary}</div>
              {p.meta_description ? (
                <div className="text-sm text-slate-600 mt-1 line-clamp-3">{p.meta_description}</div>
              ) : null}
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

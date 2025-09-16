import { getSupabase } from '@/lib/supabase'
import Link from 'next/link'
import { getBucket } from '@/lib/ab'

// Render dynamically during development/publishing to avoid stale caches
export const dynamic = 'force-dynamic'

function timeAgoLabel(iso?: string | null) {
  if (!iso) return ''
  const published = new Date(iso)
  const diffMs = Date.now() - published.getTime()
  const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)))
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  }
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

export default async function BlogListPage() {
  const supa = getSupabase()
  if (!supa) return <div>Supabase not configured</div>
  const bucket = getBucket()
  const { data: posts } = await supa
    .from('posts')
    .select('*') // fetch all columns so we can use cover/thumbnail/summary if present
    .eq('status','published')
    .order('published_at', { ascending: false })
    .limit(50)

  const { data: variants } = await supa
    .from('post_title_variants')
    .select('post_id,label,title')
  const map = new Map<string, {A?:string;B?:string}>()
  ;(variants||[]).forEach(v => {
    const cur = map.get(v.post_id) || {}
    cur[v.label as 'A'|'B'] = v.title
    map.set(v.post_id, cur)
  })

  return (
    <div className="mx-auto max-w-5xl px-4 pt-24 pb-10"> {/* pt-24 prevents navbar overlap */}
      <h1 className="text-3xl font-semibold mb-6">Blog</h1>

      <ul className="space-y-8">
        {(posts||[]).map((p: any) => {
          const v = map.get(p.id)
          const title = (v && v[bucket as 'A'|'B']) || p.title_primary || p.title
          const excerpt = p.summary || p.excerpt || p.description || p.intro || ''
          // attempt common image fields; fallback to placeholder
          const image =
            p.cover_url ||
            p.thumbnail_url ||
            p.image_url ||
            p.hero ||
            p.og_image ||
            p.meta_image ||
            '/images/placeholder-16x9.png' // ensure you have a placeholder image in public/images

          const timeLabel = timeAgoLabel(p.published_at)

          return (
            <li key={p.id} className="border rounded overflow-hidden transition hover:shadow-sm">
              <Link href={`/blog/${p.slug}`} className="block">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between md:gap-6">
                  {/* Left content */}
                  <div className="w-full md:w-2/3 p-6">
                    <h2 className="text-2xl font-semibold mb-2">{title}</h2>
                    {excerpt ? (
                      <p className="text-muted-foreground mb-4 line-clamp-4">{excerpt}</p>
                    ) : (
                      <p className="text-muted-foreground mb-4 text-sm">Read more about this post.</p>
                    )}
                    <p className="text-sm text-muted-foreground">{timeLabel}</p>
                  </div>

                  {/* Right image */}
                  <div className="w-full md:w-1/3">
                    <img
                      src={image}
                      alt={title}
                      className="w-full h-48 md:h-40 object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

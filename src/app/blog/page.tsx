import { getSupabase } from '../../lib/supabase'
import Link from 'next/link'
import { getBucket } from '../../lib/ab'

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

// helper to build an excerpt (shorter now: ~100 chars)
function buildExcerpt(p: any) {
  const src =
    p.summary ||
    p.excerpt ||
    p.description ||
    p.intro ||
    p.meta_description ||
    p.content_md ||
    ''
  if (!src) return ''
  let text = src
    .replace(/[#*_>\-!\[\]\(\)]/g, '')
    .replace(/<[^>]+>/g, '')
    .trim()
  return text.slice(0, 160) + (text.length > 160 ? '…' : '')
}

export default async function BlogListPage() {
  const supa = getSupabase()
  if (!supa) return <div>Supabase not configured</div>
  const bucket = getBucket()
  const { data: posts } = await supa
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50)

  const { data: variants } = await supa
    .from('post_title_variants')
    .select('post_id,label,title')
  const map = new Map<string, { A?: string; B?: string }>()
  ;(variants || []).forEach((v) => {
    const cur = map.get(v.post_id) || {}
    cur[v.label as 'A' | 'B'] = v.title
    map.set(v.post_id, cur)
  })

  return (
    <div className="mx-auto max-w-5xl px-4 pt-24 pb-10">
      <h1 className="text-3xl font-semibold mb-6">Blog</h1>

      <ul className="space-y-8">
        {(posts || []).map((p: any) => {
          const v = map.get(p.id)
          const title =
            (v && v[bucket as 'A' | 'B']) || p.title_primary || p.title
          const excerpt = buildExcerpt(p)

          const image =
            p.hero_image_url ||
            p.cover_url ||
            p.thumbnail_url ||
            p.image_url ||
            p.hero ||
            p.og_image ||
            p.meta_image ||
            '/images/placeholder-16x9.png'

          const timeLabel = timeAgoLabel(p.published_at)

          return (
            <li
              key={p.id}
              className="border rounded-lg overflow-hidden transition hover:shadow-sm"
            >
              <Link href={`/blog/${p.slug}`} className="block h-full">
                <div className="flex flex-col md:flex-row md:gap-6 h-full">
                  {/* Left content */}
                  <div className="w-full md:w-2/3 p-6 flex flex-col justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold mb-2">{title}</h2>
                      {excerpt && (
                        <p className="text-muted-foreground mb-4">{excerpt}</p>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{timeLabel}</p>
                  </div>

                  {/* Right image full height */}
                  <div className="w-full md:w-1/3 h-full">
                    <img
                      src={image}
                      alt={title}
                      className="w-full h-full object-cover"
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

import { getSupabase } from '@/lib/supabase'
import { getBucket } from '@/lib/ab'
import { notFound } from 'next/navigation'
import Image from 'next/image'

// Avoid caching 404s while publishing; ISR can cache a notFound response.
// During development and immediate publish flows, render dynamically.
export const dynamic = 'force-dynamic'

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const supa = getSupabase()
  if (!supa) return notFound()
  const bucket = getBucket()
  let { slug } = await params
  slug = decodeURIComponent(slug || '').trim().toLowerCase()

  const baseSelect = 'id, slug, title_primary, content_md, published_at, status, hero_image_url, city, meta_description, lede'
  // 1) exact match first
  let { data: post } = await supa
    .from('posts')
    .select(baseSelect)
    .eq('slug', slug)
    .maybeSingle()

  // 2) case-insensitive equality
  if (!post) {
    const r2 = await supa.from('posts').select(baseSelect).ilike('slug', slug).maybeSingle()
    post = r2.data || post
  }

  // 3) last resort: partial match (helps when a stray char exists)
  if (!post) {
    const r3 = await supa.from('posts').select(baseSelect).ilike('slug', `%${slug}%`).limit(1).maybeSingle()
    post = r3.data || post
  }

  const isPublished = !!post && typeof post.status === 'string' && post.status.trim().toLowerCase() === 'published'
  if (!post || !isPublished) return notFound()

  const { data: variants } = await supa
    .from('post_title_variants')
    .select('label,title')
    .eq('post_id', post.id)

  const titleVariant = variants?.find((v: any) => v.label === bucket)?.title || post.title_primary

  // Extract JSON-LD script if present and remove it from body
  const jsonLdMatch = post.content_md && post.content_md.match(/<script type="application\/ld\+json">([\s\S]+?)<\/script>/)
  const jsonLd = jsonLdMatch ? jsonLdMatch[1] : null
  const bodyMd = post.content_md ? post.content_md.replace(/<script type="application\/ld\+json">[\s\S]+?<\/script>/, '').trim() : ''

  // Convert simple markdown-ish content to HTML. Keep this function small and safe.
  const html = mdToHtml(bodyMd)

  // fetch post_images
  const { data: postImages } = await supa.from('post_images').select('url,prompt,position').eq('post_id', post.id)
  const imagesByPosition: Record<string, any> = {}
  ;(postImages || []).forEach((pi: any) => { imagesByPosition[pi.position] = pi })

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Hero */}
      <header className="mb-8">
        {imagesByPosition['hero']?.url || post.hero_image_url ? (
          <div className="relative w-full h-[60vh] sm:h-[60vh] rounded-lg overflow-hidden shadow-lg mb-6">
            <Image src={imagesByPosition['hero']?.url || post.hero_image_url} alt={titleVariant} fill className="object-cover" />
          </div>
        ) : (
          <div className="w-full h-44 sm:h-64 rounded-lg bg-gradient-to-r from-sky-400 to-indigo-600 mb-6 flex items-center justify-center text-white text-2xl font-semibold">
            {post.city ? `${post.city} — ${titleVariant}` : titleVariant}
          </div>
        )}

        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-2">{titleVariant}</h1>
          <p className="text-sm text-slate-500 mb-4">{formatDate(post.published_at)} • {post.city || 'Crown Coastal Homes'}</p>
          {post.lede && <p className="text-lg text-slate-700 mb-6">{post.lede}</p>}
          {post.meta_description && <p className="text-sm text-slate-500 mb-6">{post.meta_description}</p>}
        </div>
      </header>

      <main className="prose prose-slate max-w-none dark:prose-invert">
        {/* Render main HTML body, and interleave inline images after certain headings/sections using simple marker tokens */}
        <article dangerouslySetInnerHTML={{ __html: html }} />

        {/* Inline images layout: attempt to place inline_1..inline_4 in flow */}
        <div className="mt-8 space-y-10">
          {['inline_1','inline_2','inline_3','inline_4'].map((pos, idx) => {
            const img = imagesByPosition[pos]
            if (!img) return null
            // alternate image float
            const flip = idx % 2 === 1
            return (
              <div key={pos} className={`flex flex-col md:flex-row items-center ${flip ? 'md:flex-row-reverse' : ''}`}>
                <div className="md:w-1/2 md:pr-6">
                  <img src={img.url} alt={img.prompt} className="rounded-lg shadow-lg w-full h-auto object-cover" />
                </div>
                <div className="md:w-1/2 prose prose-slate p-4">
                  <p className="text-base">Suggested image: <strong>{img.prompt}</strong></p>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />}
    </div>
  )
}

function mdToHtml(md: string) {
  if (!md) return ''

  // Very small markdown -> HTML conversion to cover headings, paragraphs, images, lists, links, and bold/italic.
  let html = md

  // Convert images: ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-lg shadow" />')

  // Headings (## --> h2, ### --> h3, # --> h1)
  html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>')
  html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>')
  html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>')

  // Bold **text** and italic *text*
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-sky-600 hover:underline">$1</a>')

  // Lists
  // Convert lines starting with - into <li> and wrap blocks into <ul>
  html = html.replace(/(^|\n)(?:- )((?:.*)(?:\n- .*)*)/g, (m, p1, p2) => {
  const items = p2.split(/\n- /).map((s: string) => s.trim()).filter(Boolean).map((i: string) => `<li>${i}</li>`).join('')
    return `${p1}<ul class="list-disc pl-6">${items}</ul>`
  })

  // Paragraphs: wrap lines separated by blank lines into <p>
  const parts = html.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
  html = parts.map(part => {
    // If it already starts with block-level tag, leave it
    if (/^<(h[1-6]|ul|ol|pre|blockquote|img)/i.test(part)) return part
    return `<p>${part}</p>`
  }).join('')

  return html
}

function formatDate(d: string | null) {
  if (!d) return ''
  try {
    const dt = new Date(d)
    return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
  } catch (e) {
    return d
  }
}

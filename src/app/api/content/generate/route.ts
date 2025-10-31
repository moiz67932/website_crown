import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getOpenAI } from '@/lib/singletons'
import { getSupabase } from '@/lib/supabase'
import { attachTopPropertiesToPost } from '@/lib/attach-properties'
import { upsertPostEmbedding } from '@/lib/embeddings'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const Payload = z.object({
  city: z.string().min(2),
  template: z.string().min(3),
  keywords: z.array(z.string()).default([]),
  scheduleAt: z.string().datetime().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  autoAttachProperties: z.boolean().optional(),
  post_type: z.string().optional(),
})

function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }

export async function POST(req: NextRequest) {
  const supa = getSupabase()
  if (!supa) return NextResponse.json({ ok:false, error:'Supabase not configured' }, { status: 500 })
  try {
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ ok:false, error:'OpenAI not configured' }, { status: 500 })
    const openai = getOpenAI()
    const input = Payload.parse(await req.json())
  const sys = 'You are an expert real estate content writer. Output valid markdown only.'
  const chosenTemplate = chooseTemplate(input)
  const user = `Write a blog post for ${input.city} using template title: "${chosenTemplate}". Include:\n1) H1 title\n2) 2-3 line lede\n3) Meta description (<=160 chars)\n4) Structured sections and bullet lists\n5) Short CTA "How to get started"\nFocus keywords: ${input.keywords.join(', ')}`

    const chat = await openai.chat.completions.create({
      model: process.env.LLM_MODEL || 'gpt-4o-mini',
      messages: [ { role:'system', content: sys }, { role:'user', content: user } ],
      temperature: 1,
    })
    const md = chat.choices[0]?.message?.content || '# Untitled\n\nContent coming soon.'

    const titleMatch = md.match(/^#\s+(.+)$/m)
    const title = titleMatch ? titleMatch[1].trim() : `Post for ${input.city}`
    const metaMatch = md.match(/meta description\s*:\s*(.+)$/i)
    const meta = (metaMatch ? metaMatch[1] : '').slice(0, 160)
    const slug = slugify(title)

    const scheduled = input.scheduleAt ? new Date(input.scheduleAt) : null
  const status = scheduled ? 'scheduled' : 'draft'

    const { data: post, error } = await supa
      .from('posts')
      .insert({
        slug,
        status,
        city: input.city,
        title_primary: title,
        meta_description: meta,
        content_md: md,
        category: input.category || null,
        tags: input.tags || null,
        scheduled_at: scheduled ? scheduled.toISOString() : null,
        generated: true,
        post_type: input.post_type || 'general',
      })
      .select('id,slug,title_primary,city')
      .single()
    if (error) return NextResponse.json({ ok:false, error: error.message }, { status: 500 })

    // Embedding
    await upsertPostEmbedding(post.id, `${title} ${input.city} ${input.keywords.join(' ')}`)

    if (input.autoAttachProperties) {
      try { await attachTopPropertiesToPost({ postId: post.id, city: post.city, topK: 6 }) } catch (e) { console.warn('[generate] attach properties failed', e) }
    }

    return NextResponse.json({ ok:true, id: post.id, slug: post.slug })
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: e.message }, { status: 400 })
  }
}

function chooseTemplate(input: z.infer<typeof Payload>) {
  // Map post_type to a display string title. In the future we can read file contents.
  const city = input.city
  const map: Record<string, string> = {
    top10: `Top 10 Neighborhoods to Buy in ${city}`,
    moving: `Moving to ${city}: Complete Guide`,
  }
  const pt = (input.post_type || '').toLowerCase()
  if (pt === 'top10') return map.top10
  if (pt === 'moving') return map.moving
  if (pt === 'predictions') return `${city} Real Estate Market Predictions`
  if (pt === 'schools') return `Best Schools in ${city}`
  if (pt === 'demographic') return `Why ${city} is Perfect for [Demographic]`
  if (pt === 'events') return `Local Events & Market News in ${city}`
  if (pt === 'discovery') return input.template
  // default fallback uses original provided template
  return input.template
}

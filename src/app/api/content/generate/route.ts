import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import OpenAI from 'openai'
import { getSupabase } from '@/lib/supabase'
import { attachTopPropertiesToPost } from '@/lib/attach-properties'
import { upsertPostEmbedding } from '@/lib/embeddings'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const Payload = z.object({
  city: z.string().min(2),
  template: z.string().min(3),
  keywords: z.array(z.string()).default([]),
  scheduleAt: z.string().datetime().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  autoAttachProperties: z.boolean().optional(),
})

function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }

export async function POST(req: NextRequest) {
  const supa = getSupabase()
  if (!supa) return NextResponse.json({ ok:false, error:'Supabase not configured' }, { status: 500 })
  try {
    const input = Payload.parse(await req.json())
    const sys = 'You are an expert real estate content writer. Output valid markdown only.'
    const user = `Write a blog post for ${input.city} using template "${input.template}". Include:\n1) H1 title\n2) 2-3 line lede\n3) Meta description (<=160 chars)\n4) Structured sections and bullet lists\n5) Short CTA "How to get started"\nFocus keywords: ${input.keywords.join(', ')}`

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

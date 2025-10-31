import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getOpenAI } from '@/lib/singletons'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const supa = getSupabase()
  if (!supa) return NextResponse.json({ ok:false, error:'Supabase not configured' }, { status: 500 })
  try {
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ ok:false, error:'OpenAI not configured' }, { status: 500 })
    const openai = getOpenAI()
    const { postId } = await req.json()
    if (!postId) return NextResponse.json({ ok:false, error:'postId required' }, { status: 400 })
    const { data: post } = await supa.from('posts').select('id,title_primary,city,content_md').eq('id', postId).single()
    if (!post) return NextResponse.json({ ok:false, error:'Not found' }, { status: 404 })
    const prompt = `Add two substantial new sections with H2 headings to the following markdown article about ${post.city || ''}. Keep tone and style. Return only markdown of the new sections.\n\n---\n${post.content_md || ''}`
    const model = process.env.LLM_MODEL || 'gpt-4o-mini'
    const resp = await openai.chat.completions.create({ model, messages: [{ role:'user', content: prompt }], temperature: 0.9 })
    const add = resp.choices[0]?.message?.content || ''
    const updated = `${post.content_md || ''}\n\n${add}`
    await supa.from('posts').update({ content_md: updated }).eq('id', postId)
    return NextResponse.json({ ok:true, added: add.length })
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message }, { status: 400 })
  }
}

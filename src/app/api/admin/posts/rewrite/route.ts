import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getOpenAI } from '@/lib/singletons'

export const dynamic = 'force-dynamic'

// Ensure dynamic to avoid static analysis execution
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const supa = getSupabase()
  if (!supa) return NextResponse.json({ ok:false, error:'Supabase not configured' }, { status: 500 })
  try {
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ ok:false, error:'OpenAI not configured' }, { status: 500 })
    const openai = getOpenAI()
    const { postId } = await req.json()
    if (!postId) return NextResponse.json({ ok:false, error:'postId required' }, { status: 400 })
    const { data: post } = await supa.from('posts').select('id,title_primary,meta_description,slug').eq('id', postId).single()
    if (!post) return NextResponse.json({ ok:false, error:'Post not found' }, { status: 404 })

    const prompt = `Rewrite the following blog title and meta description to maximize CTR while staying accurate. Keep meta <= 155 chars. Return as JSON with keys title and meta.\n\nTITLE: ${post.title_primary}\nMETA: ${post.meta_description || ''}`
    const model = process.env.LLM_MODEL || 'gpt-4o-mini'
    const resp = await openai.chat.completions.create({ model, messages: [ { role:'user', content: prompt } ], temperature: 0.8 })
    const txt = resp.choices[0]?.message?.content?.trim() || ''
    let titleB = '', metaB = ''
    try { const j = JSON.parse(txt); titleB = String(j.title||''); metaB = String(j.meta||'').slice(0,155) } catch { titleB = txt.split('\n')[0]?.slice(0,120) || ''; metaB = (txt.split('\n')[1]||'').slice(0,155) }

    // Ensure variant A seeded
    const { data: hasA } = await supa.from('post_title_variants').select('id').eq('post_id', postId).eq('label','A').limit(1)
    if (!hasA?.length) {
      await supa.from('post_title_variants').insert({ post_id: postId, label: 'A', title: post.title_primary })
    }
    // Upsert B: if exists, update; else insert
    const { data: b } = await supa.from('post_title_variants').select('id').eq('post_id', postId).eq('label','B').limit(1)
    if (b?.length) {
      await supa.from('post_title_variants').update({ title: titleB }).eq('id', b[0].id)
    } else {
      await supa.from('post_title_variants').insert({ post_id: postId, label: 'B', title: titleB })
    }
    // Update posts meta B as fallback storage: if meta_description exists, store in same column (no variants table for meta). For now, overwrite only if empty.
    if (!post.meta_description && metaB) {
      await supa.from('posts').update({ meta_description: metaB }).eq('id', postId)
    }
    return NextResponse.json({ ok:true, title: { A: post.title_primary, B: titleB }, metaB })
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || 'Failed' }, { status: 500 })
  }
}

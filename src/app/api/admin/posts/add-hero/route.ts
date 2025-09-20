import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { attachImagesToPost, deriveImagePromptsFromPost } from '@/lib/unsplash'

export async function POST(req: NextRequest) {
  const supa = getSupabase()
  if (!supa) return NextResponse.json({ ok:false, error:'Supabase not configured' }, { status: 500 })
  try {
    const { postId } = await req.json()
    if (!postId) return NextResponse.json({ ok:false, error:'postId required' }, { status: 400 })
    const { data: post } = await supa.from('posts').select('id,city,title_primary').eq('id', postId).single()
    if (!post) return NextResponse.json({ ok:false, error:'Not found' }, { status: 404 })
    const prompts = deriveImagePromptsFromPost({ city: post.city, title: post.title_primary, headings: [] })
    await attachImagesToPost(supa, postId, prompts.heroPrompt, prompts.imagePrompts)
    return NextResponse.json({ ok:true })
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message }, { status: 400 })
  }
}

import { NextResponse } from 'next/server'
import { getSupabase } from '../../../../../lib/supabase'

export async function POST() {
  const supa = getSupabase()
  if (!supa) return NextResponse.json({ success:false, error:'Supabase not configured' }, { status: 500 })
  // Find posts under 500 words and mark for expansion via job log
  let posts: any[] = []
  const { data: rpcData, error: rpcError } = await supa.rpc('posts_with_short_content', { min_words: 500 })
  if (!rpcError) {
    posts = rpcData ?? []
  } else {
    // proceed with empty list on error; job log below will still be written
    posts = []
  }
  const { data: job } = await supa.from('bulk_jobs').insert({ job_name: 'regenerate_short_posts' }).select('*').single()
  let processed = 0
  for (const p of posts || []) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/admin/posts/expand`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ postId: p.id }) })
      processed++
    } catch {}
  }
  await supa.from('bulk_jobs').update({ status:'done', finished_at: new Date().toISOString(), logs: `processed=${processed}` }).eq('id', job?.id)
  return NextResponse.json({ success:true, processed })
}

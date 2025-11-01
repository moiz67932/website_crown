import { getSupabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  // Next.js (v15+) expects params to be a Promise in app router pages. Await it.
  const resolvedParams = await params
  const supa = getSupabase()
  if (!supa) return notFound()
  const { data: post } = await supa
    .from('posts')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()
  if (!post) return notFound()

  const { data: variants } = await supa
    .from('post_title_variants')
    .select('id,label,title,impressions,clicks')
  .eq('post_id', resolvedParams.id)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Edit Post</h1>
      <div className="grid gap-4">
        <div>
          <div className="text-sm mb-1 font-medium">Primary Title</div>
          <div className="p-2 border rounded bg-muted/30">{post.title_primary}</div>
        </div>
        <div>
          <div className="text-sm mb-1 font-medium">Slug</div>
          <div className="p-2 border rounded bg-muted/30">{post.slug}</div>
        </div>
        <div>
          <div className="text-sm mb-1 font-medium">Status</div>
          {/* client-side editor below */}
          <StatusEditor postId={post.id} currentStatus={post.status} slug={post.slug} />
        </div>
        <div>
          <div className="text-sm mb-1 font-medium">Variants</div>
          <ul className="space-y-1 text-sm">
            {(variants||[]).map(v => (
              <li key={v.id} className="border rounded p-2 flex items-center justify-between">
                <span>{v.label}: {v.title}</span>
                <span className="text-xs text-muted-foreground">Imp {v.impressions} / Click {v.clicks}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-sm mb-1 font-medium">Content (raw)</div>
          <pre className="text-xs bg-muted p-3 rounded max-h-[480px] overflow-auto whitespace-pre-wrap">{post.content_md}</pre>
        </div>
      </div>
    </div>
  )
}

// Client component placed in same file for convenience
// It will be shipped to client; keep it minimal and use fetch to PATCH the status
import StatusEditor from '../../../../components/admin/StatusEditor'


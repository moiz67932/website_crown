import { getSupabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Edit Post</h1>
            <p className="text-slate-600 mt-2">Manage post content and settings</p>
          </div>
          <div className="flex items-center gap-3">
            {post.status === 'published' && (
              <Link 
                href={`/blog/${post.slug}`} 
                target="_blank"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Live
              </Link>
            )}
            <Link 
              href="/admin/posts"
              className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Posts
            </Link>
          </div>
        </div>

        {/* Content Cards */}
        <div className="space-y-6">
          {/* Primary Title Card */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Primary Title</h2>
            </div>
            <div className="p-6">
              <div className="text-lg font-semibold text-slate-900">{post.title_primary}</div>
            </div>
          </div>

          {/* URL Slug Card */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">URL Slug</h2>
            </div>
            <div className="p-6">
              <code className="text-sm font-mono text-blue-600 bg-blue-50 px-3 py-2 rounded-md border border-blue-200">
                {post.slug}
              </code>
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Publication Status</h2>
            </div>
            <div className="p-6">
              <StatusEditor postId={post.id} currentStatus={post.status} slug={post.slug} />
            </div>
          </div>

          {/* Title Variants Card */}
          {variants && variants.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Title Variants (A/B Testing)</h2>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  {variants.map(v => (
                    <li key={v.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:bg-slate-100 transition-colors duration-150">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                              {v.label}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-slate-900">{v.title}</div>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="text-center">
                            <div className="text-slate-500 font-semibold mb-1">Impressions</div>
                            <div className="text-lg font-bold text-slate-900">{v.impressions?.toLocaleString() || 0}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-slate-500 font-semibold mb-1">Clicks</div>
                            <div className="text-lg font-bold text-blue-600">{v.clicks?.toLocaleString() || 0}</div>
                          </div>
                          {v.impressions > 0 && (
                            <div className="text-center">
                              <div className="text-slate-500 font-semibold mb-1">CTR</div>
                              <div className="text-lg font-bold text-green-600">
                                {((v.clicks / v.impressions) * 100).toFixed(1)}%
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Content Preview Card */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Markdown Content</h2>
            </div>
            <div className="p-6">
              <pre className="text-xs font-mono bg-slate-900 text-slate-100 p-6 rounded-lg max-h-[600px] overflow-auto whitespace-pre-wrap border border-slate-700 shadow-inner">
                {post.content_md}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Client component placed in same file for convenience
// It will be shipped to client; keep it minimal and use fetch to PATCH the status
import StatusEditor from '@/components/admin/StatusEditor'


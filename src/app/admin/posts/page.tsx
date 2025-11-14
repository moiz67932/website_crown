import { getSupabase } from '@/lib/supabase'
import Link from 'next/link'

export const revalidate = 30

type Search = { status?: string; city?: string; generated?: string }
export default async function AdminPosts({ searchParams }: { searchParams?: Promise<Search> }) {
  const supa = getSupabase()
  if (!supa) return <div>Supabase not configured</div>
  const sp = (await (searchParams || Promise.resolve({} as Search))) || ({} as Search)
  const status = sp.status
  const city = sp.city
  const generated = sp.generated

  let query = supa
    .from('posts')
    .select('id, slug, title_primary, status, scheduled_at, published_at, city, generated')
    .order('created_at', { ascending: false })
    .limit(200) as any
  if (status) query = query.eq('status', status)
  if (city) query = query.ilike('city', city)
  if (generated) query = query.eq('generated', generated === 'true')
  const { data } = await query

  // views aggregation
  const ids = (data||[]).map((p:any)=>p.id)
  let viewsById = new Map<string, number>()
  if (ids.length) {
    // Fallback aggregation per post due to lack of group() in typed client
    for (const id of ids) {
      const { count } = await supa.from('page_views').select('*', { count: 'exact', head: true }).eq('post_id', id)
      viewsById.set(id, count || 0)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 lg:p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Blog Posts</h1>
            <p className="text-slate-600 mt-1 text-sm">Manage and publish your content</p>
          </div>
          <Link 
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5"
            href="/admin/posts/new"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Post
          </Link>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">Title</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wide whitespace-nowrap">City</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wide whitespace-nowrap">Status</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wide whitespace-nowrap">Scheduled</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wide whitespace-nowrap">Published</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wide whitespace-nowrap">Views</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wide whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data||[]).map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                    <td className="px-4 py-3 max-w-xs">
                      <Link 
                        href={`/admin/posts/${p.id}`} 
                        className="text-slate-900 font-medium hover:text-blue-600 transition-colors duration-200 line-clamp-2 block"
                      >
                        {p.title_primary}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <span className="text-slate-700 font-medium text-sm">{p.city || '-'}</span>
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        p.status === 'published' 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : p.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center text-xs text-slate-600 whitespace-nowrap">
                      {p.scheduled_at ? (
                        <time className="font-mono block">
                          <div>{new Date(p.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                          <div className="text-slate-500">{new Date(p.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                        </time>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center text-xs text-slate-600 whitespace-nowrap">
                      {p.published_at ? (
                        <time className="font-mono block">
                          <div>{new Date(p.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                          <div className="text-slate-500">{new Date(p.published_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                        </time>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {viewsById.get(p.id)?.toLocaleString() || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {p.status === 'published' ? (
                          <Link 
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors duration-200" 
                            href={`/blog/${p.slug}`} 
                            target="_blank"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-4.5 py-1.5 text-xs font-medium text-slate-400 italic">Draft</span>
                        )}
                        <Link 
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors duration-200" 
                          href={`/admin/posts/${p.id}`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!data || data.length === 0) && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-semibold text-slate-900">No posts</h3>
                <p className="mt-1 text-sm text-slate-500">Get started by creating a new blog post.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

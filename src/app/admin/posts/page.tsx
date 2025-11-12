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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Posts</h1>
        <Link className="underline" href="/admin/posts/new">New</Link>
      </div>
      <table className="w-full text-sm border">
        <thead className="bg-muted/50">
          <tr>
            <th className="p-2 text-left">Title</th>
            <th className="p-2">City</th>
            <th className="p-2">Status</th>
            <th className="p-2">Scheduled</th>
            <th className="p-2">Published</th>
            <th className="p-2">Views</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {(data||[]).map((p: any) => (
            <tr key={p.id} className="border-t hover:bg-muted/30">
              <td className="p-2">
                <Link href={`/admin/posts/${p.id}`} className="underline">{p.title_primary}</Link>
              </td>
              <td className="p-2 text-center">{p.city || '-'}</td>
              <td className="p-2 text-center">{p.status}</td>
              <td className="p-2 text-center">{p.scheduled_at?.slice(0,16) || '-'}</td>
              <td className="p-2 text-center">{p.published_at?.slice(0,16) || '-'}</td>
              <td className="p-2 text-center">{viewsById.get(p.id) || 0}</td>
              <td className="p-2 text-center space-x-2">
                {p.status === 'published' ? (
                  <Link className="underline text-blue-600" href={`/blog/${p.slug}`} target="_blank">View</Link>
                ) : (
                  <span className="text-gray-400 text-xs">(draft)</span>
                )}
                <Link className="underline" href={`/admin/posts/${p.id}`}>Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

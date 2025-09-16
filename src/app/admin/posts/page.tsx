import { getSupabase } from '@/lib/supabase'
import Link from 'next/link'

export const revalidate = 30

export default async function AdminPosts() {
  const supa = getSupabase()
  if (!supa) return <div>Supabase not configured</div>
  const { data } = await supa
    .from('posts')
    .select('id, slug, title_primary, status, scheduled_at, published_at')
    .order('created_at', { ascending: false })
    .limit(100)

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
            <th className="p-2">Status</th>
            <th className="p-2">Scheduled</th>
            <th className="p-2">Published</th>
          </tr>
        </thead>
        <tbody>
          {(data||[]).map(p => (
            <tr key={p.id} className="border-t hover:bg-muted/30">
              <td className="p-2">
                <Link href={`/admin/posts/${p.id}`} className="underline">{p.title_primary}</Link>
              </td>
              <td className="p-2 text-center">{p.status}</td>
              <td className="p-2 text-center">{p.scheduled_at?.slice(0,16) || '-'}</td>
              <td className="p-2 text-center">{p.published_at?.slice(0,16) || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

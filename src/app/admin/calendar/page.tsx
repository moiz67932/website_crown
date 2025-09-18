import { getSupabase } from '@/lib/supabase'

export const revalidate = 60

export default async function CalendarPage() {
  const supa = getSupabase()
  if (!supa) return <div>Supabase not configured</div>
  const { data } = await supa
    .from('posts')
    .select('id, title_primary, scheduled_at, city, status, slug')
    .eq('status', 'scheduled')
    .order('scheduled_at', { ascending: true })
    .limit(200)
  const groups = groupByDay(data || [])
  const days = Object.keys(groups).sort()
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Publishing Calendar</h1>
      <div className="grid gap-4">
        {days.map(d => (
          <div key={d} className="border rounded p-3 bg-white">
            <div className="font-medium mb-2">{formatDay(d)}</div>
            <ul className="space-y-1 text-sm">
              {groups[d].map((p:any)=>(
                <li key={p.id} className="flex items-center justify-between">
                  <div>
                    <a href={`/admin/posts/${p.id}`} className="underline">{p.title_primary}</a>
                    <span className="text-slate-500 ml-2">{p.city || ''}</span>
                  </div>
                  <a href={`/blog/${p.slug}`} className="text-sky-600 hover:underline">Preview</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {!days.length && <div className="text-sm text-slate-600">No scheduled posts.</div>}
      </div>
    </div>
  )
}

function groupByDay(rows: any[]) {
  const m: Record<string, any[]> = {}
  for (const r of rows) {
    const key = (r.scheduled_at || '').slice(0, 10)
    if (!key) continue
    m[key] = m[key] || []
    m[key].push(r)
  }
  return m
}

function formatDay(d: string) {
  try { return new Date(d).toLocaleDateString(undefined, { weekday: 'long', year:'numeric', month:'long', day:'numeric' }) } catch { return d }
}

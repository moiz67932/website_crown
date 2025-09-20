import { getSupabase } from '@/lib/supabase'
import ChartCard from '@/components/admin/ChartCard'
import { ViewsLine, CTRBar } from '@/components/admin/charts/AnalyticsCharts'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const supa = getSupabase()
  if (!supa) return <div>Supabase not configured</div>

  // Views by day
  let byDay: any[] | null = null
  try { const { data } = await supa.rpc('views_by_day'); byDay = data as any[] } catch { byDay = null }
  // Variant split (fallback: compute client-side style via selects)
  let variantRows: any[] = []
  try {
    const variants = ['A','B'] as const
    for (const v of variants) {
      const { count } = await supa.from('page_views').select('*', { count: 'exact', head: true }).eq('variant', v)
      variantRows.push({ variant: v, count: count || 0 })
    }
  } catch {}

  // Top posts
  let topPosts: any[] = []
  try {
    const { data } = await supa.from('page_views').select('post_id').not('post_id', 'is', null)
    const acc = new Map<string, number>()
    for (const r of (data||[])) { acc.set(r.post_id, (acc.get(r.post_id)||0)+1) }
    const ids = Array.from(acc.keys())
    let posts: any[] = []
    if (ids.length) {
      const { data: p } = await supa.from('posts').select('id,slug,title_primary').in('id', ids)
      posts = p || []
    }
    const name = (id:string)=> posts.find(pp=>pp.id===id)?.title_primary || id
    topPosts = ids.map((id)=>({ id, title: name(id), views: acc.get(id)! })).sort((a: any,b: any)=>b.views-a.views).slice(0,20)
  } catch {}

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Analytics</h1>

      <ChartCard title="Views by day">
        {byDay && byDay.length ? <ViewsLine data={byDay as any} /> : <div className="text-sm text-slate-600">No data</div>}
      </ChartCard>

      <ChartCard title="A/B Variant Split">
        <CTRBar data={variantRows.map(v=>({ label: v.variant, value: v.count }))} />
      </ChartCard>

      <section>
        <h2 className="font-medium mb-2">Top Posts</h2>
        {topPosts.length ? (
          <table className="w-full text-sm border">
            <thead className="bg-muted/50"><tr><th className="p-2 text-left">Post</th><th className="p-2 text-right">Views</th></tr></thead>
            <tbody>
              {topPosts.map(p => (
                <tr key={p.id} className="border-t"><td className="p-2">{p.title}</td><td className="p-2 text-right">{p.views}</td></tr>
              ))}
            </tbody>
          </table>
        ) : <div className="text-sm text-slate-600">No data</div>}
      </section>
    </div>
  )
}

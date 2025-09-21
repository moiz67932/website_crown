import { getSupabase } from '@/lib/supabase'
import Link from 'next/link'
import { fetchRealEstateTrends } from '@/lib/discovery/google-trends'
import GenerateDraftButton from './GenerateDraftButton'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export default async function DiscoveryPage() {
  const supa = getSupabase()
  if (!supa) return <div className="p-6">Supabase not configured.</div>
  const { data } = await supa
    .from('discovered_topics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  // Enriched map: title (raw query) -> blog_topic headline (from live trends)
  // If enrichment fails, we just fall back to DB topic
  const enriched = await fetchRealEstateTrends()
  const titleToBlog: Record<string, string> = {}
  for (const t of enriched) {
    if (!t.title) continue
    if (t.blog_topic) titleToBlog[t.title] = t.blog_topic
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Discovery</h1>
          <p className="text-sm text-slate-600">Trending topics filtered for real estate.</p>
        </div>
        <form action={refreshAction}>
          <button className="rounded-lg bg-slate-900 text-white px-4 py-2 hover:bg-slate-800 hover:cursor-pointer">Refresh from Google Trends</button>
        </form>
      </div>

      <div className="rounded-xl border overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80">
            <tr className="text-left text-slate-600">
              <Th>Topic</Th>
              <Th className="w-32">Source</Th>
              {/* Traffic column removed - no reliable data source */}
              <Th className="w-40">Created</Th>
              <Th className="w-40 text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {(data||[]).map((r:any)=> (
              <tr key={r.id} className="border-t hover:bg-slate-50/50">
                <td className="p-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900">{titleToBlog[r.topic] || r.topic}</span>
                    {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-sky-600 hover:underline">Source</a>}
                  </div>
                </td>
                <td className="p-3 align-top">{r.source || 'google_trends'}</td>
                <td className="p-3 align-top text-slate-600">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-3 align-top">
                  <div className="flex justify-end">
                    <GenerateDraftButton title={titleToBlog[r.topic] || r.topic} />
                  </div>
                </td>
              </tr>
            ))}
            {!data?.length && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-500">No topics yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({ children, className = '' }: { children: any; className?: string }) {
  return <th className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${className}`}>{children}</th>
}

async function refreshAction() {
  'use server'
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  await fetch(`${base}/api/admin/discovery`, { method: 'POST' })
  // Re-render this page so new rows show immediately
  revalidatePath('/admin/discovery')
}

// moved GenerateDraftButton to a separate client file to avoid hooks in server component

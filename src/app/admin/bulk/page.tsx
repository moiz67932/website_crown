// src/app/admin/bulk/page.tsx
export const dynamic = "force-dynamic";

import { getSupabase } from '@/lib/supabase'

export default async function BulkAdmin() {
  async function call(path: string, body?: any) {
    'use server'
    try {
      const res = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body||{}) })
      return await res.json()
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed' }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bulk operations</h1>
        <p className="text-sm text-slate-600">Run batch jobs across posts, properties, and landing pages.</p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Vector index">
          <form action={call.bind(null, '/api/admin/bulk/rebuild-index')}>
            <button className="rounded-lg bg-slate-900 text-white px-4 py-2 hover:bg-slate-800 hover:cursor-pointer">Rebuild property index</button>
          </form>
        </Card>
        <Card title="Landing pages">
          <form action={call.bind(null, '/api/admin/bulk/regenerate-landing')}>
            <button className="rounded-lg bg-slate-900 text-white px-4 py-2 hover:bg-slate-800 hover:cursor-pointer">Regenerate all landing</button>
          </form>
        </Card>
        <Card title="Blog FAQs">
          <form action={call.bind(null, '/api/admin/bulk/regenerate-faqs')}>
            <button className="rounded-lg bg-slate-900 text-white px-4 py-2 hover:bg-slate-800 hover:cursor-pointer">Regenerate all FAQs</button>
          </form>
        </Card>
        <Card title="Short posts">
          <form action={call.bind(null, '/api/admin/bulk/short-posts')}>
            <button className="rounded-lg bg-slate-900 text-white px-4 py-2 hover:bg-slate-800 hover:cursor-pointer">Regenerate short posts (&lt;500 words)</button>
          </form>
        </Card>
        <Card title="Publish queue">
          <form action={call.bind(null, '/api/admin/bulk/republish-today')}>
            <button className="rounded-lg bg-slate-900 text-white px-4 py-2 hover:bg-slate-800 hover:cursor-pointer">Republish scheduled today</button>
          </form>
        </Card>
        <Card title="Export">
          <form action={call.bind(null, '/api/admin/bulk/export')}>
            <button className="rounded-lg border bg-white px-4 py-2 hover:bg-slate-50 hover:cursor-pointer">Export blog data</button>
          </form>
        </Card>
      </section>

      {await JobsList()}
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

async function JobsList() {
  const supa = getSupabase()
  if (!supa) return null
  const { data } = await supa.from('bulk_jobs').select('*').order('started_at', { ascending: false }).limit(50)
  if (!data?.length) return <section className="rounded-xl border bg-white p-5 shadow-sm"><div className="text-sm text-slate-600">No recent jobs.</div></section>
  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold mb-3">Recent jobs</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80"><tr className="text-left text-slate-600"><th className="p-2">Job</th><th className="p-2">Started</th><th className="p-2">Finished</th><th className="p-2">Status</th><th className="p-2">Logs</th></tr></thead>
          <tbody>
            {data.map((r:any)=>(
              <tr key={r.id} className="border-t"><td className="p-2">{r.job_name}</td><td className="p-2">{r.started_at}</td><td className="p-2">{r.finished_at||'—'}</td><td className="p-2">{r.status}</td><td className="p-2 whitespace-pre-wrap">{r.logs||''}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

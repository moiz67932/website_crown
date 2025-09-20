// src/app/admin/bulk/page.tsx
export const dynamic = "force-dynamic";

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
            <button className="rounded-lg bg-slate-900 text-white px-4 py-2 hover:bg-slate-800">Rebuild property index</button>
          </form>
        </Card>
        <Card title="Landing pages">
          <form action={call.bind(null, '/api/admin/bulk/regenerate-landing')}>
            <button className="rounded-lg bg-slate-900 text-white px-4 py-2 hover:bg-slate-800">Regenerate all landing</button>
          </form>
        </Card>
        <Card title="Blog FAQs">
          <form action={call.bind(null, '/api/admin/bulk/regenerate-faqs')}>
            <button className="rounded-lg bg-slate-900 text-white px-4 py-2 hover:bg-slate-800">Regenerate all FAQs</button>
          </form>
        </Card>
        <Card title="Export">
          <form action={call.bind(null, '/api/admin/bulk/export')}>
            <button className="rounded-lg border bg-white px-4 py-2 hover:bg-slate-50">Export blog data</button>
          </form>
        </Card>
      </section>
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

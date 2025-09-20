import { getSupabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EditProperty({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supa = getSupabase()
  if (!supa) return notFound()
  const { data: row } = await supa.from('properties').select('*').eq('id', id).single()
  if (!row) return notFound()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit Property</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" value={row.title} />
        <Field label="City" value={row.city} />
        <Field label="Type" value={row.property_type} />
        <Field label="Status" value={row.status} />
        <Field label="Price" value={formatPrice(row.price)} />
        <Field label="Slug" value={row.slug} />
      </div>
      <div>
        <div className="text-sm font-medium mb-1">Hero</div>
        <div className="border rounded overflow-hidden bg-white">
          {row.hero_image_url ? <img src={row.hero_image_url} alt="" className="w-full max-w-xl" /> : <div className="p-4 text-sm text-slate-600">No image</div>}
        </div>
      </div>
      <form action={`/api/admin/properties`} method="post" className="flex gap-3">
        <input type="hidden" name="id" value={row.id} />
        <input type="hidden" name="_method" value="DELETE" />
  <button className="rounded-lg border px-3 py-2 text-sm hover:bg-red-50 hover:cursor-pointer">Delete</button>
        <a href={`/property/${row.slug}`} className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50">View</a>
      </form>
    </div>
  )
}

function Field({ label, value }: { label: string, value?: any }) {
  return (
    <div>
      <div className="text-sm mb-1 font-medium">{label}</div>
      <div className="p-2 border rounded bg-muted/30 text-sm">{String(value ?? '—')}</div>
    </div>
  )
}

function formatPrice(n?: number | null) {
  if (!n || n <= 0) return "—";
  try { return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }); } catch { return `$${n}`; }
}

"use client"
import { useState } from 'react'

export default function LeadForm({ defaults }: { defaults?: Partial<Record<string, any>> }) {
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [start] = useState(() => Date.now())

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErr(null)
    const fd = new FormData(e.currentTarget)
    fd.set('__top', String(Date.now() - start))
    try {
      const r = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(fd as any)) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j?.error || 'Submit failed')
      setOk(true)
    } catch (e: any) { setErr(e?.message || 'Error') } finally { setLoading(false) }
  }

  if (ok) return <div className="rounded-md border p-4 text-green-700">Thanks! We’ll reach out shortly.</div>

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <input name="company" className="hidden" tabIndex={-1} autoComplete="off" />
      <input name="firstName" placeholder="First name" defaultValue={defaults?.firstName} className="border rounded p-2" />
      <input name="lastName" placeholder="Last name" defaultValue={defaults?.lastName} className="border rounded p-2" />
      <input name="email" placeholder="Email" type="email" defaultValue={defaults?.email} className="border rounded p-2" />
      <input name="phone" placeholder="Phone" defaultValue={defaults?.phone} className="border rounded p-2" />
      <textarea name="message" placeholder="Tell us what you’re looking for…" className="border rounded p-2" />
      <input name="city" placeholder="City" defaultValue={defaults?.city} className="border rounded p-2" />
      <input name="state" placeholder="State" defaultValue={defaults?.state ?? 'CA'} className="border rounded p-2" />
      <input name="county" placeholder="County" defaultValue={defaults?.county} className="border rounded p-2" />
      <input name="budgetMax" placeholder="Budget max (e.g., 750000)" className="border rounded p-2" />
      <select name="timeframe" className="border rounded p-2" defaultValue="30d">
        <option value="now">Buying now</option>
        <option value="30d">Within 30 days</option>
        <option value="90d">Within 90 days</option>
        <option value="later">Later</option>
      </select>
      <label className="inline-flex items-center gap-2"><input type="checkbox" name="wantsTour" /> I want a tour</label>
      {err && <div className="text-red-600 text-sm">{err}</div>}
      <button disabled={loading} className="rounded bg-black text-white px-4 py-2">{loading ? 'Sending…' : 'Contact Agent'}</button>
    </form>
  )
}

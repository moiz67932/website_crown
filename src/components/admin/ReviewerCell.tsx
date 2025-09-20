"use client"
import { useState } from 'react'

export default function ReviewerCell({ id, initial }: { id: string; initial?: string | null }) {
  const [value, setValue] = useState(initial || '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/posts', { method:'PATCH', headers:{'content-type':'application/json'}, body: JSON.stringify({ id, reviewer: value || null }) })
      if (!res.ok) throw new Error('Failed')
    } catch {}
    finally { setSaving(false) }
  }

  return (
    <div className="flex items-center gap-2">
      <input className="w-32 border rounded px-2 py-1 text-xs" value={value} onChange={e=>setValue(e.target.value)} placeholder="name or @handle" />
  <button onClick={save} disabled={saving} className="rounded border px-2 py-1 text-xs hover:bg-slate-50 hover:cursor-pointer">Save</button>
    </div>
  )
}

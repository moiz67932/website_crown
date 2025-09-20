'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const templates = [
  'Top 10 Neighborhoods',
  'Moving to',
  'Market Predictions',
  'Best Schools',
  'Why [City] is Perfect for [Demographic]',
  'Local Events',
]

export default function NewPostGenerator() {
  const [city, setCity] = useState('')
  const [template, setTemplate] = useState(templates[0])
  const [keywords, setKeywords] = useState('')
  const [scheduleAt, setScheduleAt] = useState('')
  const [autoAttachProperties, setAutoAttach] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST', headers: { 'content-type':'application/json' },
        body: JSON.stringify({ city, template, keywords: splitKeywords(keywords), scheduleAt: scheduleAt || undefined, autoAttachProperties })
      })
      const j = await res.json()
      if (!j.ok) throw new Error(j.error || 'Error')
      router.push(`/admin/posts/${j.id}`)
    } catch (e:any) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Generate New Post</h1>
      <form onSubmit={submit} className="grid gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">City</label>
          <input className="w-full border rounded px-3 py-2" value={city} onChange={e=>setCity(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Template</label>
          <select className="w-full border rounded px-3 py-2" value={template} onChange={e=>setTemplate(e.target.value)}>
            {templates.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Keywords (comma-separated)</label>
          <input className="w-full border rounded px-3 py-2" value={keywords} onChange={e=>setKeywords(e.target.value)} placeholder="neighborhoods, schools, coastal, family" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Schedule At (optional)</label>
          <input type="datetime-local" className="w-full border rounded px-3 py-2" value={scheduleAt} onChange={e=>setScheduleAt(e.target.value)} />
        </div>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={autoAttachProperties} onChange={e=>setAutoAttach(e.target.checked)} />
          <span className="text-sm">Auto-attach properties</span>
        </label>
        <div className="flex gap-3">
          <button disabled={!city || loading} className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50">{loading ? 'Generating…' : 'Generate'}</button>
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
      </form>
    </div>
  )
}

function splitKeywords(s: string) { return s.split(',').map(v=>v.trim()).filter(Boolean) }

"use client"
import { useState } from 'react'

export default function DiscoverPage() {
  const [city, setCity] = useState('')
  const [niche, setNiche] = useState('real estate')
  const [ideas, setIdeas] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function suggest(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch(`/api/content/suggest?city=${encodeURIComponent(city)}&niche=${encodeURIComponent(niche)}`)
    const j = await res.json()
    setIdeas(j.ideas || [])
    setLoading(false)
  }

  async function generate(i: any) {
    const keywords = (i.keywords || []).filter(Boolean)
    const res = await fetch('/api/content/generate', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ city, template: i.title, keywords, autoAttachProperties: true }) })
    const j = await res.json()
    if (j.ok) window.location.href = `/admin/posts/${j.id}`
  }

  return (
    <div className="p-6 max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Topic Discovery</h1>
      <form onSubmit={suggest} className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-sm">City</label>
          <input className="border rounded px-3 py-2" value={city} onChange={e=>setCity(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm">Niche</label>
          <input className="border rounded px-3 py-2" value={niche} onChange={e=>setNiche(e.target.value)} />
        </div>
        <button disabled={!city || loading} className="px-4 py-2 bg-primary text-white rounded">{loading? 'Loading…':'Suggest'}</button>
      </form>

      <ul className="space-y-2">
        {ideas.map((i, idx) => (
          <li key={idx} className="border rounded p-3 bg-white flex items-center justify-between">
            <div>
              <div className="font-medium">{i.title}</div>
              {i.keywords && <div className="text-xs text-slate-600">{i.keywords.join(', ')}</div>}
            </div>
            <button className="px-3 py-2 border rounded" onClick={()=>generate(i)}>Generate Draft</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

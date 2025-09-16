'use client'
import { useState } from 'react'

export default function NewPostGenerator() {
  const [city, setCity] = useState('')
  const [type, setType] = useState('top10')
  const [loading, setLoading] = useState(false)
  const [out, setOut] = useState<any>(null)
  async function gen() {
    setLoading(true)
    setOut(null)
    const res = await fetch('/api/blog/generate', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ type, city, nearby: [] })
    })
    const j = await res.json()
    setOut(j)
    setLoading(false)
  }
  return (
    <div className="p-6 max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Generate Post</h1>
      <div className="space-y-2">
        <label className="block text-sm font-medium">City</label>
        <input className="w-full border rounded px-2 py-1" value={city} onChange={e=>setCity(e.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium">Type</label>
        <select className="w-full border rounded px-2 py-1" value={type} onChange={e=>setType(e.target.value)}>
          <option value="top10">top10</option>
          <option value="moving">moving</option>
          <option value="predictions">predictions</option>
          <option value="schools">schools</option>
          <option value="why_demographic">why_demographic</option>
        </select>
      </div>
      <button disabled={!city || loading} onClick={gen} className="px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50">
        {loading ? 'Generating...' : 'Generate'}
      </button>
      {out && <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-64">{JSON.stringify(out,null,2)}</pre>}
    </div>
  )
}

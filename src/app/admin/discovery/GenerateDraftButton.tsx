"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GenerateDraftButton({ title }: { title: string }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function onClick() {
    try {
      setLoading(true)
      // Client can safely use a relative URL
      const res = await fetch('/api/admin/discovery/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ topic: title })
      })
      const j = await res.json()
      if (!j.ok) throw new Error(j.error || 'Failed')
      setDone(true)
      // Redirect to the admin edit page for the new post
      if (j.id) router.push(`/admin/posts/${j.id}`)
    } catch (e: any) {
      alert(`Error generating draft: ${e.message || e}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={loading || done}
      className={`rounded-lg border px-3 py-1.5 text-xs ${loading || done ? 'opacity-60 cursor-not-allowed' : 'hover:bg-slate-50'}`}
      aria-disabled={loading || done}
    >
      {loading ? 'Generating…' : done ? 'Draft Generated' : 'Generate Draft'}
    </button>
  )
}

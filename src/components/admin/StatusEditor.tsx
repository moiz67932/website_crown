"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StatusEditor({ postId, currentStatus, slug }: { postId: string, currentStatus: string, slug?: string }) {
  const [status, setStatus] = useState(currentStatus)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const router = useRouter()

  async function save() {
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/posts', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: postId, status }),
      })
      const j = await res.json()
      if (!j.ok) throw new Error(j.error || 'unknown')
      setMsg('Saved')
      // best-effort revalidate the blog list and detail page when publishing
      if (status === 'published') {
        const targets = ['/blog']
        if (slug) targets.push(`/blog/${slug}`)
        await Promise.all(targets.map(p => fetch('/api/revalidate', {
          method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ path: p })
        })))
      }
      // Redirect to posts list after successful save
      setTimeout(() => {
        router.push('/admin/posts')
        router.refresh()
      }, 500)
    } catch (err: any) {
      setMsg('Error: ' + (err.message || String(err)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <select value={status} onChange={e => setStatus(e.target.value)} className="p-2 border rounded">
        <option value="draft">draft</option>
        <option value="scheduled">scheduled</option>
        <option value="published">published</option>
        <option value="archived">archived</option>
      </select>
      <button onClick={save} disabled={saving} className="px-3 py-2 bg-primary text-white rounded">
        {saving ? 'Saving…' : 'Save'}
      </button>
      {msg ? <span className="text-sm text-muted-foreground">{msg}</span> : null}
    </div>
  )
}

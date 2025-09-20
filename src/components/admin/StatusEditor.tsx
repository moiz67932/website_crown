// "use client"
// import React, { useState } from 'react'

// export default function StatusEditor({ postId, currentStatus, slug }: { postId: string, currentStatus: string, slug?: string }) {
//   const [status, setStatus] = useState(currentStatus)
//   const [saving, setSaving] = useState(false)
//   const [msg, setMsg] = useState<string | null>(null)

//   async function save() {
//     setSaving(true)
//     setMsg(null)
//     try {
//       const res = await fetch('/api/admin/posts', {
//         method: 'PATCH',
//         headers: { 'content-type': 'application/json' },
//         body: JSON.stringify({ id: postId, status }),
//       })
//       const j = await res.json()
//       if (!j.ok) throw new Error(j.error || 'unknown')
//       setMsg('Saved')
//       // best-effort revalidate the blog list and detail page when publishing
//       if (status === 'published') {
//         const targets = ['/blog']
//         if (slug) targets.push(`/blog/${slug}`)
//         await Promise.all(targets.map(p => fetch('/api/revalidate', {
//           method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ path: p })
//         })))
//       }
//     } catch (err: any) {
//       setMsg('Error: ' + (err.message || String(err)))
//     } finally {
//       setSaving(false)
//     }
//   }

//   return (
//     <div className="flex items-center gap-3">
//       <select value={status} onChange={e => setStatus(e.target.value)} className="p-2 border rounded">
//         <option value="draft">draft</option>
//         <option value="scheduled">scheduled</option>
//         <option value="published">published</option>
//         <option value="archived">archived</option>
//       </select>
//       <button onClick={save} disabled={saving} className="px-3 py-2 bg-primary text-white rounded">
//         {saving ? 'Saving…' : 'Save'}
//       </button>
//       {msg ? <span className="text-sm text-muted-foreground">{msg}</span> : null}
//     </div>
//   )
// }





// src/components/admin/StatusEditor.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StatusEditor({
  postId,
  currentStatus,
  slug,
}: {
  postId: string;
  currentStatus: "draft" | "published" | "scheduled";
  slug: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/posts", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: postId, status }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Failed");
      router.refresh();
    } catch (e) {
      alert((e as any)?.message || "Failed to update");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="rounded-lg border px-3 py-2 text-sm"
        value={status}
        onChange={(e) => setStatus(e.target.value as any)}
      >
        <option value="draft">draft</option>
        <option value="scheduled">scheduled</option>
        <option value="published">published</option>
      </select>
      <button
        disabled={busy}
        onClick={save}
        className="rounded-lg bg-slate-900 text-white px-3 py-2 text-sm hover:bg-slate-800 disabled:opacity-50"
      >
        Save
      </button>
      <a
        href={`/blog/${slug}`}
        className="ml-2 text-sm underline text-slate-600 hover:text-slate-900"
        target="_blank"
        rel="noreferrer"
      >
        View
      </a>
    </div>
  );
}

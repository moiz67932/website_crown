'use client'
import { useEffect, useState } from 'react'

export default function AdminReferrals(){
  const [items, setItems] = useState<any[]>([])
  const [status, setStatus] = useState<string>('requested')

  async function load(){
    const r = await fetch(`/api/admin/referrals/redemptions?status=${encodeURIComponent(status)}`)
    const j = await r.json(); setItems(j.items || [])
  }
  useEffect(()=>{ load() },[status])

  async function update(id:string, s:string){
    await fetch(`/api/admin/referrals/redemptions/${id}`, { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ status: s }) })
    await load()
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Admin • Redemptions</h1>
      <div className="flex items-center gap-2">
        <label>Status</label>
        <select className="border rounded px-2 py-1" value={status} onChange={e=>setStatus(e.target.value)}>
          {['requested','approved','denied','paid',''].map(s=> <option key={s} value={s}>{s||'all'}</option>)}
        </select>
      </div>
      <div className="divide-y rounded border">
        {items.map((it)=> (
          <div key={it.id} className="p-3 flex items-center justify-between text-sm">
            <div>
              <div><b>{it.points}</b> pts • {it.status}</div>
              <div className="text-gray-500">user {it.user_id}</div>
            </div>
            <div className="flex gap-2">
              <button className="px-2 py-1 border rounded" onClick={()=>update(it.id,'approved')}>Approve</button>
              <button className="px-2 py-1 border rounded" onClick={()=>update(it.id,'denied')}>Deny</button>
              <button className="px-2 py-1 border rounded" onClick={()=>update(it.id,'paid')}>Mark Paid</button>
            </div>
          </div>
        ))}
        {items.length===0 && <div className="p-3 text-sm text-gray-500">No items</div>}
      </div>
    </main>
  )
}

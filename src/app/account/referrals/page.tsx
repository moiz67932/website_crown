'use client'
import { useEffect, useState } from 'react'

export default function AccountReferrals(){
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0)
  const [msg, setMsg] = useState<string>('')

  useEffect(()=>{
    (async()=>{
      try{
        const r = await fetch('/api/referrals/me')
        const j = await r.json()
        setData(j)
      } finally { setLoading(false) }
    })()
  },[])

  const shareUrl = data?.code ? `${location.origin}/?ref=${encodeURIComponent(data.code)}` : ''
  const approvedPoints = Number(data?.totals?.points || 0)

  async function submitRedeem(){
    setMsg('')
    try{
      const r = await fetch('/api/referrals/redeem', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ points: pointsToRedeem }) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Request failed')
      setMsg('Redemption requested!')
    } catch(e:any){ setMsg(e.message || 'Failed') }
  }

  if (loading) return <div className="p-6">Loading…</div>
  if (!data) return <div className="p-6">Not available.</div>

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Referral Dashboard</h1>

      <section className="rounded border p-4">
        <h2 className="font-medium mb-2">My Code</h2>
        {data.code ? (
          <>
            <div className="font-mono break-all">{shareUrl}</div>
            <button className="mt-2 px-3 py-1 border rounded" onClick={()=>navigator.clipboard.writeText(shareUrl)}>Copy Link</button>
          </>
        ) : <div>No code</div>}
      </section>

      <section className="grid grid-cols-2 gap-4">
        {['visits','signups','leads','appointments','closings','points'].map((k)=> (
          <div key={k} className="rounded border p-4"><div className="text-sm text-gray-500">{k}</div><div className="text-xl font-semibold">{data?.totals?.[k] ?? 0}</div></div>
        ))}
      </section>

      <section className="rounded border p-4">
        <h2 className="font-medium mb-2">Request Redemption</h2>
        <div className="text-sm text-gray-500 mb-2">Available approved points: {approvedPoints}</div>
        <div className="flex items-center gap-2">
          <input type="number" min={1} max={approvedPoints} value={pointsToRedeem} onChange={e=>setPointsToRedeem(Number(e.target.value))} className="border rounded px-2 py-1 w-32" />
          <button className="px-3 py-1 border rounded" onClick={submitRedeem}>Request</button>
        </div>
        {msg && <div className="text-sm mt-2">{msg}</div>}
      </section>

      <section className="rounded border p-4">
        <h2 className="font-medium mb-2">Recent Rewards</h2>
        <div className="divide-y">
          {(data?.rewards || []).map((r:any)=> (
            <div key={r.id} className="py-2 flex justify-between text-sm">
              <div>{r.reason} <span className="text-gray-500">({r.status})</span></div>
              <div className="font-mono">{r.points}</div>
            </div>
          ))}
          {(!data?.rewards || data.rewards.length===0) && <div className="text-sm text-gray-500">No rewards yet.</div>}
        </div>
      </section>

      <section className="rounded border p-4 text-sm text-gray-600">
        <h3 className="font-medium mb-1">How it works</h3>
        Share your link. When friends visit and sign up or become a lead, you earn points. Admin reviews redemptions.
      </section>
    </main>
  )
}

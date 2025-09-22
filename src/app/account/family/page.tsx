'use client'
import { useEffect, useState } from 'react'

export default function AccountFamily(){
  const [me, setMe] = useState<any>(null)
  const [family, setFamily] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [totals, setTotals] = useState<any>({ pointsApproved: 0, pointsPaid: 0 })
  const [name, setName] = useState('')
  const [invite, setInvite] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(()=>{ (async()=>{
    try{
      const r = await fetch('/api/referrals/me')
      const j = await r.json(); setMe(j)
      // fetch family via composite queries from API routes using auth client
      const famRes = await fetch('/api/family/me', { method: 'POST' }).catch(()=>null)
      if (famRes?.ok) {
        const f = await famRes.json()
        if (f?.family) {
          setFamily(f.family)
          setMembers(f.members || [])
          setTotals(f.totals || { pointsApproved: 0, pointsPaid: 0 })
        }
      }
    } catch {}
  })() },[])

  async function createFamily(){
    setMsg('')
    try{
      const r = await fetch('/api/family/create', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ name }) })
      const j = await r.json(); if (!r.ok) throw new Error(j.error)
      setFamily(j.family); setMsg('Created!')
    } catch(e:any){ setMsg(e.message || 'Failed') }
  }

  async function join(){
    setMsg('')
    try{
      const r = await fetch('/api/family/join', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ invite_code: invite }) })
      const j = await r.json(); if (!r.ok) throw new Error(j.error)
      setFamily(j.family); setMsg('Joined!')
    } catch(e:any){ setMsg(e.message || 'Failed') }
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Family</h1>
      {!family ? (
        <div className="space-y-4">
          <div className="rounded border p-4">
            <h2 className="font-medium mb-2">Create Family</h2>
            <input className="border rounded px-2 py-1" value={name} onChange={e=>setName(e.target.value)} placeholder="Family name" />
            <button className="ml-2 px-3 py-1 border rounded" onClick={createFamily}>Create</button>
          </div>
          <div className="rounded border p-4">
            <h2 className="font-medium mb-2">Join via Invite</h2>
            <input className="border rounded px-2 py-1" value={invite} onChange={e=>setInvite(e.target.value)} placeholder="INVITE CODE" />
            <button className="ml-2 px-3 py-1 border rounded" onClick={join}>Join</button>
          </div>
          {msg && <div className="text-sm">{msg}</div>}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded border p-4">
            <div className="text-sm text-gray-500">Family</div>
            <div className="font-medium">{family.name}</div>
            <div className="text-sm text-gray-500 mt-3">Invite Code</div>
            <div className="font-mono">{family.invite_code}</div>
          </div>
          <div className="rounded border p-4">
            <div className="font-medium mb-2">Members</div>
            <ul className="list-disc pl-5 space-y-1">
              {members.map(m => (
                <li key={m.user_id}>
                  {m.user?.first_name} {m.user?.last_name} <span className="text-xs text-gray-500">({m.role})</span>
                </li>
              ))}
              {!members.length && (<li className="text-sm text-gray-500">No members yet</li>)}
            </ul>
          </div>
          <div className="rounded border p-4">
            <div className="font-medium">Family Points</div>
            <div className="text-sm">Approved: {totals.pointsApproved}</div>
            <div className="text-sm">Paid: {totals.pointsPaid}</div>
          </div>
        </div>
      )}
    </main>
  )
}

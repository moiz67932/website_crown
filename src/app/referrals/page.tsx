'use client'
import { useEffect, useState } from 'react'

export default function ReferralsPage() {
  const [code, setCode] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/referrals/me')
        if (r.ok) {
          const j = await r.json()
          setCode(j.code || null)
          setStats(j.totals || null)
        }
      } catch {}
    })()
  }, [])

  const shareUrl = code ? `${location.origin}/?ref=${encodeURIComponent(code)}` : ''

  return (
    <main className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Referrals</h1>
      {code ? (
        <div className="rounded border p-4">
          <div className="text-sm text-gray-600">Share this link to earn rewards:</div>
          <div className="mt-2 font-mono break-all">{shareUrl}</div>
        </div>
      ) : (
        <div className="rounded border p-4 text-sm text-gray-700">
          Create an account or log in to get your referral link and earn rewards when friends sign up or inquire.
        </div>
      )}
      {stats && (
        <div className="text-sm text-gray-600">Visits: {stats.visits || 0} • Signups: {stats.signups || 0} • Leads: {stats.leads || 0}</div>
      )}
    </main>
  )
}

"use client"
import useSWR from 'swr'
import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import ReferralStatsCards from './ReferralStatsCards'
import ReferralLinkCard from './ReferralLinkCard'
import ReferralChart from './ReferralChart'
import RecentReferralsTable from './RecentReferralsTable'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

type Stats = {
  visits: number
  signups: number
  leads: number
  appointments: number
  closings: number
  points: number
}

type SeriesPoint = { date: string; signups: number; leads: number }

async function fetcher(url: string) {
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) throw new Error('failed')
  return r.json()
}

export default function ReferralDashboard(){
  const { data, isLoading, mutate } = useSWR('/api/referrals/me', fetcher)
  const code: string | null = data?.code || null
  const totals: Stats | null = data?.totals || null
  const series: SeriesPoint[] = data?.series || []
  const recent = data?.recent_referrals || []

  // First page load after signup: attempt to confirm and then refresh
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/referrals/confirm-signup', { method: 'POST' })
        if (r.ok) mutate()
      } catch {}
    })()
  }, [mutate])

  return (
    <main className="px-4 sm:px-6 lg:px-10 py-6 max-w-7xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Referrals</h1>
        <p className="text-sm text-muted-foreground">Share your link to earn points when friends sign up or become leads.</p>
      </header>

      <ReferralStatsCards totals={totals} loading={isLoading} />

      <ReferralLinkCard code={code} />

      <ReferralChart data={series} loading={isLoading} />

      <RecentReferralsTable items={recent} loading={isLoading} />

      <RedeemForm disabledUntil={(totals?.points || 0) < 100} onSubmitted={() => mutate()} />
    </main>
  )
}

function RedeemForm({ disabledUntil, onSubmitted }:{ disabledUntil: boolean; onSubmitted: ()=>void }){
  const [points, setPoints] = useState('100')
  const [method, setMethod] = useState('giftcard')
  const [busy, setBusy] = useState(false)
  const disabled = disabledUntil || busy
  const submit = async () => {
    try {
      setBusy(true)
      const r = await fetch('/api/referrals/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ points: Number(points), method }) })
      setBusy(false)
      if (r.ok) onSubmitted()
    } catch { setBusy(false) }
  }
  return (
    <Card className="shadow-sm rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">Request redemption</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-2">
        <Input type="number" min={1} value={points} onChange={e=>setPoints(e.target.value)} className="w-40" aria-label="Points to redeem" />
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger className="w-40" aria-label="Redemption method">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="giftcard">Gift card</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={submit} disabled={disabled}>Redeem</Button>
      </CardContent>
    </Card>
  )
}

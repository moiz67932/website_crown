"use client"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, Gift } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export interface ReferralTotals {
  visits: number
  signups: number
  leads: number
  appointments: number
  closings: number
  points: number
}

export default function ReferralStatsCards({ totals, loading }:{ totals?: ReferralTotals | null; loading?: boolean }){
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard title="Total Referrals" value={totals?.signups} icon={<Users className="h-5 w-5" />} loading={loading} />
      <StatCard title="Leads from Referrals" value={totals?.leads} icon={<TrendingUp className="h-5 w-5" />} loading={loading} />
      <StatCard title="Closings" value={totals?.closings} icon={<TrendingUp className="h-5 w-5" />} loading={loading} />
      <StatCard title="Points (Approved)" value={totals?.points} icon={<Gift className="h-5 w-5" />} loading={loading} />
    </div>
  )
}

function StatCard({ title, value, icon, loading }:{ title: string; value?: number; icon: React.ReactNode; loading?: boolean }){
  return (
    <Card className="shadow-sm rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div aria-hidden>{icon}</div>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{value ?? 0}</div>}
      </CardContent>
    </Card>
  )
}

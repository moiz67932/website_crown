"use client"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function RecentReferralsTable({ items, loading }:{ items: any[]; loading?: boolean }){
  return (
    <Card className="shadow-sm rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">Recent referrals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="text-left">
                <th className="py-2">When</th>
                <th className="py-2">Referred</th>
                <th className="py-2">Status</th>
                <th className="py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_,i)=>(
                  <tr key={i}>
                    <td className="py-2"><Skeleton className="h-4 w-28" /></td>
                    <td className="py-2"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-2"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-2"><Skeleton className="h-4 w-32" /></td>
                  </tr>
                ))
              ) : items?.length ? (
                items.map((r:any) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="py-2">{r.referred_user_id ? r.referred_user_id.slice(0,8)+'…' : (r.code ? 'via code' : '—')}</td>
                    <td className="py-2 capitalize">{r.event_kind}</td>
                    <td className="py-2">&nbsp;</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-6 text-center text-muted-foreground" colSpan={4}>No recent referrals yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

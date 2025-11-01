"use client"
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Skeleton } from '../ui/skeleton'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

type Point = { date: string; signups: number; leads: number }

export default function ReferralChart({ data, loading }:{ data: Point[]; loading?: boolean }){
  return (
    <Card className="shadow-sm rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">Activity (last 90 days)</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {loading ? (
          <Skeleton className="w-full h-full rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" hide interval={13} />
              <YAxis allowDecimals={false} />
              <Tooltip labelClassName="text-xs" />
              <Bar dataKey="signups" fill="#4f46e5" name="Signups" radius={[4,4,0,0]} />
              <Bar dataKey="leads" fill="#22c55e" name="Leads" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

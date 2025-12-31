'use client'
import { useEffect, useState } from 'react'

interface Trend { date: string; medianPrice: number }
interface Props { trends?: Trend[] }

export default function TrendsSection({ trends }: Props) {
  const [ready, setReady] = useState(false)
  useEffect(() => { const t = setTimeout(() => setReady(true), 300); return () => clearTimeout(t) }, [])
  if (!trends || trends.length === 0) return null
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4" style={{ color: '#fcba03' }}>Price Trends</h2>
      <div className="rounded-2xl border p-6 min-h-[260px] flex items-center justify-center bg-muted/20">
        {!ready && <div className="animate-pulse text-sm text-muted-foreground">Loading chart…</div>}
        {ready && (
          <div className="w-full text-xs text-muted-foreground text-center">
            Chart placeholder ({trends.length} points).<br/>TODO: Integrate real chart library (e.g. Recharts / Chart.js) with SSR-safe dynamic import.
          </div>
        )}
      </div>
    </section>
  )
}

import React from 'react'

interface EconomicsData {
  unemploymentRatePct?: number
  jobGrowth1YrPct?: number
  majorIndustries?: string[]
  gdpContributionNote?: string
}
interface Props { data?: EconomicsData }

export default function EconomicsSection({ data }: Props) {
  if (!data) return null
  const { unemploymentRatePct, jobGrowth1YrPct, majorIndustries, gdpContributionNote } = data
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Economic Indicators</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        {unemploymentRatePct !== undefined && <div><p className="text-xs uppercase text-muted-foreground">Unemployment</p><p className="font-medium">{unemploymentRatePct}%</p></div>}
        {jobGrowth1YrPct !== undefined && <div><p className="text-xs uppercase text-muted-foreground">Job Growth (1y)</p><p className="font-medium">{jobGrowth1YrPct}%</p></div>}
        {majorIndustries && majorIndustries.length > 0 && <div className="sm:col-span-2"><p className="text-xs uppercase text-muted-foreground">Key Industries</p><p className="font-medium">{majorIndustries.join(', ')}</p></div>}
      </div>
      {gdpContributionNote && <p className="text-xs text-muted-foreground">{gdpContributionNote}</p>}
    </section>
  )
}

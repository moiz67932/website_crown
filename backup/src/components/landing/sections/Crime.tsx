import React from 'react'

interface CrimeData {
  safetyIndex?: number
  violentCrimePer1k?: number
  propertyCrimePer1k?: number
  comparedToNational?: string
}
interface Props { data?: CrimeData }

export default function CrimeSection({ data }: Props) {
  if (!data) return null
  const { safetyIndex, violentCrimePer1k, propertyCrimePer1k, comparedToNational } = data
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Crime & Safety</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        {safetyIndex !== undefined && <div><p className="text-xs uppercase text-muted-foreground">Safety Index</p><p className="font-medium">{safetyIndex}/100</p></div>}
        {violentCrimePer1k !== undefined && <div><p className="text-xs uppercase text-muted-foreground">Violent / 1k</p><p className="font-medium">{violentCrimePer1k}</p></div>}
        {propertyCrimePer1k !== undefined && <div><p className="text-xs uppercase text-muted-foreground">Property / 1k</p><p className="font-medium">{propertyCrimePer1k}</p></div>}
        {comparedToNational && <div className="sm:col-span-2"><p className="text-xs uppercase text-muted-foreground">Compared to National</p><p className="font-medium">{comparedToNational}</p></div>}
      </div>
    </section>
  )
}

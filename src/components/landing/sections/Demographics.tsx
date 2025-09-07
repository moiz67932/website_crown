import React from 'react'

interface DemographicsData {
  population?: number
  medianAge?: number
  medianHouseholdIncome?: number
  households?: number
  educationAttainment?: string
}
interface Props { data?: DemographicsData }

export default function DemographicsSection({ data }: Props) {
  if (!data) return null
  const { population, medianAge, medianHouseholdIncome, households, educationAttainment } = data
  const format = (n?: number) => (n !== undefined ? n.toLocaleString() : '—')
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Demographics</h2>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
        {population !== undefined && <div><p className="text-xs uppercase text-muted-foreground">Population</p><p className="font-medium">{format(population)}</p></div>}
        {medianAge !== undefined && <div><p className="text-xs uppercase text-muted-foreground">Median Age</p><p className="font-medium">{medianAge}</p></div>}
        {medianHouseholdIncome !== undefined && <div><p className="text-xs uppercase text-muted-foreground">Median Income</p><p className="font-medium">${format(medianHouseholdIncome)}</p></div>}
        {households !== undefined && <div><p className="text-xs uppercase text-muted-foreground">Households</p><p className="font-medium">{format(households)}</p></div>}
        {educationAttainment && <div><p className="text-xs uppercase text-muted-foreground">Education</p><p className="font-medium">{educationAttainment}</p></div>}
      </div>
    </section>
  )
}

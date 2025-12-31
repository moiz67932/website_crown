import React from 'react'

interface WeatherData {
  climateType?: string
  avgHighSummerF?: number
  avgLowWinterF?: number
  sunnyDaysPerYear?: number
  annualRainInches?: number
}
interface Props { data?: WeatherData }

export default function WeatherSection({ data }: Props) {
  if (!data) return null
  const { climateType, avgHighSummerF, avgLowWinterF, sunnyDaysPerYear, annualRainInches } = data
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold" style={{ color: '#fcba03' }}>Weather</h2>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
        {climateType && <div><p className="text-xs uppercase text-muted-foreground">Climate</p><p className="font-medium">{climateType}</p></div>}
        {avgHighSummerF !== undefined && <div><p className="text-xs uppercase text-muted-foreground">Avg Summer High</p><p className="font-medium">{avgHighSummerF}°F</p></div>}
        {avgLowWinterF !== undefined && <div><p className="text-xs uppercase text-muted-foreground">Avg Winter Low</p><p className="font-medium">{avgLowWinterF}°F</p></div>}
        {sunnyDaysPerYear !== undefined && <div><p className="text-xs uppercase text-muted-foreground">Sunny Days</p><p className="font-medium">{sunnyDaysPerYear}</p></div>}
        {annualRainInches !== undefined && <div><p className="text-xs uppercase text-muted-foreground">Annual Rain</p><p className="font-medium">{annualRainInches}"</p></div>}
      </div>
    </section>
  )
}

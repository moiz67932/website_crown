import React from 'react'

interface TransportationData {
  walkScore?: number
  transitScore?: number
  bikeScore?: number
  avgCommuteMins?: number
  majorHighways?: string[]
  transitOptions?: string[]
  airports?: string[]
}
interface Props { data?: TransportationData }

const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col"><span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>
)

export default function TransportationSection({ data }: Props) {
  if (!data) return null
  const { walkScore, transitScore, bikeScore, avgCommuteMins, majorHighways, transitOptions, airports } = data
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Transportation & Connectivity</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {walkScore !== undefined && <Stat label="Walk Score" value={walkScore} />}
        {transitScore !== undefined && <Stat label="Transit Score" value={transitScore} />}
        {bikeScore !== undefined && <Stat label="Bike Score" value={bikeScore} />}
        {avgCommuteMins !== undefined && <Stat label="Avg Commute" value={`${avgCommuteMins} min`} />}
      </div>
      <div className="grid gap-4 sm:grid-cols-3 text-sm">
        {majorHighways && majorHighways.length > 0 && (
          <div>
            <p className="font-medium mb-1">Major Highways</p>
            <ul className="list-disc ml-4 space-y-0.5">{majorHighways.map(h => <li key={h}>{h}</li>)}</ul>
          </div>
        )}
        {transitOptions && transitOptions.length > 0 && (
          <div>
            <p className="font-medium mb-1">Transit Options</p>
            <ul className="list-disc ml-4 space-y-0.5">{transitOptions.map(t => <li key={t}>{t}</li>)}</ul>
          </div>
        )}
        {airports && airports.length > 0 && (
          <div>
            <p className="font-medium mb-1">Airports</p>
            <ul className="list-disc ml-4 space-y-0.5">{airports.map(a => <li key={a}>{a}</li>)}</ul>
          </div>
        )}
      </div>
    </section>
  )
}

import React from 'react'

interface AmenityCategory { category: string; items: string[] }
interface Props { amenities?: AmenityCategory[] }

export default function AmenitiesSection({ amenities }: Props) {
  if (!amenities || amenities.length === 0) return null
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4" style={{ color: '#fcba03' }}>Local Amenities</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {amenities.map(cat => (
          <div key={cat.category} className="rounded-lg border p-4 bg-background/50">
            <h3 className="font-medium mb-2 text-sm uppercase tracking-wide" style={{ color: '#fcba03' }}>{cat.category}</h3>
            <ul className="space-y-1 text-sm">
              {cat.items.map(it => <li key={it} className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" />{it}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

import React from 'react'

interface RelatedCity { city: string; state?: string; href: string }
interface Props { cities?: RelatedCity[] }

export default function RelatedCitiesSection({ cities }: Props) {
  if (!cities || cities.length === 0) return null
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Related Cities</h2>
      <div className="flex flex-wrap gap-2">
        {cities.map(rc => (
          <a key={rc.href} href={rc.href} className="px-3 py-1.5 rounded-full border text-sm hover:bg-muted transition">
            {rc.city}{rc.state ? `, ${rc.state}` : ''}
          </a>
        ))}
      </div>
    </section>
  )
}

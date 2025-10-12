"use client"
import Link from 'next/link'
import { LANDINGS } from '@/lib/landing/defs'

export default function RelatedVariants({ citySlug, currentSlug }: { citySlug: string; currentSlug: string }) {
  const items = LANDINGS.filter(l => l.slug !== currentSlug)
  return (
    <section className="pt-6 bg-white/95 rounded-2xl shadow-2xl ring-1 ring-black/5 p-6 md:p-8">
      <h3 className="text-[#1E3557] text-xl font-semibold mb-4">Explore more in this city</h3>
      <div className="flex flex-wrap gap-3">
        {items.map(l => (
          <Link
            key={l.slug}
            href={`/california/${citySlug}/${l.slug}`}
            className="px-3 py-1.5 rounded-full border text-sm bg-white/95 shadow-sm ring-1 ring-black/5 hover:bg-accent capitalize"
          >
            {l.slug.replace(/-/g, ' ')}
          </Link>
        ))}
      </div>
    </section>
  )
}

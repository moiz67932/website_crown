"use client"
import Link from 'next/link'
import { LANDINGS } from '@/lib/landing/defs'

export default function RelatedVariants({ citySlug, currentSlug }: { citySlug: string; currentSlug: string }) {
  const items = LANDINGS.filter(l => l.slug !== currentSlug)
  return (
    <section className="pt-6">
      <h3 className="text-lg font-semibold mb-3">Explore more in this city</h3>
      <div className="flex flex-wrap gap-2">
        {items.map(l => (
          <Link
            key={l.slug}
            href={`/california/${citySlug}/${l.slug}`}
            className="px-3 py-1 rounded-full border text-sm hover:bg-muted capitalize"
          >
            {l.slug.replace(/-/g, ' ')}
          </Link>
        ))}
      </div>
    </section>
  )
}

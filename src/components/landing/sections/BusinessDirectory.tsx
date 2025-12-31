import React from 'react'

interface Biz { name: string; category: string; blurb?: string; url?: string }
interface Props { businesses?: Biz[] }

export default function BusinessDirectorySection({ businesses }: Props) {
  if (!businesses || businesses.length === 0) return null
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold" style={{ color: '#fcba03' }}>Local Business Directory</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {businesses.map(b => (
          <div key={b.name} className="rounded-lg border p-4 bg-background/50 flex flex-col gap-1">
            <p className="text-sm font-medium">{b.name}</p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{b.category}</p>
            {b.blurb && <p className="text-xs text-muted-foreground line-clamp-3">{b.blurb}</p>}
            {b.url && <a href={b.url} className="text-xs text-primary hover:underline mt-1">Visit</a>}
          </div>
        ))}
      </div>
    </section>
  )
}

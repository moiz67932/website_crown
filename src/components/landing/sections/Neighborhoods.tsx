import { LandingNeighborhood } from '@/types/landing'

interface Props { neighborhoods?: LandingNeighborhood[]; city: string }

export default function NeighborhoodsSection({ neighborhoods, city }: Props) {
  if (!neighborhoods || neighborhoods.length === 0) return null
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4" style={{ color: '#fcba03' }}>Neighborhoods in {city}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {neighborhoods.map(n => (
          <a key={n.name} href={n.url} className="rounded-xl border p-4 hover:bg-accent transition-colors group">
            <div className="font-medium mb-1 group-hover:underline">{n.name}</div>
            <p className="text-xs text-muted-foreground line-clamp-2">{n.blurb || 'Explore this area →'}</p>
          </a>
        ))}
      </div>
    </section>
  )
}

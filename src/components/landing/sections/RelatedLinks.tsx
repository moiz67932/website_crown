interface Link { label: string; href: string }
interface Props { links?: Link[] }

export default function RelatedLinksSection({ links }: Props) {
  if (!links || links.length === 0) return null
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Related Pages</h2>
      <div className="flex flex-wrap gap-2">
        {links.map(l => (
          <a key={l.href} href={l.href} className="rounded-full border px-3 py-1 text-xs font-medium hover:bg-accent transition-colors">{l.label}</a>
        ))}
      </div>
    </section>
  )
}

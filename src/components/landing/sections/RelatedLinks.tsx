interface Link { label: string; href: string }
interface Props { links?: Link[] }

export default function RelatedLinksSection({ links }: Props) {
  if (!links || links.length === 0) return null
  return (
    <section className="bg-white/95 rounded-2xl shadow-2xl ring-1 ring-black/5 p-6 md:p-8">
      <h2 className="text-[#1E3557] text-xl font-semibold mb-4">Related Pages</h2>
      <div className="flex flex-wrap gap-3">
        {links.map(l => (
          <a
            key={l.href}
            href={l.href}
            className="rounded-full border px-3 py-1.5 text-xs font-medium bg-white/95 shadow-sm ring-1 ring-black/5 hover:bg-accent transition-colors"
          >
            {l.label}
          </a>
        ))}
      </div>
    </section>
  )
}

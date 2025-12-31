interface Link { label: string; href: string }
interface Props { links?: Link[] }

export default function RelatedLinksSection({ links }: Props) {
  if (!links || links.length === 0) return null
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4" style={{ color: '#fcba03' }}>Related Pages</h2>
      <div className="flex flex-wrap gap-3">
        {links.map(l => (
          <a 
            key={l.href} 
            href={l.href} 
            className="rounded-full border px-5 py-3 min-h-[44px] flex items-center text-sm font-medium hover:bg-accent transition-colors active:scale-95"
          >
            {l.label}
          </a>
        ))}
      </div>
    </section>
  )
}

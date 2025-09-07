// Server component for deterministic JSON-LD (no window access)
interface Props {
  city: string
  canonical: string // path beginning with '/'
  featured: Array<{ id: string; url?: string }>
}

export default function CitySchema({ city, canonical, featured }: Props) {
  const baseEnv = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://www.example.com'
  const origin = baseEnv.replace(/\/+$/, '')
  const absCanonical = `${origin}${canonical}`

  const itemList = (featured || []).slice(0, 20).map((p, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: p.url || `${origin}/homes/${p.id}`
  }))

  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${absCanonical}#webpage`,
        url: absCanonical,
        name: `${city}, CA Homes For Sale`
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'California', item: `${origin}/california` },
          { '@type': 'ListItem', position: 2, name: city, item: absCanonical }
        ]
      },
      itemList.length ? { '@type': 'ItemList', itemListElement: itemList } : null
    ].filter(Boolean)
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

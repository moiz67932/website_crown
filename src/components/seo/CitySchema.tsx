// Server component for deterministic JSON-LD (no window access)
interface Props {
  city: string
  canonical: string // path beginning with '/'
  featured: Array<{ id: string; url?: string }>
  variant?: string // landing slug (e.g. condos-for-sale)
  faqItems?: Array<{ question: string; answer: string }>
}

/**
 * Generate structured data for landing pages including:
 * - WebPage
 * - BreadcrumbList (Home -> California -> City -> Landing Type)
 * - ItemList (featured listings)
 * - RealEstateAgent (Crown Coastal Homes / Reza Barghlameno)
 * - FAQPage (if FAQs provided)
 */
export default function CitySchema({ city, canonical, featured, variant, faqItems }: Props) {
  const baseEnv = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://www.example.com'
  const origin = baseEnv.replace(/\/+$/, '')
  const absCanonical = `${origin}${canonical}`
  const citySlug = city.toLowerCase().replace(/\s+/g, '-')

  const itemList = (featured || []).slice(0, 20).map((p, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: p.url || `${origin}/homes/${p.id}`
  }))

  const variantLabel = variant ? variant.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Homes for Sale'
  const nameSuffix = variant ? ` — ${variant.replace(/-/g, ' ')}` : ''

  // BreadcrumbList: Home -> California -> City -> Landing Type
  const breadcrumbList = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: origin },
      { '@type': 'ListItem', position: 2, name: 'California', item: `${origin}/california` },
      { '@type': 'ListItem', position: 3, name: city, item: `${origin}/california/${citySlug}` },
      { '@type': 'ListItem', position: 4, name: variantLabel, item: absCanonical }
    ]
  }

  // RealEstateAgent schema for Crown Coastal Homes
  const realEstateAgent = {
    '@type': 'RealEstateAgent',
    '@id': `${origin}#agent`,
    name: 'Crown Coastal Homes',
    description: 'San Diego-based real estate brokerage specializing in residential properties throughout Southern California.',
    url: origin,
    areaServed: {
      '@type': 'State',
      name: 'California'
    },
    employee: {
      '@type': 'Person',
      name: 'Reza Barghlameno',
      description: 'Licensed California Real Estate Agent - DRE #02211952',
      jobTitle: 'Real Estate Agent'
    }
  }

  // WebPage schema
  const webPage = {
    '@type': 'WebPage',
    '@id': `${absCanonical}#webpage`,
    url: absCanonical,
    name: `${city}, CA ${variantLabel}`.trim(),
    isPartOf: { '@id': `${origin}#website` },
    about: { '@id': `${origin}#agent` }
  }

  // Build @graph array
  const graphItems: object[] = [
    webPage,
    breadcrumbList,
    realEstateAgent
  ]

  // Add ItemList if featured listings exist
  if (itemList.length > 0) {
    graphItems.push({ '@type': 'ItemList', itemListElement: itemList })
  }

  const data = {
    '@context': 'https://schema.org',
    '@graph': graphItems
  }

  // FAQPage schema (separate script for better parsing)
  const faqPageSchema = faqItems && faqItems.length >= 1 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  } : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      />
      {faqPageSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }}
        />
      )}
    </>
  )
}

import type { Metadata } from 'next'
import LandingTemplate from '@/components/landing/LandingTemplate'
import { CA_CITIES, cityToTitle } from '@/lib/seo/cities'
import { LANDINGS, LANDINGS_BY_SLUG, type LandingSlug } from '@/lib/landing/defs'
import { getLandingData } from '@/lib/landing/query'

// Pre-render all CA city x landing combos
export async function generateStaticParams() {
  const params: Array<{ city: string; landing: LandingSlug }> = []
  for (const city of CA_CITIES) {
    for (const l of LANDINGS) params.push({ city, landing: l.slug })
  }
  return params
}

export async function generateMetadata({ params }: { params: Promise<{ city: string; landing: LandingSlug }> }): Promise<Metadata> {
  const { city, landing } = await params
  const citySlug = String(city).toLowerCase()
  const cityName = cityToTitle(citySlug)
  const def = LANDINGS_BY_SLUG[landing]
  if (!def) return { title: 'Not Found' }
  const baseTitle = def.title(cityName)
  const canonical = def.canonicalPath(citySlug)
  const desc = def.description(cityName)
  return {
    title: baseTitle,
    description: desc,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: { title: baseTitle, description: desc, url: canonical, type: 'website' },
    twitter: { card: 'summary_large_image', title: baseTitle, description: desc }
  }
}

export default async function Page({ params }: { params: Promise<{ city: string; landing: LandingSlug }> }) {
  const { city, landing } = await params
  const citySlug = String(city).toLowerCase()
  const cityName = cityToTitle(citySlug)
  const def = LANDINGS_BY_SLUG[landing]
  if (!def) return null
  const data = await getLandingData(cityName, def.slug as any, { landingDef: def })
  return <LandingTemplate data={data} />
}

import type { Metadata } from 'next'
import LandingTemplate from '@/components/landing/LandingTemplate'
import { CA_CITIES, cityToTitle } from '@/lib/seo/cities'
import { LANDINGS, LANDINGS_BY_SLUG, type LandingSlug } from '@/lib/landing/defs'
import { getLandingData } from '@/lib/landing/query'
import { getSupabase } from '@/lib/supabase'
import { getOrGenerateFaqs } from '@/lib/faqs'

// Force dynamic rendering - do not statically pre-render these pages
// This ensures DB queries and stats are fetched at request time in production
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
  // Try SEO overrides from DB (no generation here)
  try {
    const sb = getSupabase()
    if (sb) {
      const { data } = await sb
        .from('landing_pages')
        .select('seo_metadata')
        .eq('city', citySlug)
        .eq('page_name', landing)
        .maybeSingle()
      const meta = (data?.seo_metadata as any) || null
      const title = meta?.title || baseTitle
      const description = meta?.description || desc
      const keywords = Array.isArray(meta?.keywords) ? meta.keywords.join(', ') : undefined
      return {
        title,
        description,
        keywords,
        alternates: { canonical },
        robots: { index: true, follow: true },
        openGraph: { title, description, url: canonical, type: 'website' },
        twitter: { card: 'summary_large_image', title, description }
      }
    }
  } catch {}
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
  // FAQs: generate once then persist; reuse afterwards
  const faqBundle = await getOrGenerateFaqs(cityName, def.slug)
  return <LandingTemplate data={data} faqItems={faqBundle?.faqs} faqJsonLd={faqBundle?.jsonLd} />
}

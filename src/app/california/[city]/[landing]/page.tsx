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
  // Try SEO overrides from DB (no generation here) - read from content JSON
  try {
    const sb = getSupabase()
    if (sb) {
      // Use order + limit instead of maybeSingle to handle multiple rows safely
      const { data: rows } = await sb
        .from('landing_pages')
        .select('content')
        .ilike('city', citySlug)
        .eq('page_name', landing)
        .order('updated_at', { ascending: false })
        .limit(1)
      const data = rows?.[0]
      // Content is stored as TEXT (stringified JSON) - must parse it
      let contentJson: any = null
      try {
        if (data?.content) {
          contentJson = typeof data.content === 'string' 
            ? JSON.parse(data.content) 
            : data.content
          console.log('[Landing SEO] Parsed content, top-level keys:', Object.keys(contentJson || {}))
        }
      } catch (e) {
        console.warn('[Landing SEO] Failed to parse content:', (e as any)?.message)
      }
      // Read SEO from content.seo (new format) or content.seo_metadata (legacy fallback)
      const seo = contentJson?.seo || contentJson?.seo_metadata || null
      const title = seo?.title || baseTitle
      const description = seo?.meta_description || seo?.description || desc
      const keywords = Array.isArray(seo?.keywords) ? seo.keywords.join(', ') : undefined
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
  
  // ============================================================================
  // NOTE: AI generation is DISABLED for page rendering.
  // getLandingData() now only fetches cached AI content from database.
  // To generate new AI content, use:
  // - POST /api/admin/landing-pages/generate-content
  // - CLI scripts with ALLOW_AI_GENERATION=true
  // ============================================================================
  
  const data = await getLandingData(cityName, def.slug as any, { landingDef: def })
  // FAQs: fetch cached only - no generation at runtime
  const faqBundle = await getOrGenerateFaqs(cityName, def.slug)
  return <LandingTemplate data={data} faqItems={faqBundle?.faqs} faqJsonLd={faqBundle?.jsonLd} />
}

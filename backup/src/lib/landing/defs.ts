import { PropertyFilters } from '@/types/filters'

// Supported landing slugs (city-focused variants)
export type LandingSlug =
  | 'homes-for-sale'
  | 'condos-for-sale'
  | 'homes-with-pool'
  | 'luxury-homes'
  | 'homes-under-500k'
  | 'homes-over-1m'
  | '2-bedroom-apartments'

export interface LandingDef {
  slug: LandingSlug
  title: (city: string) => string
  description: (city: string) => string
  canonicalPath: (citySlug: string) => string
  aiPromptKey: string
  faqKey: string
  filters: (city: string) => Partial<PropertyFilters>
}

const up = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase())

export const LANDINGS: LandingDef[] = [
  {
    slug: 'homes-for-sale',
    title: (city) => `${up(city)}, CA Homes For Sale`,
    description: (city) => `Explore homes for sale in ${up(city)}, CA with photos, prices, and local insights.`,
    canonicalPath: (citySlug) => `/california/${citySlug}/homes-for-sale`,
    aiPromptKey: 'ai_city_homes_for_sale',
    faqKey: 'faq_homes_for_sale',
    filters: (city) => ({ city: up(city), status: ['for_sale'] })
  },
  {
    slug: 'condos-for-sale',
    title: (city) => `${up(city)}, CA Condos For Sale`,
    description: (city) => `Browse condos for sale in ${up(city)}, CA — modern amenities, great locations, updated daily.`,
    canonicalPath: (citySlug) => `/california/${citySlug}/condos-for-sale`,
    aiPromptKey: 'ai_city_condos_for_sale',
    faqKey: 'faq_condos_for_sale',
    filters: (city) => ({ city: up(city), status: ['for_sale'], propertyType: ['condo', 'condominium'] })
  },
  {
    slug: 'homes-with-pool',
    title: (city) => `${up(city)}, CA Homes With Pool`,
    description: (city) => `See homes with pools in ${up(city)}, CA — perfect for warm days and outdoor living.`,
    canonicalPath: (citySlug) => `/california/${citySlug}/homes-with-pool`,
    aiPromptKey: 'ai_city_homes_with_pool',
    faqKey: 'faq_homes_with_pool',
    filters: (city) => ({ city: up(city), status: ['for_sale'], hasPool: true })
  },
  {
    slug: 'luxury-homes',
    title: (city) => `${up(city)}, CA Luxury Homes`,
    description: (city) => `Discover luxury homes in ${up(city)}, CA — high-end finishes and premier locations.`,
    canonicalPath: (citySlug) => `/california/${citySlug}/luxury-homes`,
    aiPromptKey: 'ai_city_luxury_homes',
    faqKey: 'faq_luxury_homes',
    filters: (city) => ({ city: up(city), status: ['for_sale'], priceRange: [1_000_000, Number.MAX_SAFE_INTEGER] })
  },
  {
    slug: 'homes-under-500k',
    title: (city) => `${up(city)}, CA Homes Under $500k`,
    description: (city) => `Affordable homes under $500k in ${up(city)}, CA — start your search here.`,
    canonicalPath: (citySlug) => `/california/${citySlug}/homes-under-500k`,
    aiPromptKey: 'ai_city_homes_under_500k',
    faqKey: 'faq_homes_under_500k',
    filters: (city) => ({ city: up(city), status: ['for_sale'], priceRange: [0, 500_000] })
  },
  {
    slug: 'homes-over-1m',
    title: (city) => `${up(city)}, CA Homes Over $1M`,
    description: (city) => `Explore homes over $1M in ${up(city)}, CA — premium properties and locations.`,
    canonicalPath: (citySlug) => `/california/${citySlug}/homes-over-1m`,
    aiPromptKey: 'ai_city_homes_over_1m',
    faqKey: 'faq_homes_over_1m',
    filters: (city) => ({ city: up(city), status: ['for_sale'], priceRange: [1_000_000, Number.MAX_SAFE_INTEGER] })
  },
  {
    slug: '2-bedroom-apartments',
    title: (city) => `2-Bedroom Apartments in ${up(city)}, CA`,
    description: (city) => `Find 2-bedroom apartments in ${up(city)}, CA — space, convenience, and great locations.`,
    canonicalPath: (citySlug) => `/california/${citySlug}/2-bedroom-apartments`,
    aiPromptKey: 'ai_city_2_bed_apartments',
    faqKey: 'faq_2_bed_apartments',
    filters: (city) => ({ city: up(city), status: ['for_sale'], propertyType: ['apartment', 'condo'], beds: '2+' })
  }
]

export const LANDINGS_BY_SLUG: Record<string, LandingDef> = Object.fromEntries(LANDINGS.map(d => [d.slug, d]))

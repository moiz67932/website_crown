// Landing page data model types for city + kind focused SEO pages
// These are intentionally simple and serializable; later wiring to Postgres will
// hydrate them with real listing + aggregate data.

export type LandingKind =
  | 'homes-for-sale'
  | 'condos-for-sale'
  | 'homes-with-pool'
  | 'luxury-homes'
  | 'homes-under-500k'
  | 'homes-over-1m'
  | '2-bedroom-apartments'

export interface LandingSEO {
  title: string
  description: string
  canonical?: string
  ogImage?: string
}

export interface LandingStats {
  medianPrice?: number
  pricePerSqft?: number
  daysOnMarket?: number
  totalActive?: number
}

export interface LandingPropertyCard {
  listingKey: string
  title?: string
  address?: string
  city: string
  state?: string
  price?: number
  beds?: number
  baths?: number
  sqft?: number
  img?: string | null
  status?: string
  lat?: number
  lng?: number
}

export interface LandingNeighborhood {
  name: string
  url: string
  blurb?: string
}

export interface LandingFAQ {
  q: string
  a: string
}

export interface LandingData {
  kind: LandingKind
  city: string
  state?: string
  heroImage?: string
  introHtml?: string // allow formatted copy
  // AI generated extended city description (can be same as introHtml if not separately provided)
  aiDescriptionHtml?: string
  stats?: LandingStats
  featured?: LandingPropertyCard[]
  neighborhoods?: LandingNeighborhood[]
  schools?: Array<{ name: string; rating?: number; url?: string }>
  trends?: Array<{ date: string; medianPrice: number }>
  faq?: LandingFAQ[]
  related?: Array<{ label: string; href: string }>
  // Additional rich landing data
  amenities?: Array<{ category: string; items: string[] }>
  transportation?: {
    walkScore?: number
    transitScore?: number
    bikeScore?: number
    avgCommuteMins?: number
    majorHighways?: string[]
    transitOptions?: string[]
    airports?: string[]
  }
  weather?: {
    climateType?: string
    avgHighSummerF?: number
    avgLowWinterF?: number
    sunnyDaysPerYear?: number
    annualRainInches?: number
  }
  demographics?: {
    population?: number
    medianAge?: number
    medianHouseholdIncome?: number
    households?: number
    educationAttainment?: string
  }
  economics?: {
    unemploymentRatePct?: number
    jobGrowth1YrPct?: number
    majorIndustries?: string[]
    gdpContributionNote?: string
  }
  crime?: {
    safetyIndex?: number // 0-100
    violentCrimePer1k?: number
    propertyCrimePer1k?: number
    comparedToNational?: string
  }
  businessDirectory?: Array<{ name: string; category: string; blurb?: string; url?: string }>
  relatedCities?: Array<{ city: string; state?: string; href: string }>
  seo?: LandingSEO
}

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

// ============================================================================
// New AI-Generated Landing Page Content Types (matching client's JSON schema)
// ============================================================================

/**
 * SEO fields for the landing page
 */
export interface LandingPageSEO {
  title: string;
  meta_description: string;
  h1: string;
  canonical_path: string;
  og_title: string;
  og_description: string;
}

/**
 * Intro section with subheadline and quick bullets
 */
export interface LandingPageIntro {
  subheadline: string;
  quick_bullets: string[];
  last_updated_line: string;
}

/**
 * Local area card for neighborhood sections
 */
export interface LocalAreaCard {
  name: string;
  blurb: string;
  best_for: string[];
  internal_link_text: string;
  internal_link_href: string;
}

/**
 * CTA (Call to Action) structure
 */
export interface LandingPageCTA {
  title: string;
  body: string;
  button_text: string;
  button_href: string;
}

/**
 * All content sections (13-section structure including buy_vs_rent and price_breakdown)
 */
export interface LandingPageSections {
  hero_overview: {
    heading: string;
    body: string;
  };
  about_area: {
    heading: string;
    body: string;
  };
  neighborhoods: {
    heading: string;
    body: string;
    cards: LocalAreaCard[];
  };
  buyer_strategy: {
    heading: string;
    body: string;
    cta: LandingPageCTA;
  };
  property_types: {
    heading: string;
    body: string;
  };
  market_snapshot: {
    heading: string;
    body: string;
  };
  // Buy vs Rent intent clarifier (REQUIRED)
  buy_vs_rent: {
    heading: string;
    body: string;
  };
  // Price breakdown table section (REQUIRED)
  price_breakdown: {
    heading: string;
    body: string;
  };
  schools_education: {
    heading: string;
    body: string;
  };
  lifestyle_amenities: {
    heading: string;
    body: string;
  };
  featured_listings: {
    heading: string;
    body: string;
  };
  working_with_agent: {
    heading: string;
    body: string;
  };
}

/**
 * FAQ item
 */
export interface LandingPageFAQItem {
  q: string;
  a: string;
}

/**
 * In-body link for internal linking
 */
export interface InBodyLink {
  href: string;
  anchor: string;
  context_note: string;
}

/**
 * Internal link item (for related_pages, more_in_city, nearby_cities)
 */
export interface InternalLinkItem {
  href: string;
  anchor: string;
}

/**
 * Internal linking structure
 */
export interface LandingPageInternalLinking {
  in_body_links: InBodyLink[];
  related_pages: InternalLinkItem[];
  more_in_city: InternalLinkItem[];
  nearby_cities: InternalLinkItem[];
}

/**
 * Agent box in trust section
 */
export interface AgentBox {
  headline: string;
  body: string;
  disclaimer: string;
}

/**
 * Trust section with brand info and agent box
 */
export interface LandingPageTrust {
  about_brand: string;
  agent_box: AgentBox;
}

/**
 * Complete AI-generated landing page content
 * This matches the client's OUTPUT JSON SCHEMA exactly
 */
export interface LandingPageGeneratedContent {
  seo: LandingPageSEO;
  intro: LandingPageIntro;
  sections: LandingPageSections;
  faq: LandingPageFAQItem[];
  internal_linking: LandingPageInternalLinking;
  trust: LandingPageTrust;
}

// NOTE: The canonical type for AI-generated content is LandingPageContent from @/ai/landing
// Use LandingPageGeneratedContent for the same shape when you need a local type definition

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
  // Raw DB content for direct rendering (not converted to HTML)
  dbContent?: {
    seo?: {
      h1?: string
      title?: string
      og_title?: string
      canonical_path?: string
      og_description?: string
      meta_description?: string
    }
    intro?: {
      subheadline?: string
      quick_bullets?: string[]
      last_updated_line?: string
    }
    trust?: {
      agent_box?: { headline?: string; body?: string; disclaimer?: string }
      about_brand?: string
    }
    sections?: Record<string, { heading?: string; body?: string; cards?: any[]; cta?: any }>
    internal_linking?: {
      more_in_city?: Array<{ href?: string; anchor?: string }>
      in_body_links?: Array<{ href?: string; anchor?: string; context_note?: string }>
      nearby_cities?: Array<{ href?: string; anchor?: string }>
      related_pages?: Array<{ href?: string; anchor?: string }>
    }
    faq?: Array<{ q?: string; a?: string; question?: string; answer?: string }>
  }
}

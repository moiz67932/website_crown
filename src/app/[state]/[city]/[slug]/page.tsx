/**
 * SEO Landing Page - Server-Side Rendered
 * Route: /[state]/[city]/[slug]
 * Example: /california/san-diego/homes-over-1m
 * 
 * This page supports two content generation modes:
 * 1. New mode (USE_NEW_AI_MODULE=true): Uses src/ai/landing.ts with client's new prompt
 * 2. Legacy mode: Uses src/lib/landing/ai.ts with existing prompt
 */

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
// Legacy AI module
import { generateLandingPageJSON } from "@/lib/landing/ai";
// New AI module (client's prompts)
import {
  generateLandingPageContent,
  type LandingPageContent,
  type InputJson,
} from "@/ai/landing";
import { PAGE_TYPE_BY_SLUG, isValidPageTypeSlug } from "@/ai/pageTypes";
import {
  generateBreadcrumb,
  generateFAQSchema,
  generateListingSchema,
  generateWebPageSchema,
  generateLocalBusinessSchema,
  validateMetaLength,
} from "@/lib/utils/seo";
import {
  MarketSnapshot,
  NeighborhoodCards,
  WhatMBuys,
  PropertyTypes,
  BuyerStrategy,
  TrustBox,
  InternalLinks,
  PageIntro,
  TableOfContents,
} from "@/components/landing/landing-sections";
import { FAQAccordion } from "@/components/ui/faq-accordion";

// Feature flag: Set to true to use the new AI module with client's prompts
const USE_NEW_AI_MODULE = process.env.USE_NEW_AI_MODULE === "true";

// Enable ISR with revalidation
export const revalidate = 3600; // Revalidate every hour

// ============================================================================
// BUILD-TIME DETECTION
// ============================================================================

/**
 * Detect if we're in build phase (SSG/export)
 * During build, AI generation MUST be skipped
 */
function isBuildTime(): boolean {
  // Check Next.js phase
  if (process.env.NEXT_PHASE === 'phase-production-build' || 
      process.env.NEXT_PHASE === 'phase-export') {
    return true;
  }
  
  // Check Vercel build environment
  if (process.env.VERCEL_ENV === 'production' && process.env.CI === 'true') {
    return true;
  }
  
  // Generic CI detection
  if (process.env.CI === 'true' && process.env.NODE_ENV === 'production') {
    return true;
  }
  
  return false;
}

/**
 * Create safe fallback content that satisfies Zod schema
 * Used during build or when AI generation fails
 */
function createFallbackContent(state: string, city: string, slug: string): LandingPageContent {
  const cityName = city.replace(/-/g, ' ');
  const cityTitle = cityName.replace(/\b\w/g, c => c.toUpperCase());
  const stateTitle = state.replace(/\b\w/g, c => c.toUpperCase());
  const filterLabel = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  return {
    seo: {
      title: `${cityTitle}, ${stateTitle} ${filterLabel} | Crown Coastal Homes`,
      h1: `${filterLabel} in ${cityTitle}, ${stateTitle}`,
      meta_description: `Explore ${filterLabel.toLowerCase()} in ${cityTitle}, ${stateTitle}. Browse luxury properties and expert real estate services.`,
      og_title: `${cityTitle} ${filterLabel}`,
      og_description: `Find your dream home in ${cityTitle}, ${stateTitle}`,
      canonical_path: `/${state}/${city}/${slug}`,
    },
    intro: {
      subheadline: `Discover premium real estate opportunities in ${cityTitle}, ${stateTitle}.`,
      quick_bullets: [
        `Browse available ${filterLabel.toLowerCase()} in ${cityTitle}`,
        'Connect with local real estate experts',
        'View detailed property information',
        'Get personalized guidance'
      ],
      last_updated_line: `Last updated: ${new Date().toLocaleDateString()}`
    },
    sections: {
      hero_overview: {
        heading: `${filterLabel} in ${cityTitle}`,
        body: `Welcome to ${cityTitle}, ${stateTitle}. Browse available properties and connect with local real estate experts.`,
      },
      about_area: {
        heading: `About ${cityTitle}`,
        body: `${cityTitle} offers diverse real estate opportunities in ${stateTitle}.`,
      },
      market_snapshot: {
        heading: 'Market Overview',
        body: 'Current market data will be available soon.',
      },
      neighborhoods: {
        heading: 'Neighborhoods',
        body: 'Explore local neighborhoods.',
        cards: [],
      },
      featured_listings: {
        heading: 'Featured Properties',
        body: 'Browse our latest listings.',
      },
      property_types: {
        heading: 'Property Types',
        body: 'Discover various property options.',
      },
      buyer_strategy: {
        heading: 'Buyer Resources',
        body: 'Get expert guidance on your home purchase.',
        cta: {
          title: 'Ready to Buy?',
          body: 'Connect with our expert agents today.',
          button_text: 'Contact Us',
          button_href: '/contact'
        }
      },
      schools_education: {
        heading: 'Schools & Education',
        body: 'Quality schools and educational opportunities.',
      },
      lifestyle_amenities: {
        heading: 'Lifestyle & Amenities',
        body: 'Explore local amenities and attractions.',
      },
      working_with_agent: {
        heading: 'Why Choose Crown Coastal Homes',
        body: 'Expert local knowledge and personalized service.',
      },
    },
    faq: [],
    internal_linking: {
      in_body_links: [],
      related_pages: [],
      more_in_city: [],
      nearby_cities: [],
    },
    trust: {
      about_brand: 'Crown Coastal Homes provides expert real estate services.',
      agent_box: {
        headline: 'Work with a local expert',
        body: 'Our experienced agents are ready to help you find your dream home.',
        disclaimer: 'General info only. Verify details with official sources and the listing broker.',
      },
    },
  };
}

interface PageProps {
  params: Promise<{
    state: string;
    city: string;
    slug: string;
  }>;
}

/**
 * Generate static paths for known landing pages
 * Add your city/slug combinations here
 */
export async function generateStaticParams() {
  // Example static paths - expand this list based on your needs
  const paths = [
    { state: "california", city: "san-diego", slug: "homes-over-1m" },
    { state: "california", city: "san-diego", slug: "homes-for-sale" },
    { state: "california", city: "san-diego", slug: "condos-for-sale" },
    { state: "california", city: "la-jolla", slug: "luxury-homes" },
    // Add more paths as needed
  ];

  return paths;
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { state, city, slug } = resolvedParams;

  // Try to get generated content for metadata
  try {
    // Get cached or generate content (build-safe)
    const content = await getOrGenerateLandingContent(state, city, slug);

    const title = validateMetaLength(content.seo.title, "title");
    const description = validateMetaLength(
      content.seo.meta_description,
      "description"
    );

    return {
      title,
      description,
      openGraph: {
        title: content.seo.og_title || title,
        description: content.seo.og_description || description,
        url: `https://www.crowncoastalhomes.com${content.seo.canonical_path}`,
        type: "website",
        images: [
          {
            url: "/og-image.jpg",
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: content.seo.og_title || title,
        description: content.seo.og_description || description,
      },
      alternates: {
        canonical: content.seo.canonical_path,
      },
    };
  } catch (error) {
    console.error("[Landing Page] Metadata generation failed:", error);

    // Fallback metadata
    const cityName = city.replace(/-/g, " ");
    const stateName = state.replace(/-/g, " ");
    const fallbackTitle = `${cityName}, ${stateName} Real Estate | Crown Coastal Homes`;

    return {
      title: validateMetaLength(fallbackTitle, "title"),
      description: validateMetaLength(
        `Find your dream home in ${cityName}, ${stateName}. Browse luxury properties and expert real estate services.`,
        "description"
      ),
    };
  }
}

/**
 * Build input JSON for AI content generator (Legacy format)
 */
function buildLegacyInputJson(state: string, city: string, slug: string) {
  // Convert URL params to readable format
  const cityName = city.replace(/-/g, " ");
  const stateName = state.replace(/-/g, " ");
  const filterLabel = slug.replace(/-/g, " ");

  // Example input structure - customize based on your data sources
  return {
    city: cityName,
    state: stateName,
    county: "", // Add if available
    filter_label: filterLabel,
    data_source: "MLS Data",
    last_updated_iso: new Date().toISOString(),
    neighborhoods: [
      {
        name: "La Jolla",
        notes: "Coastal community known for beaches and upscale properties",
      },
      {
        name: "Pacific Beach",
        notes: "Beach town with active lifestyle and diverse housing",
      },
      {
        name: "North Park",
        notes: "Urban neighborhood with walkable streets and restaurants",
      },
    ],
    featured_listings: [],
    internal_links: {
      related_pages: [
        {
          href: `/${state}/${city}/condos-for-sale`,
          anchor: `${cityName} Condos for Sale`,
        },
        {
          href: `/${state}/${city}/homes-for-sale`,
          anchor: `${cityName} Homes for Sale`,
        },
      ],
      more_in_city: [
        {
          href: `/${state}/${city}/luxury-homes`,
          anchor: `${cityName} Luxury Homes`,
        },
      ],
      nearby_cities: [
        { href: `/${state}/la-jolla/homes-for-sale`, anchor: "La Jolla" },
        {
          href: `/${state}/coronado/homes-for-sale`,
          anchor: "Coronado",
        },
      ],
    },
  };
}

/**
 * Build input JSON for the new AI module (client's schema)
 */
function buildNewInputJson(state: string, city: string, slug: string): InputJson {
  const cityName = city.replace(/-/g, " ");
  const cityTitle = cityName.replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    city: cityTitle,
    county: "",
    region: "Southern California",
    nearby_cities: ["La Jolla", "Coronado", "Del Mar", "Carlsbad"],
    canonical_path: `/${state}/${city}/${slug}`,
    data_source: "MLS Data",
    last_updated_iso: new Date().toISOString(),
    featured_listings_has_missing_specs: true,
    market_stats_text: "",
    property_notes: "",
    local_areas: [
      { name: "La Jolla", notes: "Coastal community known for beaches and upscale properties" },
      { name: "Pacific Beach", notes: "Beach town with active lifestyle and diverse housing" },
      { name: "North Park", notes: "Urban neighborhood with walkable streets and restaurants" },
    ],
    internal_links: {
      related_pages: [
        { href: `/${state}/${city}/condos-for-sale`, anchor: `${cityTitle} Condos for Sale` },
        { href: `/${state}/${city}/homes-for-sale`, anchor: `${cityTitle} Homes for Sale` },
      ],
      more_in_city: [
        { href: `/${state}/${city}/luxury-homes`, anchor: `${cityTitle} Luxury Homes` },
      ],
      nearby_cities: [
        { href: `/${state}/la-jolla/homes-for-sale`, anchor: "La Jolla" },
        { href: `/${state}/coronado/homes-for-sale`, anchor: "Coronado" },
      ],
    },
  };
}

/**
 * Fetch cached landing page content from Supabase
 */
async function getCachedContent(city: string, slug: string): Promise<LandingPageContent | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  
  const cityName = city.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  try {
    const { data, error } = await supabase
      .from('landing_pages')
      .select('content')
      .eq('city', cityName)
      .eq('page_name', slug)
      .maybeSingle();
    
    if (error || !data || !data.content) return null;
    
    // Validate that content matches expected structure
    if (typeof data.content === 'object' && data.content.seo && data.content.sections) {
      console.log('[Landing Page] Cached content used');
      return data.content as LandingPageContent;
    }
    
    return null;
  } catch (err) {
    console.error('[Landing Page] Cache fetch error:', err);
    return null;
  }
}

/**
 * Save generated content to Supabase cache
 */
async function saveCachedContent(city: string, slug: string, content: LandingPageContent): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  
  const cityName = city.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  try {
    const { error } = await supabase
      .from('landing_pages')
      .upsert(
        {
          city: cityName,
          page_name: slug,
          kind: slug,
          content: content,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'city,page_name' }
      );
    
    if (error) {
      console.error('[Landing Page] Cache save error:', error);
    } else {
      console.log('[Landing Page] Content cached to database');
    }
  } catch (err) {
    console.error('[Landing Page] Cache save exception:', err);
  }
}

/**
 * Generate AI content using NEW prompt system only
 * NEVER call during build time
 */
async function generateAIContent(state: string, city: string, slug: string): Promise<LandingPageContent> {
  if (!isValidPageTypeSlug(slug)) {
    throw new Error(`Invalid page type slug: ${slug}`);
  }
  
  console.log('[Landing Page] Runtime generation – new AI system');
  const pageTypeConfig = PAGE_TYPE_BY_SLUG[slug];
  const inputJson = buildNewInputJson(state, city, slug);
  return generateLandingPageContent(pageTypeConfig, inputJson);
}

/**
 * Get or generate landing page content with proper caching
 * - During build: Return safe fallback (NO AI)
 * - At runtime: Check cache → AI generate → save → return
 */
async function getOrGenerateLandingContent(
  state: string,
  city: string,
  slug: string
): Promise<LandingPageContent> {
  // GUARD: Never run AI during build
  if (isBuildTime()) {
    console.log('[Landing] Build phase – AI skipped');
    return createFallbackContent(state, city, slug);
  }
  
  // Step 1: Try cache first
  const cached = await getCachedContent(city, slug);
  if (cached) {
    return cached;
  }
  
  // Step 2: Generate with NEW AI system at runtime
  try {
    const content = await generateAIContent(state, city, slug);
    
    // Step 3: Save to cache
    await saveCachedContent(city, slug, content);
    
    return content;
  } catch (error) {
    console.error('[Landing Page] AI generation failed at runtime:', error);
    // Return safe fallback if AI fails
    return createFallbackContent(state, city, slug);
  }
}

/**
 * Main Page Component - Server-Side Rendered
 * 
 * Supports both new and legacy content formats:
 * - New format: Uses client's JSON schema with sections object
 * - Legacy format: Uses array-based sections structure
 */
export default async function LandingPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { state, city, slug } = resolvedParams;

  let content: any;
  const isNewFormat = USE_NEW_AI_MODULE && isValidPageTypeSlug(slug);

  try {
    // Get cached or generate content (build-safe)
    content = await getOrGenerateLandingContent(state, city, slug);
  } catch (error) {
    console.error("[Landing Page] Content retrieval failed:", error);
    // Use fallback instead of 404
    content = createFallbackContent(state, city, slug);
  }

  // Build structured data schemas
  const breadcrumbSchema = generateBreadcrumb([
    { name: "Home", item: "/", position: 1 },
    { name: state.replace(/-/g, " "), item: `/${state}`, position: 2 },
    { name: city.replace(/-/g, " "), item: `/${state}/${city}`, position: 3 },
    {
      name: content.seo.h1,
      item: content.seo.canonical_path,
      position: 4,
    },
  ]);

  const faqSchema = generateFAQSchema(
    content.faq.map((item: any) => ({
      question: item.q,
      answer: item.a,
    }))
  );

  const webPageSchema = generateWebPageSchema(
    content.seo.canonical_path,
    content.seo.title,
    content.seo.meta_description
  );

  const localBusinessSchema = generateLocalBusinessSchema(
    city.replace(/-/g, " "),
    state.replace(/-/g, " ")
  );

  // Helper to get intro content based on format
  const getIntro = () => {
    if (isNewFormat) {
      return {
        subheadline: content.intro.subheadline,
        quick_bullets: content.intro.quick_bullets,
        last_updated_line: content.intro.last_updated_line,
      };
    }
    return {
      subheadline: content.page_intro?.subheadline || "",
      quick_bullets: content.page_intro?.quick_bullets || [],
      last_updated_line: content.page_intro?.last_updated_line || "",
    };
  };

  // Render sections based on format (new = object, legacy = array)
  const renderSections = () => {
    if (isNewFormat) {
      // New format: sections is an object with 11 named properties
      const sections = content.sections;
      return (
        <>
          {/* 1. Hero Overview */}
          <section id="hero-overview">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
              {sections.hero_overview.heading}
            </h2>
            <div className="prose prose-lg dark:prose-invert max-w-none whitespace-pre-wrap">
              {sections.hero_overview.body}
            </div>
          </section>

          {/* 2. About the Area */}
          <section id="about-area">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
              {sections.about_area.heading}
            </h2>
            <div className="prose prose-lg dark:prose-invert max-w-none whitespace-pre-wrap">
              {sections.about_area.body}
            </div>
          </section>

          {/* 3. Neighborhoods & Nearby Areas */}
          <NeighborhoodCards
            heading={sections.neighborhoods.heading}
            body={sections.neighborhoods.body}
            cards={sections.neighborhoods.cards.map((card: any) => ({
              name: card.name,
              blurb: card.blurb,
              best_for: card.best_for,
              internal_link_text: card.internal_link_text,
              internal_link_href: card.internal_link_href,
            }))}
          />

          {/* 4. Buyer Strategy */}
          <BuyerStrategy
            heading={sections.buyer_strategy.heading}
            body={sections.buyer_strategy.body}
            cta={sections.buyer_strategy.cta}
          />

          {/* 5. Property Types */}
          <PropertyTypes
            heading={sections.property_types.heading}
            body={sections.property_types.body}
          />

          {/* 6. Market Snapshot */}
          <MarketSnapshot
            heading={sections.market_snapshot.heading}
            body={sections.market_snapshot.body}
            stats={[]} // New format mentions stats in the body text
          />

          {/* 7. Schools & Education */}
          <section id="schools-education">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
              {sections.schools_education.heading}
            </h2>
            <div className="prose prose-lg dark:prose-invert max-w-none whitespace-pre-wrap">
              {sections.schools_education.body}
            </div>
          </section>

          {/* 8. Lifestyle & Amenities */}
          <section id="lifestyle-amenities">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
              {sections.lifestyle_amenities.heading}
            </h2>
            <div className="prose prose-lg dark:prose-invert max-w-none whitespace-pre-wrap">
              {sections.lifestyle_amenities.body}
            </div>
          </section>

          {/* 9. Featured Listings */}
          <section id="featured-listings">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
              {sections.featured_listings.heading}
            </h2>
            <div className="prose prose-lg dark:prose-invert max-w-none whitespace-pre-wrap">
              {sections.featured_listings.body}
            </div>
          </section>

          {/* 10. Working with Crown Coastal Homes */}
          <section id="working-with-agent">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
              {sections.working_with_agent.heading}
            </h2>
            <div className="prose prose-lg dark:prose-invert max-w-none whitespace-pre-wrap">
              {sections.working_with_agent.body}
            </div>
          </section>
        </>
      );
    } else {
      // Legacy format: sections is an array
      return content.sections.map((section: any) => {
        switch (section.id) {
          case "market-snapshot":
            return (
              <MarketSnapshot
                key={section.id}
                heading={section.heading}
                body={section.body}
                stats={section.stats}
              />
            );

          case "featured-listings":
            return (
              <section key={section.id} id="featured-listings">
                <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
                  {section.heading}
                </h2>
                <div
                  className="prose prose-lg dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: section.body }}
                />
              </section>
            );

          case "what-1m-buys":
            return (
              <WhatMBuys
                key={section.id}
                heading={section.heading}
                body={section.body}
              />
            );

          case "neighborhoods":
            return (
              <NeighborhoodCards
                key={section.id}
                heading={section.heading}
                body={section.body}
                cards={section.neighborhood_cards || []}
              />
            );

          case "property-types":
            return (
              <PropertyTypes
                key={section.id}
                heading={section.heading}
                body={section.body}
              />
            );

          case "buyer-strategy":
            return (
              <BuyerStrategy
                key={section.id}
                heading={section.heading}
                body={section.body}
                cta={section.cta}
              />
            );

          default:
            return null;
        }
      });
    }
  };

  const intro = getIntro();

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />

      {/* Main Content */}
      <main className="min-h-screen bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <header className="mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
              {content.seo.h1}
            </h1>

            <PageIntro
              subheadline={intro.subheadline}
              quick_bullets={intro.quick_bullets}
              last_updated_line={intro.last_updated_line}
            />
          </header>

          {/* Table of Contents - only show for legacy format */}
          {!isNewFormat && content.toc && (
            <TableOfContents items={content.toc} />
          )}

          {/* Main Sections */}
          <div className="space-y-16">
            {renderSections()}

            {/* FAQ Section */}
            <section id="faq" className="py-12">
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">
                Frequently Asked Questions
              </h2>
              <FAQAccordion
                faqs={content.faq.map((item: any) => ({
                  question: item.q,
                  answer: item.a,
                }))}
              />
            </section>

            {/* Trust Box */}
            <TrustBox
              about_brand={content.trust.about_brand}
              agent_box={content.trust.agent_box}
            />

            {/* Internal Links */}
            <InternalLinks
              related_pages={content.internal_linking.related_pages}
              more_in_city={content.internal_linking.more_in_city}
              nearby_cities={content.internal_linking.nearby_cities}
            />
          </div>
        </div>
      </main>
    </>
  );
}

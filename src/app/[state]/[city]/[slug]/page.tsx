/**
 * SEO Landing Page - Server-Side Rendered
 * Route: /[state]/[city]/[slug]
 * Example: /california/san-diego/homes-over-1m
 * 
 * CRITICAL: AI generation is DISABLED for page rendering.
 * Content must be pre-generated via admin API or batch job.
 * If content doesn't exist in DB, page returns 404.
 */

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { type LandingPageContent } from "@/ai/landing";
import { isValidPageTypeSlug } from "@/ai/pageTypes";
import {
  generateBreadcrumb,
  generateFAQSchema,
  generateWebPageSchema,
  generateLocalBusinessSchema,
  validateMetaLength,
} from "@/lib/utils/seo";
import {
  MarketSnapshot,
  NeighborhoodCards,
  PropertyTypes,
  BuyerStrategy,
  TrustBox,
  InternalLinks,
  PageIntro,
} from "@/components/landing/landing-sections";
import { FAQAccordion } from "@/components/ui/faq-accordion";

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

  // Try to get content from database for metadata
  try {
    // Get cached content only - no AI generation
    const content = await getLandingContent(state, city, slug);
    
    // If no content, return minimal fallback metadata
    if (!content) {
      const cityName = city.replace(/-/g, " ");
      const stateName = state.replace(/-/g, " ");
      return {
        title: `${cityName}, ${stateName} Real Estate | Crown Coastal Homes`,
        description: `Find your dream home in ${cityName}, ${stateName}.`,
      };
    }

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

// ============================================================================
// NOTE: AI input JSON builders have been REMOVED from page rendering.
// AI content generation is ONLY available via:
// - POST /api/admin/landing-pages/generate-content
// - CLI scripts with ALLOW_AI_GENERATION=true
// ============================================================================

/**
 * Fetch cached landing page content from Supabase
 */
async function getCachedContent(city: string, slug: string): Promise<LandingPageContent | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  
  const cityName = city.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  try {
    // Use order + limit instead of maybeSingle to handle multiple rows safely
    const { data: rows, error } = await supabase
      .from('landing_pages')
      .select('content')
      .ilike('city', cityName)
      .eq('page_name', slug)
      .order('updated_at', { ascending: false })
      .limit(1);
    
    const data = rows?.[0];
    if (error || !data || !data.content) return null;
    
    // Content is stored as TEXT (stringified JSON) - must parse it
    let parsedContent: any = null;
    try {
      parsedContent = typeof data.content === 'string' 
        ? JSON.parse(data.content) 
        : data.content;
      console.log('[Landing Page] Parsed content, keys:', Object.keys(parsedContent || {}));
    } catch (e) {
      console.error('[Landing Page] Failed to parse content:', e);
      return null;
    }
    
    // Validate that content matches expected structure
    if (parsedContent && parsedContent.seo && parsedContent.sections) {
      console.log('[Landing Page] Cached content used, section keys:', Object.keys(parsedContent.sections || {}));
      return parsedContent as LandingPageContent;
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

// ============================================================================
// NOTE: AI generation functions have been REMOVED from page rendering.
// AI content generation is ONLY available via:
// - POST /api/admin/landing-pages/generate-content
// - CLI scripts with ALLOW_AI_GENERATION=true
// ============================================================================

/**
 * Get landing page content from database ONLY
 * 
 * CRITICAL: AI generation is NEVER allowed during page render.
 * - During build: Return null (triggers 404)
 * - At runtime: Return cached content or null (triggers 404)
 * 
 * Content must be pre-generated via admin API:
 * POST /api/admin/landing-pages/generate-content
 */
async function getLandingContent(
  state: string,
  city: string,
  slug: string
): Promise<LandingPageContent | null> {
  // During build phase, skip DB queries entirely
  if (isBuildTime()) {
    console.log('[Landing] Build phase – returning null for static generation');
    return null;
  }
  
  // At runtime: fetch from database ONLY (no AI fallback)
  const cached = await getCachedContent(city, slug);
  if (cached) {
    console.log('[Landing Page] Serving cached content from database');
    return cached;
  }
  
  // No cached content = 404
  // Content must be pre-generated via admin API
  console.log('[Landing Page] No cached content found - content must be generated via admin API');
  return null;
}

/**
 * Main Page Component - Server-Side Rendered
 * 
 * CRITICAL: AI generation is DISABLED for page rendering.
 * Content must be pre-generated via admin API or batch job.
 * Returns 404 if content doesn't exist in DB.
 */
export default async function LandingPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { state, city, slug } = resolvedParams;

  // Validate slug format
  if (!isValidPageTypeSlug(slug)) {
    notFound();
  }

  // Get content from database ONLY - no AI generation at runtime
  const content = await getLandingContent(state, city, slug);
  
  // If no content exists, return 404
  // Content must be pre-generated via admin API
  if (!content) {
    console.log('[Landing Page] Content not found, returning 404');
    notFound();
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
    // Content is always in new format (LandingPageContent type)
    return {
      subheadline: content.intro.subheadline,
      quick_bullets: content.intro.quick_bullets,
      last_updated_line: content.intro.last_updated_line,
    };
  };

  // Render sections - content is always in new format (LandingPageContent type)
  const renderSections = () => {
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

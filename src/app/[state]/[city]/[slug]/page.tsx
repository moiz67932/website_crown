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
    // Generate content using appropriate AI module
    const content = await generateContent(state, city, slug);

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
 * Generate content using the appropriate AI module
 */
async function generateContent(state: string, city: string, slug: string) {
  if (USE_NEW_AI_MODULE && isValidPageTypeSlug(slug)) {
    console.log("[Landing Page] Using NEW AI module with client prompts");
    const pageTypeConfig = PAGE_TYPE_BY_SLUG[slug];
    const inputJson = buildNewInputJson(state, city, slug);
    return generateLandingPageContent(pageTypeConfig, inputJson);
  } else {
    console.log("[Landing Page] Using LEGACY AI module");
    const inputJson = buildLegacyInputJson(state, city, slug);
    return generateLandingPageJSON(inputJson);
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
    // Generate AI content using appropriate module
    content = await generateContent(state, city, slug);
  } catch (error) {
    console.error("[Landing Page] Content generation failed:", error);
    // Return 404 if content generation fails
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

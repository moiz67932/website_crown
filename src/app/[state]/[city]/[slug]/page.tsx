/**
 * SEO Landing Page - Server-Side Rendered
 * Route: /[state]/[city]/[slug]
 * Example: /california/san-diego/homes-over-1m
 */

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { generateLandingPageJSON } from "@/lib/landing/ai";
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
    // Build input for AI generator
    const inputJson = buildInputJson(state, city, slug);
    const content = await generateLandingPageJSON(inputJson);

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
 * Build input JSON for AI content generator
 */
function buildInputJson(state: string, city: string, slug: string) {
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
 * Main Page Component - Server-Side Rendered
 */
export default async function LandingPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { state, city, slug } = resolvedParams;

  let content: any;

  try {
    // Generate AI content
    const inputJson = buildInputJson(state, city, slug);
    content = await generateLandingPageJSON(inputJson);
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
              subheadline={content.page_intro.subheadline}
              quick_bullets={content.page_intro.quick_bullets}
              last_updated_line={content.page_intro.last_updated_line}
            />
          </header>

          {/* Table of Contents */}
          <TableOfContents items={content.toc} />

          {/* Main Sections */}
          <div className="space-y-16">
            {content.sections.map((section: any) => {
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
                      {/* Add PropertyCard components here if you have listings data */}
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
            })}

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

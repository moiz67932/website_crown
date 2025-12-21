// src/app/(landing)/landing-page.tsx
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { LandingData } from "@/types/landing";
import Hero from "./sections/Hero";
import Intro from "./sections/Intro";
import StatsSection from "./sections/Stats";
import PropertyCard from "../property-card-client";
import NeighborhoodsSection from "./sections/Neighborhoods";
import SchoolsSection from "./sections/Schools";
import FAQSection from "./sections/FAQ";
import RelatedLinksSection from "./sections/RelatedLinks";
import AIDescription from "./sections/AIDescription";
import AmenitiesSection from "./sections/Amenities";
import TransportationSection from "./sections/Transportation";
import WeatherSection from "./sections/Weather";
import DemographicsSection from "./sections/Demographics";
import EconomicsSection from "./sections/Economics";
import CrimeSection from "./sections/Crime";
import BusinessDirectorySection from "./sections/BusinessDirectory";
import CitySchema from "@/components/seo/CitySchema";
import RelatedVariants from "./sections/RelatedVariants";
import Link from "next/link";
import { CA_CITIES, cityToTitle } from "@/lib/seo/cities";
import { safeHtml } from "@/lib/utils/sanitize-html";

const MapSection = dynamic<{ city: string }>(() => import("./sections/Map"), {
  loading: () => (
    <div className="rounded-xl border bg-muted/40 h-64 w-full animate-pulse" />
  ),
});

const TrendsSection = dynamic(() => import("./sections/Trends"), {
  loading: () => (
    <div className="rounded-xl border bg-muted/40 h-64 w-full animate-pulse" />
  ),
});

type SimpleFAQ = { question: string; answer: string };
interface Props {
  data: LandingData;
  faqItems?: SimpleFAQ[];
  faqJsonLd?: any;
}

// NOTE: stripDuplicateHeading is now imported from sanitize-html.ts
// All HTML rendering uses safeHtml() which sanitizes AND strips duplicate headings

// Helper component to render a section with heading and body
function ContentSection({
  section,
  className,
}: {
  section?: { heading?: string; body?: string; cards?: any[]; cta?: any };
  className?: string;
}) {
  if (!section || (!section.heading && !section.body)) return null;

  return (
    <section className={`${className || ""} space-y-4`}>
      {section.heading && (
        <h2 className="text-2xl sm:text-3xl font-bold text-brand-midnightCove mb-5">
          {section.heading}
        </h2>
      )}

      {section.body && (
        <div
          className="prose prose-lg dark:prose-invert max-w-none
                     text-gray-600 dark:text-gray-400
                     prose-p:text-[1.15rem] prose-p:leading-[1.8] prose-p:mb-5 prose-p:text-gray-600 dark:prose-p:text-gray-400
                     prose-ul:my-5 prose-ul:pl-6 prose-ul:list-disc prose-ul:space-y-2
                     prose-ol:my-5 prose-ol:pl-6 prose-ol:list-decimal prose-ol:space-y-2
                     prose-li:text-[1.1rem] prose-li:leading-[1.7] prose-li:text-gray-600 dark:prose-li:text-gray-400
                     prose-li:marker:text-brand-midnightCove prose-li:pl-2
                     prose-strong:text-gray-700 dark:prose-strong:text-gray-300
                     [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ul]:space-y-2
                     [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 [&_ol]:space-y-2
                     [&_li]:relative [&_li]:pl-2"
          dangerouslySetInnerHTML={{
            __html: safeHtml(section.body, section.heading),
          }}
        />
      )}
    </section>
  );
}

// Helper component to render neighborhood cards
function NeighborhoodCards({
  section,
}: {
  section?: { heading?: string; body?: string; cards?: any[] };
}) {
  if (!section?.cards?.length) return null;

  return (
    <section className="space-y-5">
      {section.heading && (
        <h2 className="text-2xl sm:text-3xl font-bold text-brand-midnightCove mb-5">
          {section.heading}
        </h2>
      )}

      {section.body && (
        <div
          className="prose prose-lg dark:prose-invert max-w-none mb-8
                     text-gray-600 dark:text-gray-400
                     prose-p:text-[1.15rem] prose-p:leading-[1.8] prose-p:mb-5 prose-p:text-gray-600 dark:prose-p:text-gray-400
                     prose-ul:my-5 prose-ul:pl-6 prose-ul:list-disc prose-ul:space-y-2
                     prose-li:text-[1.1rem] prose-li:leading-[1.7] prose-li:text-gray-600 dark:prose-li:text-gray-400"
          dangerouslySetInnerHTML={{
            __html: safeHtml(section.body, section.heading),
          }}
        />
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {section.cards.map((card, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            {card.name && (
              <h3 className="text-lg font-semibold text-brand-midnightCove mb-3">
                {card.name}
              </h3>
            )}
            {card.blurb && (
              <p className="text-[1.05rem] leading-relaxed text-gray-500 dark:text-gray-400 mb-4">
                {card.blurb}
              </p>
            )}
            {card.best_for?.length > 0 && (
              <p className="text-[1.05rem] text-gray-500 dark:text-gray-400 mb-4">
                <strong className="text-gray-600 dark:text-gray-300">
                  Best for:
                </strong>{" "}
                {card.best_for.join(", ")}
              </p>
            )}
            {card.internal_link_href && card.internal_link_text && (
              <Link
                href={card.internal_link_href}
                className="text-sm text-brand-midnightCove hover:underline font-medium"
              >
                {card.internal_link_text} →
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// Helper component to render buyer strategy with CTA
function BuyerStrategySection({
  section,
}: {
  section?: { heading?: string; body?: string; cta?: any };
}) {
  if (!section) return null;

  return (
    <section className="space-y-5">
      {section.heading && (
        <h2 className="text-2xl sm:text-3xl font-bold text-brand-midnightCove mb-5">
          {section.heading}
        </h2>
      )}

      {section.body && (
        <div
          className="prose prose-lg dark:prose-invert max-w-none mb-8
                     text-gray-600 dark:text-gray-400
                     prose-p:text-[1.15rem] prose-p:leading-[1.8] prose-p:mb-5 prose-p:text-gray-600 dark:prose-p:text-gray-400
                     prose-ul:my-5 prose-ul:pl-6 prose-ul:list-disc prose-ul:space-y-2
                     prose-ol:my-5 prose-ol:pl-6 prose-ol:list-decimal prose-ol:space-y-2
                     prose-li:text-[1.1rem] prose-li:leading-[1.7] prose-li:text-gray-600 dark:prose-li:text-gray-400
                     prose-li:marker:text-brand-midnightCove prose-li:pl-2
                     [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ul]:space-y-2
                     [&_li]:relative [&_li]:pl-2"
          dangerouslySetInnerHTML={{
            __html: safeHtml(section.body, section.heading),
          }}
        />
      )}

      {section.cta && (
        <div className="bg-brand-midnightCove/5 rounded-xl p-8 border border-brand-midnightCove/20">
          {section.cta.title && (
            <h3 className="text-xl font-semibold text-brand-midnightCove mb-3">
              {section.cta.title}
            </h3>
          )}
          {section.cta.body && (
            <p className="text-[1.1rem] leading-relaxed text-gray-600 dark:text-gray-400 mb-5">
              {section.cta.body}
            </p>
            )}
          {section.cta.button_href && section.cta.button_text && (
            <Link
              href={section.cta.button_href}
              className="inline-flex items-center px-6 py-3 bg-brand-midnightCove text-white rounded-lg font-medium hover:bg-brand-midnightCove/90 transition-colors"
            >
              {section.cta.button_text}
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

export default function LandingTemplate({ data, faqItems, faqJsonLd }: Props) {
  const { city, kind, dbContent } = data;
  // Filter out any Land properties (safety check - should already be filtered from DB)
  const featured = (data.featured || []).filter(
    (f: any) =>
      !f.propertyType?.toLowerCase().includes("land") &&
      !f.property_type?.toLowerCase().includes("land") &&
      !f.status?.toLowerCase().includes("land")
  );
  const citySlug = city.toLowerCase().replace(/\s+/g, "-");

  console.log("🎨 [LandingTemplate] Rendering with data:", {
    city,
    kind,
    featuredCount: featured.length,
    hasStats: !!data.stats,
    stats: data.stats,
    hasDbContent: !!dbContent,
    dbContentKeys: dbContent ? Object.keys(dbContent) : [],
    dbSectionKeys: dbContent?.sections ? Object.keys(dbContent.sections) : [],
    hasAiDescriptionHtml: !!data.aiDescriptionHtml,
    aiHtmlLength: data.aiDescriptionHtml?.length || 0,
    firstFeatured: featured[0] || null,
  });

  // Extract content from DB
  const introContent = dbContent?.intro;
  const trustContent = dbContent?.trust;
  const sections = dbContent?.sections;

  return (
    <div className="flex flex-col pb-24 pt-14">
      {city && (
        <CitySchema
          city={city}
          canonical={`/california/${citySlug}/${kind}`}
          featured={(featured || []).map((f) => ({
            id: f.listingKey,
            url: (f as any).url || undefined,
          }))}
          variant={kind}
          faqItems={faqItems}
        />
      )}

      {/* Main constrained container */}
      <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12">
        <Hero city={city} kind={kind} />

        {/* Intro from DB content - show quick bullets if available */}
        {introContent && (
          <section className="prose dark:prose-invert max-w-none space-y-4">
            {introContent.subheadline && (
              <p className="text-[1.2rem] leading-relaxed text-gray-500 dark:text-gray-400 italic mb-5">
                {introContent.subheadline}
              </p>
            )}
            {introContent.quick_bullets &&
              introContent.quick_bullets.length > 0 && (
                <ul className="grid gap-4 sm:grid-cols-2 list-none pl-0">
                  {introContent.quick_bullets.map((bullet, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-[1.1rem] leading-relaxed text-gray-600 dark:text-gray-400"
                    >
                      <span className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-brand-midnightCove/10 flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-brand-midnightCove"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            {introContent.last_updated_line && (
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-5">
                {introContent.last_updated_line}
              </p>
            )}
          </section>
        )}

        {/* Fallback intro if no DB content */}
        {!introContent && <Intro html={data.introHtml} />}

        {/* === RENDER ALL DB SECTIONS DIRECTLY === */}

        {/* Hero Overview Section */}
        <ContentSection section={sections?.hero_overview} />

        {/* About the Area Section */}
        <ContentSection section={sections?.about_area} />

        {/* Market Snapshot Section */}
        <ContentSection section={sections?.market_snapshot} />

        <StatsSection stats={data.stats} />

        {/* Price Breakdown Section (REQUIRED - contains table) */}
        <ContentSection section={sections?.price_breakdown} className="price-breakdown-section" />

        {/* Buy vs Rent Intent Clarifier (REQUIRED) */}
        <ContentSection section={sections?.buy_vs_rent} />

        {/* Property Types Section */}
        <ContentSection section={sections?.property_types} />

        {/* Neighborhoods Section with Cards */}
        <NeighborhoodCards section={sections?.neighborhoods} />

        {/* Featured */}
        <section className="pt-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-brand-midnightCove">
              Featured Listings
            </h2>
          </div>
          {!featured.length && (
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-neutral-200/60 dark:border-slate-700 bg-muted/40 h-64 animate-pulse shadow-sm"
                />
              ))}
            </div>
          )}
          {!!featured.length && (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {featured.map((f) => {
                const adapted: any = {
                  _id: f.listingKey,
                  id: f.listingKey,
                  listing_key: f.listingKey,
                  property_type: f.status || "Residential",
                  list_price: f.price || 0,
                  address:
                    f.address ||
                    f.title ||
                    `${f.city}${f.state ? ", " + f.state : ""}`,
                  city: f.city,
                  county: f.state || "",
                  bedrooms: f.beds || 0,
                  bathrooms: f.baths || 0,
                  lot_size_sqft: f.sqft || 0,
                  listing_photos: f.img ? [f.img] : [],
                  images: f.img ? [f.img] : [],
                  main_photo_url: f.img || null,
                  status: f.status || "Active",
                };
                return <PropertyCard key={f.listingKey} property={adapted} />;
              })}
            </div>
          )}
        </section>

        {/* Trust / Agent Box from DB content */}
        {trustContent && (
          <section className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-8 border border-gray-200 dark:border-slate-700">
            {trustContent.agent_box && (
              <div className="mb-5">
                {trustContent.agent_box.headline && (
                  <h3 className="text-xl font-semibold text-brand-midnightCove mb-3">
                    {trustContent.agent_box.headline}
                  </h3>
                )}
                {trustContent.agent_box.body && (
                  <p className="text-[1.1rem] leading-relaxed text-gray-600 dark:text-gray-400">
                    {trustContent.agent_box.body}
                  </p>
                )}
                {trustContent.agent_box.disclaimer && (
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-3 italic">
                    {trustContent.agent_box.disclaimer}
                  </p>
                )}
              </div>
            )}
            {trustContent.about_brand && (
              <p className="text-[1.05rem] leading-relaxed text-gray-500 dark:text-gray-400">
                {trustContent.about_brand}
              </p>
            )}
          </section>
        )}

        {/* Buyer Strategy Section with CTA */}
        <BuyerStrategySection section={sections?.buyer_strategy} />

        {/* Schools/Education Section */}
        <ContentSection section={sections?.schools_education} />

        {/* Lifestyle/Amenities Section */}
        <ContentSection section={sections?.lifestyle_amenities} />

        {/* Working with Agent Section */}
        <ContentSection section={sections?.working_with_agent} />
      </div>

      {/* Map */}
      <div className="w-full mt-6">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense
            fallback={
              <div className="h-64 rounded-xl border bg-muted animate-pulse" />
            }
          >
            <MapSection city={city} />
          </Suspense>
        </div>
      </div>

      {/* Bottom stack */}
      <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12 mt-12">
        <FAQSection
          items={
            faqItems && faqItems.length
              ? faqItems.map((f) => ({ q: f.question, a: f.answer }))
              : data.faq
          }
        />
        {faqJsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
          />
        )}
        <RelatedLinksSection links={data.related} />
        {/* <RelatedCitiesSection cities={data.relatedCities} /> */}
        <RelatedVariants citySlug={citySlug} currentSlug={kind} />

        <section className="mt-4">
          <h3 className="text-lg font-semibold mb-4">
            Related California Cities
          </h3>
          <div className="flex flex-wrap gap-3">
            {CA_CITIES.slice(0, 12).map((c) => (
              <Link
                key={c}
                href={`/california/${c}/homes-for-sale`}
                className="rounded-full border px-5 py-3 min-h-[44px] flex items-center text-sm font-medium hover:bg-accent transition-colors active:scale-95"
              >
                {cityToTitle(c)}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

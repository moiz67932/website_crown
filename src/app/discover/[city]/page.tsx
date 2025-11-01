// import dynamic from "next/dynamic";
import { getCityData, MappingCityIdToCityName } from "../../../lib/city-data";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../components/ui/accordion";
import {
  ArrowRight,
  Search,
  MapPin,
  StarIcon,
  MessageSquare,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { PropertyCard } from "../../../components/property-card";
import { cn } from "../../../lib/utils";
import { Property } from "../../../interfaces";
import { cityPageStyles, citySearchWidgetStyles } from "./page.styles";
import ScrollButton from "./_components/ScrollButton";
import CityMapWrapper from "../../../components/map/CityMapWrapper";

// const CityMapWrapper = dynamic(
//   () => import("../../../components/map/CityMapWrapper"),
//   { ssr: false }
// );

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const cityData = getCityData(city || "");
  if (!cityData) {
    return {
      title: "City Not Found",
    };
  }
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    ),
    title: cityData.metaTitle,
    description: cityData.metaDescription,
    openGraph: {
      title: cityData.metaTitle,
      description: cityData.metaDescription,
      images: [
        {
          url: cityData.heroImage,
          width: 1200,
          height: 630,
          alt: `Explore ${cityData.name}`,
        },
      ],
    },
  };
}

// Simple Search Widget Component
function CitySearchWidget({
  cityName,
  cityId,
}: {
  cityName: string;
  cityId: string;
}) {
  return (
    <div
      className={citySearchWidgetStyles.container}
      style={{ backgroundColor: "hsl(0 0% 100%/.9)" }}
    >
      <h3 className={citySearchWidgetStyles.title}>
        Find Your Home in {cityName}
      </h3>
      <form action="/buy" method="GET" className={citySearchWidgetStyles.form}>
        <input type="hidden" name="location" value={cityId} />
        <div className={citySearchWidgetStyles.inputContainer}>
          <MapPin className={citySearchWidgetStyles.mapPinIcon} />
          <Input
            type="text"
            name="keywords"
            placeholder={`e.g., "beachfront" or "3 bedroom" in ${cityName}`}
            className={citySearchWidgetStyles.input}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className={citySearchWidgetStyles.button}
        >
          <Search className={citySearchWidgetStyles.searchIcon} />
          Search
        </Button>
      </form>
      <p className={citySearchWidgetStyles.browseLinkText}>
        Or{" "}
        <Link href="/buy" className={citySearchWidgetStyles.browseLink}>
          browse all listings
        </Link>
        .
      </p>
    </div>
  );
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const cityData = getCityData(city || "");

  if (!cityData) {
    notFound();
  }

  // Helper to safely parse JSON without throwing when HTML/error is returned
  const safeJson = async (res: Response) => {
    try {
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        // Try to parse anyway but guard against HTML responses
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch {
          return null;
        }
      }
      return await res.json();
    } catch {
      return null;
    }
  };

  // Build request to existing properties API (listings API does not exist in this codebase)
  const cityName = MappingCityIdToCityName(city) || "";
  const propertiesUrl = `${
    process.env.API_BASE_URL ?? ""
  }/api/properties?limit=24&offset=0&city=${encodeURIComponent(cityName)}`;

  const response = await fetch(propertiesUrl, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });

  const propertiesJson = response.ok ? await safeJson(response) : null;
  const featuredProperties = Array.isArray(propertiesJson?.data)
    ? propertiesJson.data
    : Array.isArray(propertiesJson?.listings)
    ? propertiesJson.listings
    : [];

  // Use local hero/neighborhood images from cityData instead of hitting a missing endpoint
  const heroImageSrc = cityData.heroImage;

  return (
    <div className={cn(cityPageStyles.pageContainer, "bg-[#F6EFE9]")}>
      {/* Hero Section */}
      <section className={cityPageStyles.heroSection}>
        <Image
          src={heroImageSrc}
          alt={`Panoramic view of ${cityData.name}`}
          fill
          className={cityPageStyles.heroImage}
          priority
        />
        <div className={cityPageStyles.heroOverlay} />
        <div className={cityPageStyles.heroContent}>
          <h1 className={cn(cityPageStyles.heroTitle, "tracking-tight drop-shadow-sm")}>
            {cityData.heroTitle}
          </h1>
          <p className={cn(cityPageStyles.heroSubtitle, "text-white/90")}>
            {cityData.heroSubtitle}
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className={cn(cityPageStyles.mainContent, "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 space-y-12")}>
        {/* Intro Text & Search Widget Section */}
        <section className={cityPageStyles.introSection}>
          <div
            className={cn(
              cityPageStyles.introTextContainer,
              "rounded-2xl shadow-xl ring-1 ring-black/5 p-6 md:p-8"
            )}
            style={{ backgroundColor: "hsl(0 0% 100%/.95)" }}
          >
            <h2 className={cn(cityPageStyles.introTitle, "text-[#1E3557] text-3xl md:text-4xl mb-4")}>
              Welcome to {cityData.name}
            </h2>
            <p className={cn(cityPageStyles.introText, "text-slate-700 leading-7")}>{cityData.introText}</p>
          </div>
          <div className={cn(cityPageStyles.introSearchContainer, "mt-6 md:mt-0")}>
            <CitySearchWidget cityName={cityData.name} cityId={cityData.id} />
          </div>
        </section>

        {/* Map Section */}
        <section className={cn(cityPageStyles.section, "max-w-7xl mx-auto")}>
          <h2 className={cn(cityPageStyles.mapSectionTitle, "text-center text-[#1E3557] text-3xl md:text-4xl mb-6")}>
            Explore {cityData.name} on the Map
          </h2>
          {cityData.osmBoundingBox && (
            <CityMapWrapper
              key={city}
              bounds={cityData.osmBoundingBox}
              properties={featuredProperties}
            />
          )}
        </section>

        {/* Neighborhoods Section */}
        <section className={cn(cityPageStyles.section, "max-w-7xl mx-auto")}>
          <h2 className={cn(cityPageStyles.sectionTitle, "text-center text-[#1E3557] text-3xl md:text-4xl mb-8")}>
            Discover {cityData.name}'s Neighborhoods
          </h2>
          {cityData.neighborhoodCategories.map((category) => (
            <div
              key={category.name}
              className={cityPageStyles.neighborhoodCategoryContainer}
            >
              <h3 className={cn(cityPageStyles.sectionTitleWithBorder, "text-[#1E3557]")}>
                {category.name}
              </h3>
              <div className={cityPageStyles.neighborhoodGrid}>
                {category.neighborhoods.map((hood) => (
                  <Link
                    href={hood.href}
                    key={hood.name}
                    className={cityPageStyles.neighborhoodCardLink}
                  >
                    <div className={cn(cityPageStyles.neighborhoodCard, "rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/5")}>
                      <div
                        className={cityPageStyles.neighborhoodImageContainer}
                      >
                        <Image
                          src={hood.image || heroImageSrc}
                          alt={`View of ${hood.name}, ${cityData.name}`}
                          fill
                          className={cityPageStyles.neighborhoodImage}
                        />
                        <div
                          className={cityPageStyles.neighborhoodImageOverlay}
                        ></div>
                        <h4 className={cn(cityPageStyles.neighborhoodName, "text-white drop-shadow-md")}>
                          {hood.name}
                        </h4>
                      </div>
                      <div className={cn(cityPageStyles.neighborhoodContent, "bg-white p-5")}>
                        <p className={cn(cityPageStyles.neighborhoodDescription, "text-slate-600")}>
                          {hood.description}
                        </p>
                        <div className={cn(cityPageStyles.neighborhoodExploreLink, "text-[#1E3557] font-semibold")}>
                          Explore {hood.name}
                          <ArrowRight
                            className={cn(cityPageStyles.exploreArrowIcon, "ml-2 h-5 w-5 text-teal-600")}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Market Trends Section NEW */}
        {cityData.marketTrends && cityData.marketTrends.length > 0 && (
          <section
            className={cn(
              cityPageStyles.section,
              cityPageStyles.whiteCard,
              "bg-white/95 rounded-2xl shadow-2xl ring-1 ring-black/5 p-6 md:p-8"
            )}
          >
            <h2 className={cn(cityPageStyles.sectionTitle, "text-center text-[#1E3557] text-3xl md:text-4xl mb-8")}>
              {cityData.name} Real Estate Market Snapshot
            </h2>
            <div className={cn(cityPageStyles.marketTrendsGrid, "gap-6")}>
              {cityData.marketTrends.map((trend) => (
                <div
                  key={trend.metric}
                  className={cn(
                    cityPageStyles.marketTrendCard,
                    "rounded-2xl bg-[#FAF7F2] p-6 shadow-md ring-1 ring-black/5 hover:shadow-lg transition"
                  )}
                >
                  <trend.icon className={cn(cityPageStyles.marketTrendIcon, "h-10 w-10 text-teal-600 mb-2")} />
                  <p className={cn(cityPageStyles.marketTrendValue, "text-2xl md:text-3xl font-extrabold text-[#1F2D3D]")}>
                    {trend.value}
                  </p>
                  <p className={cn(cityPageStyles.marketTrendMetric, "text-slate-600")}>
                    {trend.metric}
                  </p>
                  {trend.change && (
                    <p
                      className={cn(
                        cityPageStyles.marketTrendChangeBase,
                        trend.changeType
                          ? cityPageStyles.marketTrendChange[trend.changeType]
                          : "",
                        "font-semibold"
                      )}
                    >
                      {trend.change}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p className={cn(cityPageStyles.marketTrendFootnote, "text-center text-slate-500 mt-6")}>
              Market data is illustrative. For up-to-date information, please
              contact one of our agents.
            </p>
          </section>
        )}

        {/* Facts Section */}
        <section
          className={cn(
            cityPageStyles.section,
            cityPageStyles.whiteCard,
            "bg-white/95 rounded-2xl shadow-2xl ring-1 ring-black/5 p-6 md:p-8"
          )}
        >
          <h2 className={cn(cityPageStyles.sectionTitle, "text-center text-[#1E3557] text-3xl md:text-4xl mb-8")}>
            Key Facts About {cityData.name}
          </h2>
          <div className={cn(cityPageStyles.factsGrid, "gap-6")}>
            {cityData.facts.map((fact) => (
              <div
                key={fact.title}
                className={cn(
                  cityPageStyles.factCard,
                  "rounded-xl bg-[#FAF7F2] p-5 shadow-md ring-1 ring-black/5"
                )}
              >
                <fact.icon className={cn(cityPageStyles.factIcon, "h-8 w-8 text-teal-600")} />
                <div>
                  <h4 className={cn(cityPageStyles.factTitle, "text-[#1E3557] font-semibold")}>{fact.title}</h4>
                  <p className={cn(cityPageStyles.factValue, "text-slate-700")}>{fact.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials Section NEW */}
        {cityData.testimonials && cityData.testimonials.length > 0 && (
          <section className={cn(cityPageStyles.section, "max-w-7xl mx-auto")}>
            <h2 className={cn(cityPageStyles.sectionTitleSpaced, "text-center text-[#1E3557] text-3xl md:text-4xl mb-8")}>
              Hear From Our {cityData.name} Clients
            </h2>
            <div className={cn(cityPageStyles.testimonialsGrid, "gap-6")}>
              {cityData.testimonials.map((testimonial, index) => (
                <div key={index} className={cn(cityPageStyles.testimonialCard, "rounded-2xl bg-white shadow-lg ring-1 ring-black/5 p-6")}>
                  <div className={cityPageStyles.testimonialRatingContainer}>
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={cn(
                          cityPageStyles.testimonialStarIcon,
                          i < testimonial.rating
                            ? cityPageStyles.testimonialStar.filled
                            : cityPageStyles.testimonialStar.empty,
                          "h-5 w-5 text-amber-500"
                        )}
                      />
                    ))}
                  </div>
                  <MessageSquare
                    className={cn(cityPageStyles.testimonialQuoteIcon, "text-teal-600")}
                  />
                  <p className={cn(cityPageStyles.testimonialQuote, "text-slate-700")}>
                    "{testimonial.quote}"
                  </p>
                  <div>
                    <p className={cn(cityPageStyles.testimonialAuthor, "text-[#1E3557] font-semibold")}>
                      {testimonial.author}
                    </p>
                    <p className={cn(cityPageStyles.testimonialLocation, "text-slate-500")}>
                      {testimonial.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Property Listings Preview */}
        <section className={cn(cityPageStyles.section, "max-w-7xl mx-auto")}>
          <h2 className={cn(cityPageStyles.sectionTitle, "text-center text-[#1E3557] text-3xl md:text-4xl mb-6")}>
            Featured Properties in {cityData.name}
          </h2>
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
              {featuredProperties.map((property: any) => (
                <div
                  key={property.listing_key}
                  className="min-w-[320px] max-w-xs flex-shrink-0"
                >
                  <PropertyCard property={property} />
                </div>
              ))}
            </div>

            <ScrollButton />
          </div>
          <div className={cn(cityPageStyles.propertiesButtonContainer, "mt-6")}>
            <Button
              asChild
              size="lg"
              className={cn(
                cityPageStyles.propertiesViewAllButton,
                "rounded-full bg-[#F0A66A] hover:bg-[#ea9352] text-white h-12 px-6 shadow-lg"
              )}
            >
              <Link
                href={`/properties?location=${cityData.name}&searchLocationType=county`}
              >
                <Search className={cn(cityPageStyles.propertiesSearchIcon, "mr-2 h-5 w-5")} />
                View All Properties in {cityData.name}
              </Link>
            </Button>
          </div>
        </section>

        {/* FAQ Section */}
        <section className={cn(cityPageStyles.whiteCard, "bg-white/95 rounded-2xl shadow-2xl ring-1 ring-black/5 p-6 md:p-8")}>
          <h2 className={cn(cityPageStyles.sectionTitle, "text-center text-[#1E3557] text-3xl md:text-4xl mb-4")}>
            Frequently Asked Questions
          </h2>
          <Accordion
            type="single"
            collapsible
            className={cn(cityPageStyles.faqAccordion, "divide-y divide-slate-200")}
          >
            {cityData.faqs.map((faq, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className={cn(cityPageStyles.faqTrigger, "text-slate-800 text-lg")}>
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className={cn(cityPageStyles.faqContent, "text-slate-600")}>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>
    </div>
  );
}

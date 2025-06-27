import { getCityData, MappingCityIdToCityName } from "@/lib/city-data"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ArrowRight, Search, MapPin, StarIcon, MessageSquare, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import type { Metadata } from "next"
import { PropertyCard } from "@/components/property-card"
import { cn } from "@/lib/utils"
import { Property } from "@/interfaces"
import CityMapWrapper from "@/components/city-map"
import { cityPageStyles, citySearchWidgetStyles } from "./page.styles"
import ScrollButton from "./_components/ScrollButton"


export async function generateMetadata({ params }: {params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params;
  const cityData = getCityData(city || '')
  if (!cityData) {
    return {
      title: "City Not Found",
    }
  }
  return {
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
  }
}

// Simple Search Widget Component
function CitySearchWidget({ cityName, cityId }: { cityName: string; cityId: string }) {
  return (
    <div className={citySearchWidgetStyles.container} style={{ backgroundColor: 'hsl(0 0% 100%/.9)' }}>
      <h3 className={citySearchWidgetStyles.title}>Find Your Home in {cityName}</h3>
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
  )
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const cityData = getCityData(city || '')
  
  if (!cityData) {
    notFound()
  }

  // Fetch properties using server-side data fetching
  const response = await fetch(`${process.env.API_BASE_URL}/api/listings?skip=0&limit=100&county=${MappingCityIdToCityName(city)}`, { 
    cache: 'no-store'
  });

  const featuredPropertiesRaw = await response.json();
  const responseImage = await fetch(`${process.env.API_BASE_URL}/api/counties-images?county=${MappingCityIdToCityName(city)} County`, { 
    cache: 'no-store'
  });
  const imageData = await responseImage.json();

  return (
    <div className={cityPageStyles.pageContainer}>
      {/* Hero Section */}
      <section className={cityPageStyles.heroSection}>
        <Image
          src={imageData[0].image_url}
          alt={`Panoramic view of ${cityData.name}`}
          fill
          className={cityPageStyles.heroImage}
          priority
        />
        <div className={cityPageStyles.heroOverlay} />
        <div className={cityPageStyles.heroContent}>
          <h1 className={cityPageStyles.heroTitle}>
            {cityData.heroTitle}
          </h1>
          <p className={cityPageStyles.heroSubtitle}>{cityData.heroSubtitle}</p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className={cityPageStyles.mainContent}>
        {/* Intro Text & Search Widget Section */}
        <section className={cityPageStyles.introSection}>
          <div className={cityPageStyles.introTextContainer} style={{ backgroundColor: 'hsl(0 0% 100%/.9)' }}>
            <h2 className={cityPageStyles.introTitle}>Welcome to {cityData.name}</h2>
            <p className={cityPageStyles.introText}>{cityData.introText}</p>
          </div>
          <div className={cityPageStyles.introSearchContainer}>
            <CitySearchWidget cityName={cityData.name} cityId={cityData.id} />
          </div>
        </section>

        {/* Map Section */}
        <section className={cityPageStyles.section}>
          <h2 className={cityPageStyles.mapSectionTitle}>
            Explore {cityData.name} on the Map
          </h2>
          {cityData.osmBoundingBox && (
            <CityMapWrapper bounds={cityData.osmBoundingBox} properties={featuredPropertiesRaw.listings} />
          )}
        </section>

        {/* Neighborhoods Section */}
        <section className={cityPageStyles.section}>
          <h2 className={cityPageStyles.sectionTitle}>
            Discover {cityData.name}'s Neighborhoods
          </h2>
          {cityData.neighborhoodCategories.map((category) => (
            <div key={category.name} className={cityPageStyles.neighborhoodCategoryContainer}>
              <h3 className={cityPageStyles.sectionTitleWithBorder}>
                {category.name}
              </h3>
              <div className={cityPageStyles.neighborhoodGrid}>
                {category.neighborhoods.map((hood) => (
                  <Link href={hood.href} key={hood.name} className={cityPageStyles.neighborhoodCardLink}>
                    <div className={cityPageStyles.neighborhoodCard}>
                      <div className={cityPageStyles.neighborhoodImageContainer}>
                        <Image
                          src={imageData[Math.floor(Math.random() * imageData.length)].image_url}
                          alt={`View of ${hood.name}, ${cityData.name}`}
                          fill
                          className={cityPageStyles.neighborhoodImage}
                        />
                        <div className={cityPageStyles.neighborhoodImageOverlay}></div>
                        <h4 className={cityPageStyles.neighborhoodName}>
                          {hood.name}
                        </h4>
                      </div>
                      <div className={cityPageStyles.neighborhoodContent}>
                        <p className={cityPageStyles.neighborhoodDescription}>
                          {hood.description}
                        </p>
                        <div className={cityPageStyles.neighborhoodExploreLink}>
                          Explore {hood.name}
                          <ArrowRight className={cityPageStyles.exploreArrowIcon} />
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
          <section className={cn(cityPageStyles.section, cityPageStyles.whiteCard)}>
            <h2 className={cityPageStyles.sectionTitle}>
              {cityData.name} Real Estate Market Snapshot
            </h2>
            <div className={cityPageStyles.marketTrendsGrid}>
              {cityData.marketTrends.map((trend) => (
                <div key={trend.metric} className={cityPageStyles.marketTrendCard}>
                  <trend.icon className={cityPageStyles.marketTrendIcon} />
                  <p className={cityPageStyles.marketTrendValue}>{trend.value}</p>
                  <p className={cityPageStyles.marketTrendMetric}>{trend.metric}</p>
                  {trend.change && (
                    <p
                      className={cn(
                        cityPageStyles.marketTrendChangeBase,
                        trend.changeType ? cityPageStyles.marketTrendChange[trend.changeType] : "",
                      )}
                    >
                      {trend.change}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p className={cityPageStyles.marketTrendFootnote}>
              Market data is illustrative. For up-to-date information, please contact one of our agents.
            </p>
          </section>
        )}

        {/* Facts Section */}
        <section className={cn(cityPageStyles.section, cityPageStyles.whiteCard)}>
          <h2 className={cityPageStyles.sectionTitle}>
            Key Facts About {cityData.name}
          </h2>
          <div className={cityPageStyles.factsGrid}>
            {cityData.facts.map((fact) => (
              <div key={fact.title} className={cityPageStyles.factCard}>
                <fact.icon className={cityPageStyles.factIcon} />
                <div>
                  <h4 className={cityPageStyles.factTitle}>{fact.title}</h4>
                  <p className={cityPageStyles.factValue}>{fact.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials Section NEW */}
        {cityData.testimonials && cityData.testimonials.length > 0 && (
          <section className={cityPageStyles.section}>
            <h2 className={cityPageStyles.sectionTitleSpaced}>
              Hear From Our {cityData.name} Clients
            </h2>
            <div className={cityPageStyles.testimonialsGrid}>
              {cityData.testimonials.map((testimonial, index) => (
                <div key={index} className={cityPageStyles.testimonialCard}>
                  <div className={cityPageStyles.testimonialRatingContainer}>
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={cn(
                          cityPageStyles.testimonialStarIcon,
                          i < testimonial.rating 
                            ? cityPageStyles.testimonialStar.filled 
                            : cityPageStyles.testimonialStar.empty,
                        )}
                      />
                    ))}
                  </div>
                  <MessageSquare className={cityPageStyles.testimonialQuoteIcon} />
                  <p className={cityPageStyles.testimonialQuote}>"{testimonial.quote}"</p>
                  <div>
                    <p className={cityPageStyles.testimonialAuthor}>{testimonial.author}</p>
                    <p className={cityPageStyles.testimonialLocation}>{testimonial.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Property Listings Preview */}
        <section className={cityPageStyles.section}>
          <h2 className={cityPageStyles.sectionTitle}>
            Featured Properties in {cityData.name}
          </h2>
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
              {featuredPropertiesRaw.listings.map((property: any) => (
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
          <div className={cityPageStyles.propertiesButtonContainer}>
            <Button asChild size="lg" className={cityPageStyles.propertiesViewAllButton}>
              <Link href={`/properties?location=${cityData.name}&searchLocationType=county`}>
                <Search className={cityPageStyles.propertiesSearchIcon} />
                View All Properties in {cityData.name}
              </Link>
            </Button>
          </div>
        </section>

        {/* FAQ Section */}
        <section className={cityPageStyles.whiteCard}>
          <h2 className={cityPageStyles.sectionTitle}>Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className={cityPageStyles.faqAccordion}>
            {cityData.faqs.map((faq, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className={cityPageStyles.faqTrigger}>
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className={cityPageStyles.faqContent}>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>
    </div>
  )
}

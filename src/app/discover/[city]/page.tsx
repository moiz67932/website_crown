import { getCityData } from "@/lib/city-data"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ArrowRight, Search, MapPin, StarIcon, MessageSquare } from "lucide-react"
import type { Metadata } from "next"
import { PropertyCard } from "@/components/property-card"
import { cn } from "@/lib/utils"

// Sample properties for the city - in a real app, this would be fetched
const sampleCityProperties = [
  {
    id: 201,
    title: "Charming Craftsman in North Park",
    price: "$1,250,000",
    location: "North Park, San Diego, CA",
    beds: 3,
    baths: 2,
    sqft: "1,800",
    image: "/placeholder.svg?height=300&width=400",
    type: "sale" as const,
    architecturalStyle: "Craftsman",
  },
  {
    id: 202,
    title: "Luxury Condo in Gaslamp Quarter",
    price: "$980,000",
    location: "Gaslamp, San Diego, CA",
    beds: 2,
    baths: 2,
    sqft: "1,500",
    image: "/placeholder.svg?height=300&width=400",
    type: "sale" as const,
    tags: ["City Views"],
  },
  {
    id: 203,
    title: "La Jolla Ocean View Home",
    price: "$5,800,000",
    location: "La Jolla, San Diego, CA",
    beds: 4,
    baths: 5,
    sqft: "4,500",
    image: "/placeholder.svg?height=300&width=400",
    type: "sale" as const,
    architecturalStyle: "Contemporary",
  },
]

interface CityPageProps {
  params: { city: string }
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const cityData = getCityData(params?.city)
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
    <div className="bg-brand-white/90 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-strong max-w-2xl mx-auto">
      <h3 className="text-2xl font-semibold text-brand-midnightCove mb-4 text-center">Find Your Home in {cityName}</h3>
      <form action="/buy" method="GET" className="flex flex-col sm:flex-row items-center gap-3">
        <input type="hidden" name="location" value={cityId} />
        <div className="relative w-full">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            name="keywords"
            placeholder={`e.g., "beachfront" or "3 bedroom" in ${cityName}`}
            className="pl-10 pr-3 py-3 text-base border-brand-silverMist/70 focus:ring-brand-pacificTeal focus:border-brand-pacificTeal w-full rounded-lg bg-white text-brand-graphitePeak"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto bg-brand-sunsetBlush hover:bg-brand-sunsetBlush/90 text-white px-8 py-3 rounded-lg"
        >
          <Search className="h-5 w-5 mr-2" />
          Search
        </Button>
      </form>
      <p className="text-xs text-gray-500 mt-3 text-center">
        Or{" "}
        <Link href="/buy" className="text-brand-pacificTeal hover:underline">
          browse all listings
        </Link>
        .
      </p>
    </div>
  )
}

export default function CityPage({ params }: CityPageProps) {
  const cityData = getCityData(params.city)

  if (!cityData) {
    notFound()
  }

  return (
    <div className="bg-brand-californiaSand min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] sm:min-h-[500px] flex items-center justify-center text-center text-white overflow-hidden">
        <Image
          src={cityData.heroImage || "/placeholder.svg"}
          alt={`Panoramic view of ${cityData.name}`}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 leading-tight font-heading text-brand-white shadow-text">
            {cityData.heroTitle}
          </h1>
          <p className="text-lg sm:text-xl text-gray-100 max-w-xl mx-auto shadow-text">{cityData.heroSubtitle}</p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-screen-xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        {/* Intro Text & Search Widget Section */}
        <section className="mb-12 sm:mb-16 grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
          <div className="lg:col-span-3 bg-brand-white p-6 sm:p-8 rounded-xl shadow-medium">
            <h2 className="text-3xl font-bold text-brand-midnightCove mb-4">Welcome to {cityData.name}</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{cityData.introText}</p>
          </div>
          <div className="lg:col-span-2">
            <CitySearchWidget cityName={cityData.name} cityId={cityData.id} />
          </div>
        </section>

        {/* Map Section */}
        <section className="mb-12 sm:mb-16">
          <h2 className="text-3xl font-bold text-brand-midnightCove mb-6 text-center">
            Explore {cityData.name} on the Map
          </h2>
          <div className="aspect-video bg-gray-200 rounded-xl shadow-medium flex items-center justify-center overflow-hidden">
            <Image
              src={cityData.mapPlaceholderImage || "/placeholder.svg"}
              alt={`Map of ${cityData.name}`}
              width={800}
              height={500}
              className="object-cover w-full h-full"
            />
          </div>
        </section>

        {/* Neighborhoods Section */}
        <section className="mb-12 sm:mb-16">
          <h2 className="text-3xl font-bold text-brand-midnightCove mb-8 text-center">
            Discover {cityData.name}'s Neighborhoods
          </h2>
          {cityData.neighborhoodCategories.map((category) => (
            <div key={category.name} className="mb-10">
              <h3 className="text-2xl font-semibold text-brand-graphitePeak mb-6 border-b-2 border-brand-goldenHour pb-2">
                {category.name}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {category.neighborhoods.map((hood) => (
                  <Link href={hood.href} key={hood.name} className="group block">
                    <div className="bg-brand-white rounded-xl shadow-medium overflow-hidden transition-all duration-300 hover:shadow-strong">
                      <div className="relative h-56">
                        <Image
                          src={hood.image || "/placeholder.svg?height=224&width=400&query=neighborhood+scene"}
                          alt={`View of ${hood.name}, ${cityData.name}`}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        <h4 className="absolute bottom-4 left-4 text-xl font-semibold text-brand-white font-heading">
                          {hood.name}
                        </h4>
                      </div>
                      <div className="p-5">
                        <p className="text-sm text-gray-600 mb-3 h-16 overflow-hidden text-ellipsis">
                          {hood.description}
                        </p>
                        <div className="inline-flex items-center text-brand-pacificTeal font-medium group-hover:underline">
                          Explore {hood.name}
                          <ArrowRight className="h-4 w-4 ml-1.5 transition-transform duration-200 group-hover:translate-x-1" />
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
          <section className="mb-12 sm:mb-16 bg-brand-white p-6 sm:p-8 rounded-xl shadow-medium">
            <h2 className="text-3xl font-bold text-brand-midnightCove mb-8 text-center">
              {cityData.name} Real Estate Market Snapshot
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {cityData.marketTrends.map((trend) => (
                <div key={trend.metric} className="bg-brand-californiaSand/50 p-5 rounded-lg text-center shadow-subtle">
                  <trend.icon className="h-10 w-10 mx-auto mb-3 text-brand-pacificTeal" />
                  <p className="text-2xl font-bold text-brand-graphitePeak">{trend.value}</p>
                  <p className="text-sm text-gray-600 mb-1">{trend.metric}</p>
                  {trend.change && (
                    <p
                      className={cn(
                        "text-xs font-semibold",
                        trend.changeType === "positive" ? "text-green-600" : "",
                        trend.changeType === "negative" ? "text-red-600" : "",
                        trend.changeType === "neutral" ? "text-gray-500" : "",
                      )}
                    >
                      {trend.change}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-6 text-center">
              Market data is illustrative. For up-to-date information, please contact one of our agents.
            </p>
          </section>
        )}

        {/* Facts Section */}
        <section className="mb-12 sm:mb-16 bg-brand-white p-6 sm:p-8 rounded-xl shadow-medium">
          <h2 className="text-3xl font-bold text-brand-midnightCove mb-8 text-center">
            Key Facts About {cityData.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cityData.facts.map((fact) => (
              <div key={fact.title} className="flex items-start p-4 bg-brand-californiaSand/50 rounded-lg">
                <fact.icon className="h-8 w-8 text-brand-pacificTeal mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-lg font-semibold text-brand-graphitePeak">{fact.title}</h4>
                  <p className="text-gray-700">{fact.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials Section NEW */}
        {cityData.testimonials && cityData.testimonials.length > 0 && (
          <section className="mb-12 sm:mb-16">
            <h2 className="text-3xl font-bold text-brand-midnightCove mb-10 text-center">
              Hear From Our {cityData.name} Clients
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {cityData.testimonials.map((testimonial, index) => (
                <div key={index} className="bg-brand-white p-6 rounded-xl shadow-medium flex flex-col">
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={cn(
                          "h-5 w-5",
                          i < testimonial.rating ? "text-brand-goldenHour fill-brand-goldenHour" : "text-gray-300",
                        )}
                      />
                    ))}
                  </div>
                  <MessageSquare className="h-8 w-8 text-brand-pacificTeal/30 mb-3" />
                  <p className="text-gray-600 italic mb-4 flex-grow">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold text-brand-graphitePeak">{testimonial.author}</p>
                    <p className="text-sm text-gray-500">{testimonial.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Property Listings Preview */}
        <section className="mb-12 sm:mb-16">
          <h2 className="text-3xl font-bold text-brand-midnightCove mb-8 text-center">
            Featured Properties in {cityData.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {sampleCityProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
          <div className="text-center mt-10">
            <Button asChild size="lg" className="bg-brand-sunsetBlush hover:bg-brand-sunsetBlush/90 text-white">
              <Link href={`/buy?location=${cityData.id}&city=${cityData.name}`}>
                <Search className="h-5 w-5 mr-2" />
                View All Properties in {cityData.name}
              </Link>
            </Button>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-brand-white p-6 sm:p-8 rounded-xl shadow-medium">
          <h2 className="text-3xl font-bold text-brand-midnightCove mb-8 text-center">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {cityData.faqs.map((faq, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-lg text-left hover:text-brand-pacificTeal text-brand-graphitePeak">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 leading-relaxed pt-2">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>
    </div>
  )
}

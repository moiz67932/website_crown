"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Bed,
  Bath,
  Square,
  MapPin,
  Heart,
  Share2,
  Calendar,
  Building,
  Maximize,
  CheckCircle,
  School,
  Utensils,
  TreePine,
  TrendingUp,
  Building2,
  Car,
  Eye,
} from "lucide-react"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { PropertyCard } from "@/components/property-card" // For Similar Properties
import { PropertyDetail, usePropertyDetail } from "@/hooks/queries/useGetDetailProperty"
import React from "react"
import Loading from "@/components/shared/loading"
import ContactForm from "@/components/contact-form"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@radix-ui/react-dropdown-menu"
import MortgageCalculatorModal from "./mortage-calculator-modal"
import PropertyMap from "./property-map"
import PropertyFAQ from "./property-faq"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"



// Function to generate JSON-LD structured data
const generatePropertyJsonLd = (property: PropertyDetail | undefined) => {
  const siteUrl = "https://www.crowncoastalhomes.com" // Replace with actual domain

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property?.seo_title,
    description: property?.public_remarks,
    image: property?.images.map((img) => `${siteUrl}${img}`), // Assuming images are relative paths
    url: `${siteUrl}/properties/${property?.address.replace(/ /g, "-")}/${property?.listing_key}`,
    datePosted: property?.on_market_timestamp,
    availability: "A",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/properties/${property?.address}/${property?.listing_key}`,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: property?.address.split(",")[0].trim(),
      addressLocality: property?.city,
      addressRegion: property?.county,
      postalCode: property?.postal_code,
      addressCountry: "US",
    },
    numberOfRooms: property?.bedrooms, // Approximation, schema has specific room types
    floorSize: {
      "@type": "QuantitativeValue",
      value: property?.living_area_sqft,
      unitCode: property?.lot_size_sqft ? "FTK" : "MTK", // FTK for square foot, MTK for square meter
    },
    yearBuilt: property?.year_built,
    realEstateAgent: {
      "@type": "RealEstateAgent",
      name: "Reza",
      telephone: "1 858-305-4362",
      email: "reza@crowncoastal.com",
      worksFor: {
        "@type": "RealEstateBroker",
        name: property?.list_office_name,
        // "url": siteUrl // URL of the brokerage
      },
    },
    offers: {
      "@type": "Offer",
      price: property?.list_price ? property.list_price : undefined,
      priceCurrency: "USD",
      availability: "A",
      seller: {
        "@type": "Organization", // Or Person if it's an individual seller represented by agent
        name: property?.list_office_name,
      },
    },
    // Additional potentially useful properties
    // "amenityFeature": property.features.map(feature => ({ "@type": "LocationFeatureSpecification", "name": feature })),
    // "geo": { "@type": "GeoCoordinates", "latitude": "34.0300", "longitude": "-118.7800" }, // Replace with actual coordinates
    // "propertyType": "SingleFamilyResidence" // Be more specific if possible
  }
}

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params)
  const { data: propertyData, isLoading, isError } = usePropertyDetail(unwrappedParams.id)
  const faqs = propertyData?.faq_content ? JSON.parse(propertyData.faq_content) : []
  const propertyJsonLd = generatePropertyJsonLd(propertyData)

  if (isLoading) {
    return (
      <Loading />
    )
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="text-red-500 text-lg">Error loading property</span>
      </div>
    )
  }

  if (!propertyData) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="text-gray-500 text-lg">Property not found</span>
      </div>
    )
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(propertyJsonLd) }} />
      <div className="bg-brand-californiaSand min-h-screen w-full pt-24">
        {/* Image Carousel */}
        <section className="relative bg-black">
          <Carousel className="w-full" opts={{ loop: true }}>
            <CarouselContent>
              {propertyData.images.map((src, index) => (
                <CarouselItem key={index}>
                  <div className="relative w-full h-[400px] sm:h-[500px] md:h-[650px]">
                    <Image
                      src={src || "/placeholder.svg"}
                      alt={`${propertyData.title} - View ${index + 1}`}
                      fill
                      className="object-cover"
                      priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                  </div>
                </CarouselItem>
              ))}
              {propertyData.images.length === 0 && (
                <CarouselItem>
                  <div className="relative w-full h-[400px] sm:h-[500px] md:h-[650px]">
                    <Image src="/luxury-modern-house-exterior.png" alt="Property Image" fill className="object-cover" />
                  </div>
                </CarouselItem>
              )}
            </CarouselContent>
            <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-brand-white/80 hover:bg-brand-white text-brand-midnightCove rounded-full" />
            <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-brand-white/80 hover:bg-brand-white text-brand-midnightCove rounded-full" />
          </Carousel>
          <Button
            variant="outline"
            size="icon"
            className="absolute top-4 right-4 z-10 bg-brand-white/80 hover:bg-brand-white text-brand-midnightCove rounded-full"
          >
            <Maximize className="h-5 w-5" />
            <span className="sr-only">View Fullscreen</span>
          </Button>
        </section>

        {/* Main Content Area */}
        <div className="max-w-screen-xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12">
            {/* Left Column: Property Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header Section */}
              <div className="bg-brand-white p-6 sm:p-8 rounded-xl shadow-medium">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
                  <div>
                    <Badge className="mb-2 bg-brand-sunsetBlush text-white px-3 py-1 text-sm rounded-full">
                      For {propertyData.property_type === "ResidentialLease" ? "Rent" : "Sale"}
                    </Badge>
                    <h1 className="text-3xl sm:text-4xl font-bold text-brand-midnightCove mb-1">
                      {propertyData.address}
                    </h1>
                    <div className="flex items-center text-gray-600 text-sm sm:text-base">
                      <MapPin className="h-4 w-4 mr-1.5 text-gray-500" />
                      {propertyData.city}, {propertyData.county}, CA, {propertyData.postal_code}
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4 sm:mt-0">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full border-brand-silverMist hover:bg-brand-californiaSand"
                    >
                      <Heart className="h-5 w-5 text-brand-sunsetBlush" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full border-brand-silverMist hover:bg-brand-californiaSand"
                    >
                      <Share2 className="h-5 w-5 text-brand-pacificTeal" />
                    </Button>
                  </div>
                </div>
                <div className="text-4xl sm:text-5xl font-bold text-brand-pacificTeal mb-2" itemProp="price">
                  {propertyData?.list_price ? `$${propertyData.list_price.toLocaleString()}` : "N/A"}
                </div>
                {propertyData?.list_price !== undefined && (
                  <div className="text-sm font-bold text-brand-pacificTeal/80 mb-4" itemProp="price">
                    Estimated payment ${Math.round(propertyData.list_price / 360).toLocaleString()}/month
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-center">
                  {[
                    { icon: Bed, label: "Bedrooms", value: propertyData.bedrooms },
                    { icon: Bath, label: "Bathrooms", value: propertyData.bathrooms },
                    { icon: Square, label: "Sq Ft", value: propertyData.living_area_sqft },
                    { icon: Building, label: "Lot Size", value: propertyData.lot_size_sqft },
                  ].map((item) => (
                    <div key={item.label} className="p-3 bg-[#F3E9D8] rounded-lg">
                      <item.icon className="h-6 w-6 mx-auto mb-1.5 text-brand-pacificTeal" />
                      <div className="text-sm font-semibold text-brand-graphitePeak">{item.value}</div>
                      <div className="text-xs text-gray-500">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description Section */}
              <div className="bg-brand-white p-6 sm:p-8 rounded-xl shadow-medium">
                <h2 className="text-2xl font-bold text-brand-midnightCove mb-4">Property Overview</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{propertyData.public_remarks}</p>
              </div>

              <div className="bg-brand-white p-8 sm:p-10 rounded-2xl shadow-lg">
                <h2 className="text-3xl font-extrabold text-brand-midnightCove mb-8 flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-brand-pacificTeal drop-shadow" />
                  Home Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                  <div className="flex flex-col items-center bg-gradient-to-br from-[#F3E9D8] to-[#E6F7F7] rounded-xl p-6 shadow transition hover:scale-105 hover:shadow-lg">
                    <Building2 className="h-7 w-7 text-brand-pacificTeal mb-2" />
                    <div className="text-xs text-gray-500">Home Type</div>
                    <div className="text-lg font-bold text-brand-graphitePeak">{propertyData.property_type}</div>
                    <div className="text-xs text-gray-500">{propertyData.property_sub_type}</div>
                  </div>
                  <div className="flex flex-col items-center bg-gradient-to-br from-[#F3E9D8] to-[#E6F7F7] rounded-xl p-6 shadow transition hover:scale-105 hover:shadow-lg">
                    <Calendar className="h-7 w-7 text-brand-pacificTeal mb-2" />
                    <div className="text-xs text-gray-500">Year Built</div>
                    <div className="text-lg font-bold text-brand-graphitePeak">{propertyData.year_built}</div>
                  </div>
                  <div className="flex flex-col items-center bg-gradient-to-br from-[#F3E9D8] to-[#E6F7F7] rounded-xl p-6 shadow transition hover:scale-105 hover:shadow-lg">
                    <Bed className="h-7 w-7 text-brand-pacificTeal mb-2" />
                    <div className="text-xs text-gray-500">Bedrooms</div>
                    <div className="text-lg font-bold text-brand-graphitePeak">{propertyData.bedrooms}</div>
                  </div>
                  <div className="flex flex-col items-center bg-gradient-to-br from-[#F3E9D8] to-[#E6F7F7] rounded-xl p-6 shadow transition hover:scale-105 hover:shadow-lg">
                    <Bath className="h-7 w-7 text-brand-pacificTeal mb-2" />
                    <div className="text-xs text-gray-500">Bathrooms</div>
                    <div className="text-lg font-bold text-brand-graphitePeak">{propertyData.bathrooms}</div>
                  </div>
                  <div className="flex flex-col items-center bg-gradient-to-br from-[#F3E9D8] to-[#E6F7F7] rounded-xl p-6 shadow transition hover:scale-105 hover:shadow-lg">
                    <Car className="h-7 w-7 text-brand-pacificTeal mb-2" />
                    <div className="text-xs text-gray-500">Parking</div>
                    <div className="text-lg font-bold text-brand-graphitePeak">{propertyData.parking_total ?? "N/A"} Parking</div>
                  </div>
                  <div className="flex flex-col items-center bg-gradient-to-br from-[#F3E9D8] to-[#E6F7F7] rounded-xl p-6 shadow transition hover:scale-105 hover:shadow-lg">
                    <School className="h-7 w-7 text-brand-pacificTeal mb-2" />
                    <div className="text-xs text-gray-500">School District</div>
                    <div className="text-lg font-bold text-brand-graphitePeak">{propertyData.other_info?.HighSchoolDistrict ?? "N/A"}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-[#F8F9FB] rounded-xl p-5 shadow-sm flex flex-col gap-2">
                    <h3 className="text-lg font-semibold text-brand-graphitePeak flex items-center gap-2 mb-1">
                      <Eye className="h-5 w-5 text-brand-pacificTeal" />
                      Property Views
                    </h3>
                    {propertyData.view ? propertyData.view.split(",").map((value: string, index: number) => (
                      <p key={index} className="text-gray-700">{value.trim()}</p>
                    )) : <p className="text-gray-700">N/A</p>}
                  </div>
                  <div className="bg-[#F8F9FB] rounded-xl p-5 shadow-sm flex flex-col gap-2">
                    <h3 className="text-lg font-semibold text-brand-graphitePeak flex items-center gap-2 mb-1">
                      <Building className="h-5 w-5 text-brand-pacificTeal" />
                      Listing Details
                    </h3>
                    <p className="text-gray-700">
                      MLS Status: <span className="font-semibold">{propertyData.mls_status}</span><br />
                      {(() => {
                        const dateNow = new Date();
                        const onMarketDate = new Date(propertyData.on_market_timestamp);
                        const timeDiff = dateNow.getTime() - onMarketDate.getTime();
                        const daysOnMarket = Math.floor(timeDiff / (1000 * 3600 * 24));

                        if (daysOnMarket < 1) {
                          const hoursOnMarket = Math.floor(timeDiff / (1000 * 3600));
                          return (
                            <>
                              Hours on Market: <span className="font-semibold">{hoursOnMarket} hours</span>
                            </>
                          );
                        } else {
                          return (
                            <>
                              Days on Market: <span className="font-semibold">{daysOnMarket} days</span>
                            </>
                          );
                        }
                      })()}
                    </p>
                  </div>
                  <div className="bg-[#F8F9FB] rounded-xl p-5 shadow-sm flex flex-col gap-2">
                    <h3 className="text-lg font-semibold text-brand-graphitePeak flex items-center gap-2 mb-1">
                      <Square className="h-5 w-5 text-brand-pacificTeal" />
                      Utilities
                    </h3>
                    {propertyData.heating && <p className="text-gray-700">{propertyData.heating}</p>}
                  </div>
                  <div className="bg-[#F8F9FB] rounded-xl p-5 shadow-sm flex flex-col gap-2 col-span-1 md:col-span-3">
                    <h3 className="text-lg font-semibold text-brand-graphitePeak flex items-center gap-2 mb-1">
                      <Bath className="h-5 w-5 text-brand-pacificTeal" />
                      Interior Spaces
                    </h3>
                    {propertyData.living_area_sqft && <p className="text-gray-700">{propertyData.living_area_sqft} Sq Ft Home</p>}
                    {propertyData.lot_size_sqft && <p className="text-gray-700">{propertyData.lot_size_sqft} Lot Size {propertyData.lot_size_sqft > 43560 ? "Acres" : "Sq Ft"}</p>}
                    {propertyData.stories && <p className="text-gray-700">{propertyData.stories}-Story Property</p>}
                    {propertyData.interior_features && <p className="text-gray-700">{propertyData.interior_features} Interior Features</p>}
                    {propertyData.pool_features && <p className="text-gray-700">{propertyData.pool_features} Pool</p>}
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-brand-midnightCove mb-6 flex items-center gap-2">
                  <Building2 className="h-7 w-7 text-brand-pacificTeal" />
                  Community Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="bg-[#F8F9FB] rounded-xl p-5 shadow-sm flex flex-col gap-2">
                    <h3 className="text-lg font-semibold text-brand-graphitePeak flex items-center gap-2 mb-1">
                      <Building2 className="h-5 w-5 text-brand-pacificTeal" />
                      Overview
                    </h3>
                    <p className="text-gray-700">{propertyData.subdivision_name || "N/A"}</p>
                  </div>
                  <div className="bg-[#F8F9FB] rounded-xl p-5 shadow-sm flex flex-col gap-2">
                    <h3 className="text-lg font-semibold text-brand-graphitePeak flex items-center gap-2 mb-1">
                      <Utensils className="h-5 w-5 text-brand-pacificTeal" />
                      Local Amenities
                    </h3>
                    {propertyData.other_info?.CommunityFeatures?.split(",").map((value: string, index: number) => (
                      <p key={index} className="text-gray-700">{value.trim()}</p>
                    )) || <p className="text-gray-700">N/A</p>}
                  </div>
                  <div className="bg-[#F8F9FB] rounded-xl p-5 shadow-sm flex flex-col gap-2">
                    <h3 className="text-lg font-semibold text-brand-graphitePeak flex items-center gap-2 mb-1">
                      <TreePine className="h-5 w-5 text-brand-pacificTeal" />
                      Recreation
                    </h3>
                    <p className="text-gray-700">{propertyData.other_info?.RecreationFeatures || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Features Section */}
              {/* <div className="bg-brand-white p-6 sm:p-8 rounded-xl shadow-medium">
                <h2 className="text-2xl font-bold text-brand-midnightCove mb-6">Features & Amenities</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                  {propertyData.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <CheckCircle className="h-5 w-5 mr-2.5 text-brand-pacificTeal flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div> */}

              {/* Map Section (Placeholder) */}
              <div className="bg-brand-white p-6 sm:p-8 rounded-xl shadow-medium">
                <h2 className="text-2xl font-bold text-brand-midnightCove mb-4">Location</h2>
                {propertyData.latitude && propertyData.longitude && (
                  <PropertyMap location={{ lat: propertyData.latitude, lng: propertyData.longitude }} address={propertyData.address} />
                )}
              </div>

              {/* Neighborhood Information Section (New) */}
              {/* <div className="bg-brand-white p-6 sm:p-8 rounded-xl shadow-medium">
                <h2 className="text-2xl font-bold text-brand-midnightCove mb-6">
                  Neighborhood Insights: {propertyData.city}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-brand-graphitePeak mb-3 flex items-center">
                      <School className="h-5 w-5 mr-2 text-brand-pacificTeal" /> Local Schools
                    </h3>
                    <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                      <li>Malibu High School (Rated 9/10) - 2 miles</li>
                      <li>Webster Elementary (Rated 8/10) - 1.5 miles</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-brand-graphitePeak mb-3 flex items-center">
                      <Utensils className="h-5 w-5 mr-2 text-brand-pacificTeal" /> Nearby Amenities
                    </h3>
                    <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                      <li>Nobu Malibu - 5 min drive</li>
                      <li>Malibu Country Mart - 7 min drive</li>
                      <li>Zuma Beach - 10 min drive</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-brand-graphitePeak mb-3 flex items-center">
                      <TreePine className="h-5 w-5 mr-2 text-brand-pacificTeal" /> Parks & Recreation
                    </h3>
                    <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                      <li>Solstice Canyon Park - 3 miles</li>
                      <li>Point Dume Nature Preserve - 4 miles</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-brand-graphitePeak mb-3 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-brand-pacificTeal" /> Market Trends
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Average home price in {propertyData.city}: $3.5M.
                      <br />
                      Year-over-year appreciation: +8%.
                    </p>
                  </div>
                </div>
                <Button variant="link" className="text-brand-pacificTeal hover:text-brand-midnightCove mt-4 px-0">
                  Learn more about {propertyData.city} &rarr;
                </Button>
              </div> */}
              <Card className="mb-6 sm:p-8 rounded-xl shadow-medium space-y-6" >
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Mortgage Calculator</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Home Price</p>
                      <div className="font-medium">${propertyData.list_price.toLocaleString()}</div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Down Payment (20%)</p>
                      <div className="font-medium">${(propertyData.list_price * 0.2).toLocaleString()}</div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Loan Amount</p>
                      <div className="font-medium">${(propertyData.list_price * 0.8).toLocaleString()}</div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Estimated Monthly Payment</p>
                      <div className="font-medium">${Math.round(propertyData.list_price / 360).toLocaleString()}/month</div>
                    </div>
                    <MortgageCalculatorModal
                      propertyPrice={propertyData.list_price}
                      propertyTaxRate={0.0125}
                      insuranceRate={0.0035}
                      hoaFees={0.05}
                      buttonText="Full Calculator"
                    />
                  </div>
                </CardContent>
              </Card>

              {faqs && faqs.length > 0 && (
                <div className="bg-brand-white p-6 sm:p-8 rounded-xl shadow-medium">
                  <PropertyFAQ
                    faqs={faqs}
                    propertyType={propertyData.property_type}
                    propertyAddress={propertyData.address}
                  />
                </div>
              )}
            </div>


            {/* Right Column: Agent Contact & Actions */}
            <div className="lg:col-span-1">
              {/* <div className="sticky top-24 bg-brand-white p-6 sm:p-8 rounded-xl shadow-medium space-y-6">
                <div className="text-center">
                  <Image
                    src={"/placeholder.svg"}
                    alt={propertyData.list_agent_full_name}
                    width={100}
                    height={100}
                    className="rounded-full mx-auto mb-3 border-4 border-brand-californiaSand"
                  />
                  <h3 className="text-xl font-bold text-brand-midnightCove">{propertyData.agent.name}</h3>
                  <p className="text-sm text-gray-500">{propertyData.agent.title}</p>
                </div>

                <div className="space-y-3">
                  <Button size="lg" className="w-full bg-brand-sunsetBlush hover:bg-brand-sunsetBlush/90 text-white">
                    <Calendar className="h-5 w-5 mr-2" />
                    Schedule a Tour
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-brand-pacificTeal text-brand-pacificTeal hover:bg-brand-pacificTeal/10"
                  >
                    Request Information
                  </Button>
                </div>

                <div className="text-sm text-gray-600 space-y-2 pt-4 border-t border-brand-silverMist/50">
                  <p>
                    <strong>Direct Contact:</strong>
                  </p>
                  <p>
                    📞{" "}
                    <a href={`tel:${propertyData.agent.phone}`} className="hover:text-brand-pacificTeal">
                      {propertyData.agent.phone}
                    </a>
                  </p>
                  <p>
                    ✉️{" "}
                    <a href={`mailto:${propertyData.agent.email}`} className="hover:text-brand-pacificTeal">
                      {propertyData.agent.email}
                    </a>
                  </p>
                </div>

                <div className="text-xs text-gray-500 text-center pt-4">
                  Listing ID: CCH-{propertyData.id.toString().padStart(5, "0")}
                </div>
              </div> */}
              <Card className="sticky mb-6 top-24 bg-brand-white sm:p-8 rounded-xl shadow-medium space-y-6" >
                <CardContent>
                  <div className="mb-4">
                    <h3 className="font-semibold">Contact the Crown Coastal Team</h3>
                  </div>

                  <Separator className="my-4" />
                  <ContactForm propertyId={propertyData.listing_key} proertyData={propertyData} />
                </CardContent>
                <div className="mt-6  border border-gray-100 rounded-lg bg-gray-50/50 p-4">
                <p className="text-sm text-muted-foreground mb-3">Listing Agent</p>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name: </span>
                    <span itemProp="agent">{propertyData.list_agent_full_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone: </span>
                    <span>{propertyData.list_agent_phone}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email: </span>
                    <span>{propertyData.list_agent_email}</span>
                  </div>
                </div>
              </div>
              </Card>
            </div>
          </div>

          {/* Similar Properties Section (New) */}
          {/* <div className="mt-12 pt-8 border-t border-brand-silverMist/50">
            <h2 className="text-3xl font-bold text-brand-midnightCove mb-8 text-center">You Might Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {similarProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </div> */}
        </div>
      </div>
    </>
  )
}

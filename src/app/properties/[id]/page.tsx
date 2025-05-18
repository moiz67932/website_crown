"use client"
import Link from "next/link"
import type { Metadata } from "next"
import { MapPin, Bed, Bath, Maximize, Calendar, Heart, Share2, ArrowRight } from "lucide-react"
import Script from "next/script"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import PropertyGallery from "./property-gallery"
import PropertyMap from "./property-map"
import ContactForm from "./contact-form"
import SimilarProperties from "./similar-properties"
import StreetViewButton from "./street-view-button"
import { usePropertyDetail } from "@/hooks/queries/useGetDetailProperty"
import React from "react"



// Dynamic metadata generation for SEO
// export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
//   const { data: property } = usePropertyDetail(params.id)

//   return {
//     title: `${property?.address || "Property"} | Luxury Real Estate in ${property?.city || "Unknown Location"}`,
//     description: property?.public_remarks?.substring(0, 160) || "No description available",
//     openGraph: {
//       title: `${property?.address} | Luxury Real Estate`,
//       description: property?.public_remarks?.substring(0, 160),
//       images: [
//         {
//           url: property?.main_image_url || "",
//           width: 1200,
//           height: 630,
//           alt: property?.address || "Property Image",
//         },
//       ],
//       locale: "en_US",
//       type: "website",
//     },
//     twitter: {
//       card: "summary_large_image",
//       title: property?.address || "Property",
//       description: property?.public_remarks?.substring(0, 160),
//       images: [property?.main_image_url || ""],
//     },
//     alternates: {
//       canonical: `/properties/${params.id}`,
//     },
//     keywords: `luxury real estate, ${property?.property_type.toLowerCase()}, ${property?.subdivision_name || "Unknown Subdivision"}, ${property?.city || "Unknown City"}, ocean view property, luxury villa`,
//   }
// }
export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params)
  const { data: property , isLoading, isError} = usePropertyDetail(unwrappedParams.id)
  // Structured data for real estate listing (JSON-LD)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property?.address || "Unknown Address",
    description: property?.public_remarks || "No description available",
    image: property?.main_image_url || [],
    url: `/properties/${unwrappedParams.id}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: property?.address.split(",")[0].trim(),
      // addressLocality: property?.address.split(",")[1].trim(),
      // addressRegion: property?.address.split(",")[2].trim().split(" ")[0],
      postalCode: property?.postal_code,
      addressCountry: "US",
    },
    numberOfRooms: property?.bedrooms,
    numberOfBathroomsTotal: property?.bathrooms,
    floorSize: {
      "@type": "QuantitativeValue",
      value: property?.living_area_sqft,
      unitCode: "FTK",
    },
    price: property?.list_price,
    priceCurrency: "USD",
    offers: {
      "@type": "Offer",
      price: property?.list_price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    yearBuilt: property?.year_built,
    amenityFeature: property?.LotFeatures?.map((feature) => ({
      "@type": "LocationFeatureSpecification",
      name: feature,
    })),
    geo: {
      "@type": "GeoCoordinates",
      latitude: property?.latitude,
      longitude: property?.longitude,
    },
  }

  // Breadcrumb structured data
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Properties",
        item: "/properties",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: property?.address || "Unknown Address",
        item: `/properties/${unwrappedParams.id}`,
      },
    ],
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
        <span className="ml-4 text-lg">Loading...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="text-red-500 text-lg">Error loading property</span>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="text-gray-500 text-lg">Property not found</span>
      </div>
    )
  }

  return (
    <>
      <Script id="property-structured-data" type="application/ld+json">
        {JSON.stringify(structuredData)}
      </Script>
      <Script id="breadcrumb-structured-data" type="application/ld+json">
        {JSON.stringify(breadcrumbData)}
      </Script>

      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb - Enhanced with structured data attributes */}
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol
            className="flex items-center text-sm text-muted-foreground"
            itemScope
            itemType="https://schema.org/BreadcrumbList"
          >
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link href="/" className="hover:text-primary" itemProp="item">
                <span itemProp="name">Home</span>
              </Link>
              <meta itemProp="position" content="1" />
            </li>
            <span className="mx-2">/</span>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link href="/properties" className="hover:text-primary" itemProp="item">
                <span itemProp="name">Properties</span>
              </Link>
              <meta itemProp="position" content="2" />
            </li>
            <span className="mx-2">/</span>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem" className="text-foreground">
              <span itemProp="name">{property?.address || "Unknown Address"}</span>
              <meta itemProp="position" content="3" />
            </li>
          </ol>
        </nav>

        {/* Property Header */}
        <article itemScope itemType="https://schema.org/RealEstateListing">
          <meta itemProp="name" content={property?.address || "Unknown Address"} />
          <meta itemProp="description" content={property?.public_remarks || "No description available"} />
          <meta itemProp="price" content={property?.list_price.toString()} />
          <meta itemProp="priceCurrency" content="USD" />

          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200">
                  {property?.standard_status}
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">
                  New Listing
                </Badge>
              </div>
              <h1 className="text-3xl font-bold mb-2" itemProp="name">
                {property?.address}
              </h1>
              <div className="flex items-center text-muted-foreground mb-2">
                <MapPin className="h-4 w-4 mr-1" />
                <span itemProp="address">{property?.address}</span>
              </div>
              <div className="flex flex-wrap gap-4 mt-3">
                <div className="flex items-center">
                  <Bed className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>
                    <strong itemProp="numberOfRooms">{property?.bedrooms}</strong> Beds
                  </span>
                </div>
                <div className="flex items-center">
                  <Bath className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>
                    <strong itemProp="numberOfBathroomsTotal">{property?.bathrooms}</strong> Baths
                  </span>
                </div>
                <div className="flex items-center">
                  <Maximize className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>
                    <strong itemProp="floorSize">{property?.living_area_sqft.toLocaleString()}</strong> Sq Ft
                  </span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>
                    Built <strong itemProp="yearBuilt">{property?.year_built}</strong>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-3xl font-bold text-primary" itemProp="price">
                ${property?.list_price.toLocaleString()}
              </div>
              {property?.list_price !== undefined && (
                <div className="text-sm text-muted-foreground">
                  Est. ${Math.round(property.list_price / 360).toLocaleString()}/mo
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="icon" aria-label="Add to favorites">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" aria-label="Share property">
                  <Share2 className="h-5 w-5" />
                </Button>
                {property && (
                  <StreetViewButton 
                    property={{
                      latitude: property.latitude,
                      longitude: property.longitude,
                      address: property.address
                    }} 
                  />
                )}
              </div>
            </div>
          </div>

          {/* Property Gallery */}
          <PropertyGallery images={property?.images || []} />

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2">
              <Tabs defaultValue="details">
                <TabsList className="mb-6">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                  <TabsTrigger value="location">Location</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold mb-4">Property Description</h2>
                      <p className="text-muted-foreground leading-relaxed" itemProp="description">
                        {property?.public_remarks}
                      </p>

                      <h3 className="text-lg font-semibold mt-6 mb-3">Property Details</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Property Type</p>
                          <p className="font-medium" itemProp="propertyType">
                            {property?.property_type}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Year Built</p>
                          <p className="font-medium" itemProp="yearBuilt">
                            {property?.year_built}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Lot Size</p>
                          <p className="font-medium">0.5 Acres</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Heating</p>
                          <p className="font-medium">Central</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Cooling</p>
                          <p className="font-medium">Central A/C</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Parking</p>
                          <p className="font-medium">2-Car Garage</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="features" className="space-y-6">
                  {/* <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold mb-4">Property Features</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {property.features.map((feature, index) => (
                          <div key={index} className="flex items-center" itemProp="amenityFeature">
                            <div className="h-2 w-2 rounded-full bg-primary mr-2"></div>
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card> */}
                </TabsContent>

                <TabsContent value="location">
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold mb-4">Location</h2>
                      <div itemProp="geo" itemScope itemType="https://schema.org/GeoCoordinates">
                        <meta itemProp="latitude" content={property?.latitude.toString()} />
                        <meta itemProp="longitude" content={property?.longitude.toString()} />
                        <PropertyMap location={{
                          lat: property?.latitude ?? 0,
                          lng: property?.longitude ?? 0
                        }} address={property?.address ?? ''} />
                      </div>

                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-3">Nearby Amenities</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium">Schools</h4>
                            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                              <li>Malibu Elementary School (0.8 miles)</li>
                              <li>Malibu Middle School (1.2 miles)</li>
                              <li>Malibu High School (1.5 miles)</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium">Transportation</h4>
                            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                              <li>Pacific Coast Highway (0.3 miles)</li>
                              <li>Bus Stop (0.4 miles)</li>
                              <li>Santa Monica Airport (15 miles)</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div>
              {/* Agent Contact Card */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="font-semibold">Contact the Crown Coastal Team</h3>
                  </div>
                  <Separator className="my-4" />
                  <ContactForm agentEmail={property?.list_agent_email ?? ''} propertyId={property?._id ?? ''} />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Mortgage Calculator</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Home Price</p>
                      <div className="font-medium">${property?.list_price.toLocaleString()}</div>
                    </div>
                    {/* <div>
                      <p className="text-sm text-muted-foreground mb-1">Down Payment (20%)</p>
                      <div className="font-medium">${(property?.list_price * 0.2).toLocaleString()}</div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Loan Amount</p>
                      <div className="font-medium">${(property?.list_price * 0.8).toLocaleString()}</div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Estimated Monthly Payment</p>
                      <div className="font-medium">${Math.round(property?.list_price / 360).toLocaleString()}/month</div>
                    </div> */}
                    <Button className="w-full">Full Calculator</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Listing Agent Information - Subtle Version */}
              <div className="mt-6 border border-gray-100 rounded-lg bg-gray-50/50 p-4">
                <p className="text-sm text-muted-foreground mb-3">Listing Agent</p>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name: </span>
                    <span itemProp="agent">{property?.list_agent_full_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone: </span>
                    <span>{property?.list_agent_phone}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email: </span>
                    <span>{property?.list_agent_email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Similar Properties */}
          {/* <section className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Similar Properties</h2>
              <Link href="/properties" className="text-primary flex items-center hover:underline">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <SimilarProperties currentPropertyId={property?._id} />
          </section> */}
        </article>
      </main>
    </>
  )
}

"use client"
import Link from "next/link"
import type { Metadata } from "next"
import ReactMarkdown from 'react-markdown';

import { MapPin, Bed, Bath, Maximize, Calendar, Heart, Share2, ArrowRight } from "lucide-react"
import Script from "next/script"
import React, { useState } from "react"

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
import PropertyFAQ from "./property-faq"
import MortgageCalculatorModal from "./mortage-calculator-modal"
import Loading from "@/components/shared/loading"

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params)
  const { data: property, isLoading, isError } = usePropertyDetail(unwrappedParams.id)
  const faqs = property?.faq_content ? JSON.parse(property.faq_content) : []
  const [drawnShape, setDrawnShape] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property?.seo_title || "Unknown Address",
    description: property?.meta_description || "No description available",
    image: property?.images[0] || [],
    url: `/properties/${unwrappedParams.id}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: property?.address.split(",")[0].trim(),
      postalCode: property?.postal_code,
      addressCountry: "US",
    },
    numberOfRooms: property?.bedrooms,
    numberOfBathroomsTotal: property?.bathrooms,
    floorSize: {
      "@type": "QuantitativeValue",
      value: property?.living_area_sqft ?? property?.lot_size_sqft,
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

      <main className="container mx-auto px-4 py-8 pt-24">
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
              <span itemProp="name">{property?.title || property?.address || "Unknown Address"}</span>
              <meta itemProp="position" content="3" />
            </li>
          </ol>
        </nav>

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
                  <span itemProp="address">{property?.city}</span>
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
                    <strong itemProp="floorSize">{property?.living_area_sqft ?? property?.lot_size_sqft}</strong> Sq Ft
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

          <PropertyGallery images={property?.images || []} />

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
                          <p className="font-medium">{property?.lot_size_sqft} Sq Ft</p>
                        </div>
                      </div>
                      {faqs && faqs.length > 0 && (
                      <PropertyFAQ
                        faqs={faqs}
                        propertyType={property.property_type}
                          propertyAddress={property.address}
                        />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="features" className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold mb-4">Features</h2>
                      <p className="text-muted-foreground leading-relaxed" itemProp="description">
                      <ReactMarkdown>{property?.amenities_content}</ReactMarkdown>

                      </p>
                    </CardContent>
                  </Card>
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
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div>
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="font-semibold">Contact the Crown Coastal Team</h3>
                  </div>
                  <Separator className="my-4" />
                  <ContactForm propertyId={property?.listing_key ?? ''} proertyData={property} />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Mortgage Calculator</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Home Price</p>
                      <div className="font-medium">${property.list_price.toLocaleString()}</div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Down Payment (20%)</p>
                      <div className="font-medium">${(property.list_price * 0.2).toLocaleString()}</div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Loan Amount</p>
                      <div className="font-medium">${(property.list_price * 0.8).toLocaleString()}</div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Estimated Monthly Payment</p>
                      <div className="font-medium">${Math.round(property.list_price / 360).toLocaleString()}/month</div>
                    </div>
                    <MortgageCalculatorModal
                      propertyPrice={property.list_price}
                      propertyTaxRate={0.0125}
                      insuranceRate={0.0035}
                      hoaFees={0.05}
                      buttonText="Full Calculator"
                    />
                  </div>
                </CardContent>
              </Card>

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
        </article>
      </main>
    </>
  )
}

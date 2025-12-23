"use client"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import ReactMarkdown from 'react-markdown';

import { MapPin, Bed, Bath, Maximize, Calendar, Heart, Share2, ArrowRight, Square, Building, Building2, Car, Eye, School, Utensils, TreePine, TrendingUp, CheckCircle } from "lucide-react"
import Script from "next/script"
import React, { useState } from "react"
import dynamic from "next/dynamic"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import PropertyGallery from "./property-gallery"
import ContactForm from "../../../../components/contact-form"
import SimilarProperties from "./similar-properties"
import StreetViewButton from "./street-view-button"
import { PropertyDetail, usePropertyDetail } from "@/hooks/queries/useGetDetailProperty"
import PropertyFAQ from "./property-faq"
import MortgageCalculatorModal from "./mortage-calculator-modal"
import Loading from "@/components/shared/loading"

// Dynamic import for PropertyMap to avoid SSR issues with Leaflet
const PropertyMap = dynamic(() => import("./property-map"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center animate-pulse">
      <div className="text-center">
        <div className="w-12 h-12 bg-primary-500 rounded-xl mx-auto mb-4 animate-spin flex items-center justify-center">
          <MapPin className="h-6 w-6 text-white" />
        </div>
        <p className="text-neutral-600 dark:text-neutral-400 font-medium">Loading Interactive Map...</p>
      </div>
    </div>
  )
})

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

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 lg:gap-12 mt-8">
            <div className="space-y-10">
              {/* Property Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
                <div className="glass-card p-6 rounded-2xl text-center hover-lift bg-white dark:bg-slate-800 shadow-md border border-neutral-200/50 dark:border-slate-700/50">
                  <Bed className="h-8 w-8 text-primary mx-auto mb-3" />
                  <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{property?.bedrooms ?? 'N/A'}</div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">Bedrooms</div>
                </div>
                <div className="glass-card p-6 rounded-2xl text-center hover-lift bg-white dark:bg-slate-800 shadow-md border border-neutral-200/50 dark:border-slate-700/50">
                  <Bath className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{property?.bathrooms ?? 'N/A'}</div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">Bathrooms</div>
                </div>
                <div className="glass-card p-6 rounded-2xl text-center hover-lift bg-white dark:bg-slate-800 shadow-md border border-neutral-200/50 dark:border-slate-700/50">
                  <Square className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{property?.living_area_sqft ? property.living_area_sqft.toLocaleString() : 'N/A'}</div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">Sq Ft</div>
                </div>
                <div className="glass-card p-6 rounded-2xl text-center hover-lift bg-white dark:bg-slate-800 shadow-md border border-neutral-200/50 dark:border-slate-700/50">
                  <Calendar className="h-8 w-8 text-green-500 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{property?.year_built}</div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">Built</div>
                </div>
              </div>

              {/* Property Overview */}
              <div className="glass-card p-8 rounded-3xl bg-white dark:bg-slate-800 shadow-md border border-neutral-200/50 dark:border-slate-700/50">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6 flex items-center gap-3">
                  <Building2 className="h-7 w-7 text-primary" />
                  Property Overview
                </h2>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line" itemProp="description">
                    {property?.public_remarks || 'This beautiful property offers modern living with exceptional features and prime location.'}
                  </p>
                </div>
                {property?.list_price !== undefined && (
                  <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-blue-500/10 dark:from-primary/20 dark:to-blue-500/20 rounded-2xl border border-primary/20 dark:border-primary/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Estimated monthly payment</div>
                        <div className="text-2xl font-bold text-primary dark:text-primary">${Math.round(property.list_price / 360).toLocaleString()}/month</div>
                      </div>
                      <TrendingUp className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>
                )}
              </div>

              {/* Home Details */}
              <div className="glass-card p-8 rounded-3xl bg-white dark:bg-slate-800 shadow-md border border-neutral-200/50 dark:border-slate-700/50">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-8 flex items-center gap-3">
                  <Building2 className="h-7 w-7 text-primary" />
                  Home Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30 rounded-2xl p-6 text-center hover-lift transition-all duration-300 min-h-[140px] flex flex-col justify-center">
                    <Building2 className="h-8 w-8 text-primary mx-auto mb-3" />
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Home Type</div>
                    <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100 leading-tight">{property?.property_type}</div>
                    {property?.property_sub_type && <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{property.property_sub_type}</div>}
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 text-center hover-lift transition-all duration-300 min-h-[140px] flex flex-col justify-center">
                    <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Year Built</div>
                    <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{property?.year_built || 'N/A'}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{property?.year_built && `${new Date().getFullYear() - property.year_built} years old`}</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 text-center hover-lift transition-all duration-300 min-h-[140px] flex flex-col justify-center">
                    <Car className="h-8 w-8 text-green-500 mx-auto mb-3" />
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Parking Spaces</div>
                    <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{property?.parking_total ?? 'N/A'}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{property?.parking_total ? 'vehicles' : 'info not available'}</div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-2xl p-6 text-center hover-lift transition-all duration-300 min-h-[140px] flex flex-col justify-center">
                    <Square className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Lot Size</div>
                    <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{property?.lot_size_sqft?.toLocaleString() || 'N/A'}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{property?.lot_size_sqft && property.lot_size_sqft > 43560 ? 'acres' : 'square feet'}</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 text-center hover-lift transition-all duration-300 min-h-[140px] flex flex-col justify-center">
                    <School className="h-8 w-8 text-purple-500 mx-auto mb-3" />
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">School District</div>
                    <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100 leading-tight">{property?.other_info?.HighSchoolDistrict || 'N/A'}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">public schools</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl p-6 text-center hover-lift transition-all duration-300 min-h-[140px] flex flex-col justify-center">
                    <TrendingUp className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Days on Market</div>
                    <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{property?.days_on_market || 'N/A'}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{property?.days_on_market && property.days_on_market < 30 ? 'recently listed' : 'established listing'}</div>
                  </div>
                </div>

                {/* Property Views, Listing Details, Utilities */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                  <div className="glass-card p-6 rounded-2xl hover-lift bg-neutral-50 dark:bg-slate-700/50">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-4"><Eye className="h-5 w-5 text-primary" />Property Views</h3>
                    <div className="space-y-2">
                      {property?.view ? property.view.split(',').map((v: string, i: number) => <p key={i} className="text-neutral-700 dark:text-neutral-300 text-sm">{v.trim()}</p>) : <p className="text-neutral-600 dark:text-neutral-400 text-sm italic">No specific views listed</p>}
                    </div>
                  </div>
                  <div className="glass-card p-6 rounded-2xl hover-lift bg-neutral-50 dark:bg-slate-700/50">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-4"><Building className="h-5 w-5 text-blue-500" />Listing Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-neutral-600 dark:text-neutral-400">MLS Status:</span><span className="font-semibold text-neutral-900 dark:text-neutral-100">{property?.mls_status}</span></div>
                      <div className="flex justify-between"><span className="text-neutral-600 dark:text-neutral-400">Days on Market:</span><span className="font-semibold text-neutral-900 dark:text-neutral-100">{property?.days_on_market || 'N/A'}</span></div>
                    </div>
                  </div>
                  <div className="glass-card p-6 rounded-2xl hover-lift bg-neutral-50 dark:bg-slate-700/50">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-4"><Square className="h-5 w-5 text-amber-500" />Utilities & Systems</h3>
                    <div className="space-y-2">{property?.heating ? <p className="text-neutral-700 dark:text-neutral-300 text-sm">{property.heating}</p> : <p className="text-neutral-600 dark:text-neutral-400 text-sm italic">Utility details not available</p>}</div>
                  </div>
                </div>
              </div>

              {/* Interior Spaces & Features */}
              <div className="glass-card p-8 rounded-3xl bg-white dark:bg-slate-800 shadow-md border border-neutral-200/50 dark:border-slate-700/50">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3 mb-6"><Bath className="h-7 w-7 text-primary" />Interior Spaces & Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {property?.living_area_sqft && property.living_area_sqft > 0 && <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30 rounded-xl"><div className="text-2xl font-bold text-primary dark:text-primary">{property.living_area_sqft.toLocaleString()}</div><div className="text-sm text-neutral-600 dark:text-neutral-400">Sq Ft Living</div></div>}
                  {property?.lot_size_sqft && <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl"><div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{property.lot_size_sqft.toLocaleString()}</div><div className="text-sm text-neutral-600 dark:text-neutral-400">Lot Size {property.lot_size_sqft > 43560 ? 'Acres' : 'Sq Ft'}</div></div>}
                  {property?.stories && <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl"><div className="text-2xl font-bold text-green-600 dark:text-green-400">{property.stories}</div><div className="text-sm text-neutral-600 dark:text-neutral-400">Stories</div></div>}
                  {property?.pool_features && <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl"><div className="text-lg font-bold text-blue-600 dark:text-blue-400">Pool</div><div className="text-sm text-neutral-600 dark:text-neutral-400">Features</div></div>}
                </div>
                {property?.interior_features && <div className="mt-6 p-4 bg-neutral-50 dark:bg-slate-800/50 rounded-2xl"><h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Interior Features</h4><p className="text-neutral-700 dark:text-neutral-300 text-sm">{property.interior_features}</p></div>}
              </div>

              {/* Community & Neighborhood */}
              <div className="glass-card p-8 rounded-3xl bg-white dark:bg-slate-800 shadow-md border border-neutral-200/50 dark:border-slate-700/50">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-8 flex items-center gap-3"><Building2 className="h-7 w-7 text-primary" />Community & Neighborhood</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30 rounded-2xl p-6 text-center hover-lift"><Building2 className="h-8 w-8 text-primary mx-auto mb-4" /><h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Subdivision</h3><p className="text-neutral-700 dark:text-neutral-300">{property?.subdivision_name || 'No subdivision info'}</p></div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 text-center hover-lift"><Utensils className="h-8 w-8 text-blue-500 mx-auto mb-4" /><h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Amenities</h3><div className="space-y-1">{property?.other_info?.CommunityFeatures?.split(',').map((v: string, i: number) => <p key={i} className="text-neutral-700 dark:text-neutral-300 text-sm">{v.trim()}</p>) || <p className="text-neutral-600 dark:text-neutral-400 text-sm italic">No specific amenities listed</p>}</div></div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 text-center hover-lift"><TreePine className="h-8 w-8 text-green-500 mx-auto mb-4" /><h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Recreation</h3><p className="text-neutral-700 dark:text-neutral-300 text-sm">{property?.other_info?.RecreationFeatures || 'Recreation info not available'}</p></div>
                </div>
              </div>

              {/* Location & Neighborhood */}
              <div className="glass-card p-8 rounded-3xl bg-white dark:bg-slate-800 shadow-md border border-neutral-200/50 dark:border-slate-700/50">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6 flex items-center gap-3"><MapPin className="h-7 w-7 text-primary" />Location & Neighborhood</h2>
                {property?.latitude && property?.longitude ? (
                  <div className="space-y-4" itemProp="geo" itemScope itemType="https://schema.org/GeoCoordinates">
                    <meta itemProp="latitude" content={property?.latitude.toString()} />
                    <meta itemProp="longitude" content={property?.longitude.toString()} />
                    <div className="h-96 rounded-2xl overflow-hidden border border-neutral-200/50 dark:border-slate-700/50 relative">
                      <PropertyMap location={{ lat: property?.latitude, lng: property?.longitude }} address={property?.address} />
                    </div>
                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => window.open(`https://www.google.com/maps?q=${property?.latitude},${property?.longitude}`, '_blank')} className="flex-1 border-neutral-200 dark:border-slate-600 hover:bg-primary/10 dark:hover:bg-primary/20"><MapPin className="h-4 w-4 mr-2" />Open in Google Maps</Button>
                      <Button variant="outline" onClick={() => window.open(`http://maps.apple.com/?q=${property?.latitude},${property?.longitude}`, '_blank')} className="flex-1 border-neutral-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"><MapPin className="h-4 w-4 mr-2" />Open in Apple Maps</Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-96 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 text-neutral-400 dark:text-neutral-500 mx-auto mb-4" />
                      <p className="text-neutral-600 dark:text-neutral-400 font-medium">Location data not available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* FAQ Section */}
              {faqs && faqs.length > 0 && (
                <div className="glass-card p-8 rounded-3xl bg-white dark:bg-slate-800 shadow-md border border-neutral-200/50 dark:border-slate-700/50">
                  <PropertyFAQ faqs={faqs} propertyType={property.property_type} propertyAddress={property.address} />
                </div>
              )}
            </div>

            <div>
              <div className="space-y-6 lg:sticky lg:top-24">
                {/* Contact Form */}
                <div className="glass-card p-8 rounded-3xl bg-white dark:bg-slate-800 shadow-md border border-neutral-200/50 dark:border-slate-700/50">
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary to-blue-500 rounded-xl flex items-center justify-center"><span className="text-white text-sm">📧</span></div>
                    Get More Info
                  </h3>
                  <ContactForm propertyId={property?.listing_key ?? ''} proertyData={property} />
                </div>

                {/* Mortgage Calculator */}
                <Card className="rounded-3xl shadow-md border border-neutral-200/50 dark:border-slate-700/50">
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

                {/* Listing Agent */}
                <div className="glass-card p-6 rounded-3xl bg-neutral-50 dark:bg-slate-700/50 border border-neutral-200/50 dark:border-slate-700/50">
                  <p className="text-sm text-muted-foreground mb-3">Listing Agent</p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name: </span>
                      <span itemProp="agent" className="font-medium">{property?.list_agent_full_name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone: </span>
                      <span className="font-medium">{property?.list_agent_phone}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email: </span>
                      <span className="font-medium">{property?.list_agent_email}</span>
                    </div>
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


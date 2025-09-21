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
import { PropertyDetail, usePropertyDetail } from "@/hooks/queries/useGetDetailProperty"
import React from "react"
import Loading from "@/components/shared/loading"
import ContactForm from "@/components/contact-form"
import { Card, CardContent } from "@/components/ui/card"
import MortgageCalculatorModal from "./mortage-calculator-modal"
import PropertyFAQ from "./property-faq"
import dynamic from "next/dynamic"
import { PropertyChat } from "@/components/PropertyChat"

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

// Function to generate JSON-LD structured data
const generatePropertyJsonLd = (property: PropertyDetail | undefined) => {
  const siteUrl = "https://www.crowncoastalhomes.com"
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property?.seo_title,
    description: property?.public_remarks,
    image: property?.images.map((img) => `${siteUrl}${img}`),
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
    numberOfRooms: property?.bedrooms || undefined,
    floorSize: property?.living_area_sqft ? {
      "@type": "QuantitativeValue",
      value: property.living_area_sqft,
      unitCode: "FTK",
    } : undefined,
    yearBuilt: property?.year_built,
    realEstateAgent: {
      "@type": "RealEstateAgent",
      name: "Reza",
      telephone: "1 858-305-4362",
      email: "reza@crowncoastal.com",
      worksFor: {
        "@type": "RealEstateBroker",
        name: property?.list_office_name,
      },
    },
    offers: {
      "@type": "Offer",
      price: property?.list_price ? property.list_price : undefined,
      priceCurrency: "USD",
      availability: "A",
      seller: {
        "@type": "Organization",
        name: property?.list_office_name,
      },
    },
  }
}

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params)
  const { data: propertyData, isLoading, isError } = usePropertyDetail(unwrappedParams.id)
  const faqs = propertyData?.faq_content ? JSON.parse(propertyData.faq_content) : []
  const propertyJsonLd = generatePropertyJsonLd(propertyData)

  if (isLoading) return <Loading />
  if (isError) return <div className="flex justify-center items-center h-64"><span className="text-red-500 text-lg">Error loading property</span></div>
  if (!propertyData) return <div className="flex justify-center items-center h-64"><span className="text-gray-500 text-lg">Property not found</span></div>

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(propertyJsonLd) }} />
      {/* Inject minimal property context for the floating chat widget (no-op elsewhere) */}
      {propertyData ? (
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__activeProperty = ${JSON.stringify({
              listing_key: propertyData.listing_key,
              address: propertyData.address,
              city: propertyData.city,
              state: (propertyData as any)["state"] || propertyData.county,
              price: propertyData.list_price,
              living_area_sqft: propertyData.living_area_sqft,
              property_tax_annual: (propertyData as any).property_tax_annual ?? undefined,
              hoa: (propertyData as any).hoa ?? (propertyData as any).hoa_monthly ?? undefined,
              home_insurance_annual: (propertyData as any).home_insurance_annual ?? undefined,
              image: (propertyData.images && propertyData.images[0]) || undefined,
            })};`,
          }}
        />
      ) : null}
      <div className="bg-neutral-50 dark:bg-slate-900 min-h-screen w-full pt-16 theme-transition">
        <section className="relative overflow-hidden">
          <Carousel className="w-full" data-carousel="main" opts={{ loop: true }}>
            <CarouselContent>
              {propertyData.images.map((src, index) => (
                <CarouselItem key={index}>
                  <div className="relative w-full h-[50vh] sm:h-[60vh] lg:h-[70vh] xl:h-[80vh]">
                    <Image
                      src={src || "/luxury-modern-house-exterior.png"}
                      alt={`${propertyData.title || propertyData.address} - View ${index + 1}`}
                      fill
                      className="object-cover transition-transform duration-700 hover:scale-105"
                      priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
                  </div>
                </CarouselItem>
              ))}
              {propertyData.images.length === 0 && (
                <CarouselItem>
                  <div className="relative w-full h-[50vh] sm:h-[60vh] lg:h-[70vh] xl:h-[80vh]">
                    <Image src="/luxury-modern-house-exterior.png" alt="Property Image" fill className="object-cover transition-transform duration-700 hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  </div>
                </CarouselItem>
              )}
            </CarouselContent>
            <CarouselPrevious className="absolute left-6 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/30 dark:bg-slate-800/70 dark:hover:bg-slate-700/90 text-white border-white/30 backdrop-blur-md rounded-2xl w-14 h-14 transition-all duration-300 hover:scale-110 shadow-2xl cursor-pointer" />
            <CarouselNext className="absolute right-6 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/30 dark:bg-slate-800/70 dark:hover:bg-slate-700/90 text-white border-white/30 backdrop-blur-md rounded-2xl w-14 h-14 transition-all duration-300 hover:scale-110 shadow-2xl cursor-pointer" />
          </Carousel>

          <div className="absolute bottom-0 left-0 right-0 z-20 p-6 lg:p-8">
            <div className="container mx-auto">
              <div className="bg-white/10 dark:bg-slate-900/20 backdrop-blur-2xl border border-white/20 dark:border-slate-700/30 rounded-3xl p-6 lg:p-8 shadow-2xl animate-fade-in-up">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                  <div className="flex-1">
                    {(() => {
                      const rawAddress = propertyData.address || ''
                      const sanitize = (v: string) => v.trim().replace(/^0+\s+/, '').replace(/\s{2,}/g, ' ')
                      const sanitizedAddress = sanitize(rawAddress)
                      const candidates = [propertyData.h1_heading, propertyData.title, propertyData.seo_title]
                        .map(c => (c || '').trim())
                        .filter(c => c && !/^0+$/.test(c) && !['undefined','null'].includes(c.toLowerCase()))
                      let displayName = candidates[0] ? sanitize(candidates[0]) : ''
                      if (displayName && displayName.toLowerCase() === sanitizedAddress.toLowerCase()) displayName = ''
                      return displayName ? (
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-display font-semibold text-white mb-2 tracking-tight drop-shadow-md">
                          {displayName}
                        </h1>
                      ) : null
                    })()}
                    <div className="flex items-center gap-3 mb-4">
                      <Badge className={`px-4 py-2 rounded-2xl font-bold text-white border-none shadow-lg ${propertyData.property_type === 'ResidentialLease' ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 'bg-gradient-to-r from-emerald-500 to-emerald-600'}`}>{propertyData.property_type === 'ResidentialLease' ? 'FOR RENT' : 'FOR SALE'}</Badge>
                      <span className="text-white/80 text-sm font-medium">{propertyData.days_on_market} days on market</span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl xl:text-5xl font-display font-bold text-white mb-3 leading-tight">
                      {(propertyData.address || '').replace(/^0+\s+/, '').trim()}
                    </h1>
                    <div className="flex items-center text-white/90 text-lg">
                      <MapPin className="h-5 w-5 mr-2" />
                      <span>{propertyData.city}, {propertyData.county}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="text-right">
                      <div className="text-4xl lg:text-5xl font-display font-bold text-white mb-2">${propertyData.list_price?.toLocaleString()}</div>
                      <div className="text-white/80 text-sm">{propertyData.property_type === 'ResidentialLease' ? 'per month' : 'listing price'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute top-6 right-6 z-30 flex gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const carousel = document.querySelector('[data-carousel="main"]')
                if (carousel) {
                  if (document.fullscreenElement) document.exitFullscreen(); else (carousel as HTMLElement).requestFullscreen()
                }
              }}
              className="bg-white/20 hover:bg-white/30 dark:bg-slate-800/70 dark:hover:bg-slate-700/90 text-white border-white/30 backdrop-blur-md rounded-2xl w-12 h-12 transition-all duration-300 hover:scale-110 shadow-xl cursor-pointer"
            >
              <Maximize className="h-5 w-5" />
              <span className="sr-only">View Fullscreen</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => console.log('Added to favorites:', propertyData.listing_key)}
              className="bg-white/20 hover:bg-white/30 dark:bg-slate-800/70 dark:hover:bg-slate-700/90 text-white border-white/30 backdrop-blur-md rounded-2xl w-12 h-12 transition-all duration-300 hover:scale-110 shadow-xl cursor-pointer group"
            >
              <Heart className="h-5 w-5 group-hover:fill-current transition-all duration-300" />
              <span className="sr-only">Add to Favorites</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={async () => {
                try {
                  if (navigator.share) {
                    await navigator.share({ title: `${propertyData.address} - Property Listing`, text: `Check out this amazing property: ${propertyData.address}`, url: window.location.href })
                  } else {
                    await navigator.clipboard.writeText(window.location.href)
                    alert('Property link copied to clipboard!')
                  }
                } catch (error) {
                  console.error('Error sharing:', error)
                  try {
                    await navigator.clipboard.writeText(window.location.href)
                    alert('Property link copied to clipboard!')
                  } catch (clipboardError) {
                    console.error('Clipboard error:', clipboardError)
                  }
                }
              }}
              className="bg-white/20 hover:bg-white/30 dark:bg-slate-800/70 dark:hover:bg-slate-700/90 text-white border-white/30 backdrop-blur-md rounded-2xl w-12 h-12 transition-all duration-300 hover:scale-110 shadow-xl cursor-pointer"
            >
              <Share2 className="h-5 w-5" />
              <span className="sr-only">Share Property</span>
            </Button>
          </div>
        </section>

        <div className="container mx-auto py-12 lg:py-16 px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[4fr_2fr] gap-8 lg:gap-12">
            <div className="space-y-10">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
                <div className="glass-card p-6 rounded-2xl text-center hover-lift">
                  <Bed className="h-8 w-8 text-primary-500 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{propertyData.bedrooms ?? 'N/A'}</div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">Bedrooms</div>
                </div>
                <div className="glass-card p-6 rounded-2xl text-center hover-lift">
                  <Bath className="h-8 w-8 text-accent-500 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{propertyData.bathrooms ?? 'N/A'}</div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">Bathrooms</div>
                </div>
                <div className="glass-card p-6 rounded-2xl text-center hover-lift">
                  <Square className="h-8 w-8 text-gold-500 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{propertyData.living_area_sqft ? propertyData.living_area_sqft.toLocaleString() : 'N/A'}</div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">Sq Ft</div>
                </div>
                <div className="glass-card p-6 rounded-2xl text-center hover-lift">
                  <Calendar className="h-8 w-8 text-success-500 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{propertyData.year_built}</div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">Built</div>
                </div>
              </div>

              <div className="glass-card p-8 rounded-3xl animate-slide-in-left">
                <h2 className="text-2xl font-display font-bold text-neutral-900 dark:text-neutral-100 mb-6 flex items-center gap-3">
                  <Building2 className="h-7 w-7 text-primary-500" />
                  Property Overview
                </h2>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">{propertyData.public_remarks || 'This beautiful property offers modern living with exceptional features and prime location.'}</p>
                </div>
                {propertyData.list_price !== undefined && (
                  <div className="mt-8 p-6 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-2xl border border-primary-200/50 dark:border-primary-700/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Estimated monthly payment</div>
                        <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">${Math.round(propertyData.list_price / 360).toLocaleString()}/month</div>
                      </div>
                      <TrendingUp className="h-8 w-8 text-accent-500" />
                    </div>
                  </div>
                )}
              </div>

              <div className="glass-card p-8 rounded-3xl animate-scale-in">
                <h2 className="text-2xl font-display font-bold text-neutral-900 dark:text-neutral-100 mb-8 flex items-center gap-3">
                  <Building2 className="h-7 w-7 text-primary-500" />
                  Home Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-2xl p-6 text-center hover-lift transition-all duration-300 min-h-[140px] flex flex-col justify-center">
                    <Building2 className="h-8 w-8 text-primary-500 mx-auto mb-3" />
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Home Type</div>
                    <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100 leading-tight">{propertyData.property_type}</div>
                    {propertyData.property_sub_type && <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{propertyData.property_sub_type}</div>}
                  </div>
                  <div className="bg-gradient-to-br from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-800/20 rounded-2xl p-6 text-center hover-lift transition-all duration-300 min-h-[140px] flex flex-col justify-center">
                    <Calendar className="h-8 w-8 text-accent-500 mx-auto mb-3" />
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Year Built</div>
                    <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{propertyData.year_built || 'N/A'}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{propertyData.year_built && `${new Date().getFullYear() - propertyData.year_built} years old`}</div>
                  </div>
                  <div className="bg-gradient-to-br from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20 rounded-2xl p-6 text-center hover-lift transition-all duration-300 min-h-[140px] flex flex-col justify-center">
                    <Car className="h-8 w-8 text-success-500 mx-auto mb-3" />
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Parking Spaces</div>
                    <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{propertyData.parking_total ?? 'N/A'}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{propertyData.parking_total ? 'vehicles' : 'info not available'}</div>
                  </div>
                  <div className="bg-gradient-to-br from-gold-50 to-gold-100 dark:from-gold-900/20 dark:to-gold-800/20 rounded-2xl p-6 text-center hover-lift transition-all duration-300 min-h-[140px] flex flex-col justify-center">
                    <Square className="h-8 w-8 text-gold-500 mx-auto mb-3" />
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Lot Size</div>
                    <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{propertyData.lot_size_sqft?.toLocaleString() || 'N/A'}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{propertyData.lot_size_sqft > 43560 ? 'acres' : 'square feet'}</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 text-center hover-lift transition-all duration-300 min-h-[140px] flex flex-col justify-center">
                    <School className="h-8 w-8 text-purple-500 mx-auto mb-3" />
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">School District</div>
                    <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100 leading-tight">{propertyData.other_info?.HighSchoolDistrict || 'N/A'}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">public schools</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl p-6 text-center hover-lift transition-all duration-300 min-h-[140px] flex flex-col justify-center">
                    <TrendingUp className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Days on Market</div>
                    <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{propertyData.days_on_market || 'N/A'}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{propertyData.days_on_market < 30 ? 'recently listed' : 'established listing'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                  <div className="glass-card p-6 rounded-2xl hover-lift">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-4"><Eye className="h-5 w-5 text-primary-500" />Property Views</h3>
                    <div className="space-y-2">
                      {propertyData.view ? propertyData.view.split(',').map((v: string, i: number) => <p key={i} className="text-neutral-700 dark:text-neutral-300 text-sm">{v.trim()}</p>) : <p className="text-neutral-600 dark:text-neutral-400 text-sm italic">No specific views listed</p>}
                    </div>
                  </div>
                  <div className="glass-card p-6 rounded-2xl hover-lift">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-4"><Building className="h-5 w-5 text-accent-500" />Listing Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-neutral-600 dark:text-neutral-400">MLS Status:</span><span className="font-semibold text-neutral-900 dark:text-neutral-100">{propertyData.mls_status}</span></div>
                      <div className="flex justify-between"><span className="text-neutral-600 dark:text-neutral-400">Days on Market:</span><span className="font-semibold text-neutral-900 dark:text-neutral-100">{(() => { const now = new Date(); const onMarket = new Date(propertyData.on_market_timestamp); const diff = now.getTime() - onMarket.getTime(); const days = Math.floor(diff / (1000*3600*24)); return days < 1 ? `${Math.floor(diff / (1000*3600))} hours` : `${days} days`; })()}</span></div>
                    </div>
                  </div>
                  <div className="glass-card p-6 rounded-2xl hover-lift">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-4"><Square className="h-5 w-5 text-gold-500" />Utilities & Systems</h3>
                    <div className="space-y-2">{propertyData.heating ? <p className="text-neutral-700 dark:text-neutral-300 text-sm">{propertyData.heating}</p> : <p className="text-neutral-600 dark:text-neutral-400 text-sm italic">Utility details not available</p>}</div>
                  </div>
                </div>

                <div className="glass-card p-8 rounded-3xl mt-16">
                  <h3 className="text-xl font-display font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3 mb-6"><Bath className="h-7 w-7 text-primary-500" />Interior Spaces & Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {propertyData.living_area_sqft && propertyData.living_area_sqft > 0 && <div className="text-center p-4 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl"><div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{propertyData.living_area_sqft.toLocaleString()}</div><div className="text-sm text-neutral-600 dark:text-neutral-400">Sq Ft Living</div></div>}
                    {propertyData.lot_size_sqft && <div className="text-center p-4 bg-gradient-to-br from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-800/20 rounded-xl"><div className="text-2xl font-bold text-accent-600 dark:text-accent-400">{propertyData.lot_size_sqft.toLocaleString()}</div><div className="text-sm text-neutral-600 dark:text-neutral-400">Lot Size {propertyData.lot_size_sqft > 43560 ? 'Acres' : 'Sq Ft'}</div></div>}
                    {propertyData.stories && <div className="text-center p-4 bg-gradient-to-br from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20 rounded-xl"><div className="text-2xl font-bold text-success-600 dark:text-success-400">{propertyData.stories}</div><div className="text-sm text-neutral-600 dark:text-neutral-400">Stories</div></div>}
                    {propertyData.pool_features && <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl"><div className="text-lg font-bold text-blue-600 dark:text-blue-400">Pool</div><div className="text-sm text-neutral-600 dark:text-neutral-400">Features</div></div>}
                  </div>
                  {propertyData.interior_features && <div className="mt-6 p-4 bg-neutral-50 dark:bg-slate-800/50 rounded-2xl"><h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Interior Features</h4><p className="text-neutral-700 dark:text-neutral-300 text-sm">{propertyData.interior_features}</p></div>}
                </div>

                <div className="glass-card p-8 rounded-3xl animate-scale-in">
                  <h2 className="text-2xl font-display font-bold text-neutral-900 dark:text-neutral-100 mb-8 flex items-center gap-3"><Building2 className="h-7 w-7 text-primary-500" />Community & Neighborhood</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-2xl p-6 text-center hover-lift"><Building2 className="h-8 w-8 text-primary-500 mx-auto mb-4" /><h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Subdivision</h3><p className="text-neutral-700 dark:text-neutral-300">{propertyData.subdivision_name || 'No subdivision info'}</p></div>
                    <div className="bg-gradient-to-br from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-800/20 rounded-2xl p-6 text-center hover-lift"><Utensils className="h-8 w-8 text-accent-500 mx-auto mb-4" /><h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Amenities</h3><div className="space-y-1">{propertyData.other_info?.CommunityFeatures?.split(',').map((v: string, i: number) => <p key={i} className="text-neutral-700 dark:text-neutral-300 text-sm">{v.trim()}</p>) || <p className="text-neutral-600 dark:text-neutral-400 text-sm italic">No specific amenities listed</p>}</div></div>
                    <div className="bg-gradient-to-br from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20 rounded-2xl p-6 text-center hover-lift"><TreePine className="h-8 w-8 text-success-500 mx-auto mb-4" /><h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Recreation</h3><p className="text-neutral-700 dark:text-neutral-300 text-sm">{propertyData.other_info?.RecreationFeatures || 'Recreation info not available'}</p></div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-8 rounded-3xl animate-scale-in mt-16">
                <h2 className="text-2xl font-display font-bold text-neutral-900 dark:text-neutral-100 mb-6 flex items-center gap-3"><MapPin className="h-7 w-7 text-primary-500" />Location & Neighborhood</h2>
                {propertyData.latitude && propertyData.longitude ? (
                  <div className="space-y-4">
                    <div className="h-96 rounded-2xl overflow-hidden border border-neutral-200/50 dark:border-slate-700/50 relative">
                      <PropertyMap location={{ lat: propertyData.latitude, lng: propertyData.longitude }} address={propertyData.address} />
                      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 bg-black/5 flex items-center justify-center">
                        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-3 text-center">
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Interactive map loading...</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-500">Check console for debug info</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => window.open(`https://www.google.com/maps?q=${propertyData.latitude},${propertyData.longitude}`, '_blank')} className="flex-1 border-neutral-200 dark:border-slate-600 hover:bg-primary-50 dark:hover:bg-primary-900/30"><MapPin className="h-4 w-4 mr-2" />Open in Google Maps</Button>
                      <Button variant="outline" onClick={() => window.open(`http://maps.apple.com/?q=${propertyData.latitude},${propertyData.longitude}`, '_blank')} className="flex-1 border-neutral-200 dark:border-slate-600 hover:bg-accent-50 dark:hover:bg-accent-900/30"><MapPin className="h-4 w-4 mr-2" />Open in Apple Maps</Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-96 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 text-neutral-400 dark:text-neutral-500 mx-auto mb-4" />
                      <p className="text-neutral-600 dark:text-neutral-400 font-medium">Location data not available</p>
                      <p className="text-neutral-500 dark:text-neutral-500 text-sm mt-2">Coordinates: {propertyData.latitude || 'N/A'}, {propertyData.longitude || 'N/A'}</p>
                    </div>
                  </div>
                )}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl text-sm">
                    <strong>Debug Info:</strong><br />
                    Latitude: {propertyData.latitude || 'undefined'}<br />
                    Longitude: {propertyData.longitude || 'undefined'}<br />
                    Address: {propertyData.address || 'undefined'}
                  </div>
                )}
              </div>

              <Card className="mb-6 sm:p-8 rounded-xl shadow-medium space-y-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Mortgage Calculator</h3>
                  <div className="space-y-4">
                    <div><p className="text-sm text-muted-foreground mb-1">Home Price</p><div className="font-medium">${propertyData.list_price.toLocaleString()}</div></div>
                    <div><p className="text-sm text-muted-foreground mb-1">Down Payment (20%)</p><div className="font-medium">${(propertyData.list_price * 0.2).toLocaleString()}</div></div>
                    <div><p className="text-sm text-muted-foreground mb-1">Loan Amount</p><div className="font-medium">${(propertyData.list_price * 0.8).toLocaleString()}</div></div>
                    <div><p className="text-sm text-muted-foreground mb-1">Estimated Monthly Payment</p><div className="font-medium">${Math.round(propertyData.list_price / 360).toLocaleString()}/month</div></div>
                    <MortgageCalculatorModal propertyPrice={propertyData.list_price} propertyTaxRate={0.0125} insuranceRate={0.0035} hoaFees={0.05} buttonText="Full Calculator" />
                  </div>
                </CardContent>
              </Card>

              {faqs && faqs.length > 0 && (
                <div className="bg-brand-white p-6 sm:p-8 rounded-xl shadow-medium">
                  <PropertyFAQ faqs={faqs} propertyType={propertyData.property_type} propertyAddress={propertyData.address} />
                </div>
              )}
            </div>

            <div>
              <div className="space-y-6 lg:sticky lg:top-24">
                <div className="glass-card p-8 rounded-3xl">
                  <h3 className="text-xl font-display font-bold text-neutral-900 dark:text-neutral-100 mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-primary rounded-xl flex items-center justify-center"><span className="text-white text-sm">📧</span></div>
                    Get More Info
                  </h3>
                  <ContactForm propertyId={propertyData.listing_key} proertyData={propertyData} />
                </div>

                <div className="glass-card p-8 rounded-3xl">
                  <h3 className="text-xl font-display font-bold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-primary rounded-xl flex items-center justify-center"><span className="text-white text-sm">💬</span></div>
                    Chat about this property
                  </h3>
                  <PropertyChat propertyId={propertyData.listing_key} snapshot={propertyData} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

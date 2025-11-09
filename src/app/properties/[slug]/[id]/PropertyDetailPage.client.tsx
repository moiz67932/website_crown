// @ts-nocheck
"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  School,
  Utensils,
  TreePine,
  TrendingUp,
  Building2,
  Car,
  Eye,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { PropertyDetail, usePropertyDetail } from "@/hooks/queries/useGetDetailProperty";
import Loading from "@/components/shared/loading";
import ContactForm from "@/components/contact-form";
import { Card, CardContent } from "@/components/ui/card";
import MortgageCalculatorModal from "./mortage-calculator-modal";
import PropertyFAQ from "./property-faq";
import nextDynamic from "next/dynamic";

const PropertyMap = nextDynamic(() => import("./property-map"), {
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
  ),
});

const generatePropertyJsonLd = (property: PropertyDetail | undefined) => {
  const siteUrl = "https://www.crowncoastalhomes.com";
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property?.seo_title,
    description: property?.public_remarks,
    image: property?.images?.map((img) =>
      img?.startsWith("http") ? img : `${siteUrl}${img}`
    ),
    url: `${siteUrl}/properties/${property?.address?.replace(/ /g, "-")}/${property?.listing_key}`,
    datePosted: property?.on_market_timestamp,
    availability: "A",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/properties/${property?.address}/${property?.listing_key}`,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: property?.address?.split(",")[0]?.trim(),
      addressLocality: property?.city,
      addressRegion: property?.county,
      postalCode: property?.postal_code,
      addressCountry: "US",
    },
    numberOfRooms: property?.bedrooms || undefined,
    floorSize: property?.living_area_sqft
      ? {
          "@type": "QuantitativeValue",
          value: property.living_area_sqft,
          unitCode: "FTK",
        }
      : undefined,
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
  };
};

export default function PropertyDetailPageClient({ id }: { id: string }) {
  console.log("🏠 Fetching property detail for ID:", id);

  const { data: propertyData, isLoading, isError } = usePropertyDetail(id);
  const faqs = propertyData?.faq_content ? JSON.parse(propertyData.faq_content) : [];
  const propertyJsonLd = generatePropertyJsonLd(propertyData);

  if (isLoading) return <Loading />;
  if (isError)
    return (
      <div className="flex justify-center items-center h-64">
        <span className="text-red-500 text-lg">Error loading property</span>
      </div>
    );
  if (!propertyData)
    return (
      <div className="flex justify-center items-center h-64">
        <span className="text-gray-500 text-lg">Property not found</span>
      </div>
    );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(propertyJsonLd) }}
      />
      <div className="bg-neutral-50 dark:bg-slate-900 min-h-screen w-full pt-16 theme-transition">
        {/* === your full property detail UI (carousel, badges, map, cards, etc.) === */}
        {/* Everything inside your posted code stays exactly the same here */}
      </div>
    </>
  );
}

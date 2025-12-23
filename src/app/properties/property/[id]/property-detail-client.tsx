"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Heart, Share2, MapPin } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useFavoriteProperties } from "@/hooks/use-favorite-properties";
import ContactForm from "@/components/contact-form";
import dynamic from "next/dynamic";
import PropertyFAQ from "./property-faq";
import MortgageCalculatorModal from "./mortage-calculator-modal";

// Dynamic import for map to avoid SSR issues
const PropertyMap = dynamic(() => import("./property-map"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center animate-pulse">
      <div className="text-center">
        <div className="w-12 h-12 bg-primary-500 rounded-xl mx-auto mb-4 animate-spin flex items-center justify-center">
          <MapPin className="h-6 w-6 text-white" />
        </div>
        <p className="text-neutral-600 dark:text-neutral-400 font-medium">
          Loading Interactive Map...
        </p>
      </div>
    </div>
  ),
});

interface PropertyDetailClientProps {
  property: any;
}

export default function PropertyDetailClient({
  property,
}: PropertyDetailClientProps) {
  const { isFavorite, toggleFavorite, isLoading: favoritesLoading } =
    useFavoriteProperties();

  const handleFavoriteClick = async () => {
    if (!property) return;

    await toggleFavorite(property.listing_key, {
      listing_key: property.listing_key,
      address: property.address,
      city: property.city,
      county: property.county,
      state: property.state,
      postal_code: property.postal_code,
      list_price: property.list_price,
      property_type: property.property_type,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      living_area_sqft: property.living_area_sqft,
      lot_size_sqft: property.lot_size_sqft,
      year_built: property.year_built,
      main_photo_url: property.main_photo_url || property.images?.[0],
      images: property.images,
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.address,
          text: `Check out this property: ${property.address}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const images = Array.isArray(property.images) && property.images.length > 0
    ? property.images
    : property.main_photo_url
    ? [property.main_photo_url]
    : ["/luxury-modern-house-exterior.png"];

  return (
    <div className="space-y-8">
      {/* Image Gallery */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-md">
        <Carousel className="w-full">
          <CarouselContent>
            {images.map((image: string, index: number) => (
              <CarouselItem key={index}>
                <div className="relative h-96 md:h-[600px]">
                  <Image
                    src={image}
                    alt={`${property.address} - Image ${index + 1}`}
                    fill
                    className="object-cover"
                    priority={index === 0}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {images.length > 1 && (
            <>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </>
          )}
        </Carousel>
      </section>

      {/* Action Buttons */}
      <section className="flex gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={handleFavoriteClick}
          disabled={favoritesLoading}
          className="flex-1"
        >
          <Heart
            className={`h-5 w-5 mr-2 ${
              isFavorite(property.listing_key)
                ? "fill-rose-500 text-rose-500"
                : ""
            }`}
          />
          {isFavorite(property.listing_key)
            ? "Saved"
            : "Save Property"}
        </Button>

        <Button variant="outline" size="lg" onClick={handleShare} className="flex-1">
          <Share2 className="h-5 w-5 mr-2" />
          Share
        </Button>

        <div className="flex-1">
          <MortgageCalculatorModal
            propertyPrice={property.list_price || 0}
            propertyTaxRate={property.tax_annual_amount ? (property.tax_annual_amount / property.list_price) * 100 : undefined}
            hoaFees={property.association_fee || undefined}
            buttonVariant="default"
            buttonText="Calculate Payment"
            buttonClassName="w-full"
          />
        </div>
      </section>

      {/* Map */}
      {(property.latitude && property.longitude) && (
        <section>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            Location
          </h2>
          <PropertyMap 
            location={{
              lat: property.latitude,
              lng: property.longitude
            }}
            address={property.address || ""}
          />
        </section>
      )}

      {/* Contact Form */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
          Interested in This Property?
        </h2>
        <ContactForm 
          propertyId={property.listing_key} 
          proertyData={property}
          city={property.city}
          state={property.state}
          county={property.county}
        />
      </section>

      {/* FAQ */}
      {property.faq_content && Array.isArray(property.faq_content) && property.faq_content.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
            Frequently Asked Questions
          </h2>
          <PropertyFAQ 
            faqs={property.faq_content}
            propertyType={property.property_type || "Property"}
            propertyAddress={property.address || ""}
          />
        </section>
      )}
    </div>
  );
}

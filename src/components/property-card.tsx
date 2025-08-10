"use client"

import Image from "next/image"
import Link from "next/link"
import { Bed, Bath, Square, Heart, MapPin, HomeIcon as HomeModern, Maximize } from "lucide-react" // Added HomeModern
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Property } from "@/interfaces"
import { useState } from "react"

// Function to get appropriate fallback image based on property type, price, and listing key for variety
const getPropertyFallbackImage = (propertyType: string, price: number, listingKey?: string) => {
  // Available property images for variety
  const propertyImages = [
    "/luxury-modern-house-exterior.png",
    "/modern-beach-house.png", 
    "/modern-ocean-living.png",
    "/luxury-master-bedroom.png",
    "/california-coastal-sunset.png",
    "/san-diego-bay-sunset.png",
    "/los.jpg",
    "/san-fan.jpg"
  ];

  // Select image based on property characteristics with some randomness for variety
  let imageIndex = 0;
  
  // Add variety based on listing key (use last digit for variation)
  const varietyFactor = listingKey ? parseInt(listingKey.slice(-1)) || 0 : 0;
  
  if (propertyType?.toLowerCase().includes('lease') || propertyType?.toLowerCase().includes('rent')) {
    imageIndex = (1 + varietyFactor) % 4; // Cycle between beach house, ocean living, bedroom, and bay for rentals
  } else if (price > 800000) {
    imageIndex = varietyFactor % 2 === 0 ? 0 : 2; // Alternate between luxury exterior and ocean living for high-end
  } else if (price > 500000) {
    imageIndex = (2 + varietyFactor) % 6; // Cycle through various images for mid-high range
  } else if (price > 300000) {
    imageIndex = (1 + varietyFactor) % 5; // Various images for mid-range
  } else {
    imageIndex = varietyFactor % 8; // All images available for lower range
  }

  return propertyImages[imageIndex] || "/california-coastal-sunset.png";
};

interface PropertyCardProps {
  property: Property
}

export function PropertyCard({ property }: PropertyCardProps) {
  const [favoriteProperties, setFavoriteProperties] = useState<string[]>([])

  const toggleFavorite = (e: React.MouseEvent, propertyId: string) => {
    e.preventDefault()
    e.stopPropagation()

    setFavoriteProperties((prev) =>
      prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId],
    )
  }

  return (
    <Link
      href={`/properties/${property?.address ? property?.address?.replace(/\s+/g, '-').replace('/', '-').toLowerCase() : 'address'}/${property.listing_key}`}
      key={property.listing_key}
      className="group bg-white dark:bg-slate-900 rounded-3xl shadow-soft hover:shadow-strong p-0 w-full flex flex-col relative transition-all duration-500 hover-lift hover:scale-[1.02] border border-neutral-100 dark:border-slate-700 theme-transition"
    >
      {/* Enhanced Status badge */}
      <div
        className={`absolute top-6 left-6 z-20 px-4 py-2 rounded-2xl text-xs font-bold backdrop-blur-sm border transition-all duration-300 group-hover:scale-105 ${
          property.property_type == 'ResidentialLease' 
            ? 'bg-error-500/90 border-error-400/50 text-white shadow-lg' 
            : 'bg-success-500/90 border-success-400/50 text-white shadow-lg'
        }`}
      >
        {property.property_type == 'ResidentialLease' ? 'FOR RENT' : 'FOR SALE'}
      </div>

      {/* Enhanced Type badge */}
      <div className="absolute top-6 right-6 z-20 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/95 dark:bg-slate-800/95 text-neutral-700 dark:text-neutral-300 border border-neutral-200/50 dark:border-slate-600/50 backdrop-blur-sm shadow-medium transition-all duration-300 group-hover:scale-105 theme-transition">
        {property.property_type}
      </div>

      {/* Enhanced Heart icon */}
      <div className="absolute top-20 right-6 z-20">
        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-2xl bg-white/95 dark:bg-slate-800/95 hover:bg-white dark:hover:bg-slate-700 border border-neutral-200/50 dark:border-slate-600/50 text-neutral-600 dark:text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 backdrop-blur-sm shadow-medium transition-all duration-300 hover:scale-110 hover:shadow-strong theme-transition"
          onClick={(e) => toggleFavorite(e, property._id)}
        >
          <Heart
            className={`h-5 w-5 transition-all duration-300 ${
              favoriteProperties.includes(property._id) 
                ? "fill-rose-500 text-rose-500 scale-110" 
                : "group-hover:scale-110"
            }`}
          />
        </Button>
      </div>

      {/* Enhanced Property image */}
      <div className="relative h-64 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center rounded-t-3xl overflow-hidden theme-transition">
        <img
          src={
            // Try multiple possible image field names from API, with better fallbacks
            property.images?.[0] || 
            property.image || 
            (property as any).main_image_url || 
            (property as any).main_image || 
            (property as any).photo_url || 
            (property as any).listing_photos?.[0] ||
            // Better fallback images based on property type
            getPropertyFallbackImage(property.property_type, property.list_price, property.listing_key)
          } 
          alt={property.address || 'Property'}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            // Fallback to property-specific image if main image fails to load
            const target = e.currentTarget as HTMLImageElement;
            if (!target.src.includes('luxury-') && !target.src.includes('modern-') && !target.src.includes('california-coastal')) {
              target.src = getPropertyFallbackImage(property.property_type, property.list_price, property.listing_key);
            } else if (!target.src.includes('california-coastal')) {
              target.src = "/california-coastal-sunset.png";
            }
          }}
        />
        {/* Image overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gradient-primary bg-clip-text text-transparent mb-2 line-clamp-2 leading-tight group-hover:text-primary-600 transition-colors duration-300">{property.address}</h3>
          <div className="flex items-center text-neutral-500 dark:text-neutral-400 text-sm theme-transition">
            <MapPin className="h-4 w-4 mr-2 text-primary-400 dark:text-primary-300" />
            <span className="font-medium">{property.city}, {property.county}</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-1 theme-transition">
            ${property.list_price?.toLocaleString?.() ?? property.list_price}
          </div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400 font-medium theme-transition">
            {property.property_type == 'ResidentialLease' ? 'per month' : 'listing price'}
          </div>
        </div>

        <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 text-sm mt-auto pt-4 border-t border-neutral-100 dark:border-slate-700 theme-transition">
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/30">
              <Bed className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            </div>
            <span className="font-semibold">{property.bedrooms}</span>
            <span className="text-neutral-400 dark:text-neutral-500">beds</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 rounded-lg bg-accent-50 dark:bg-cyan-900/30">
              <Bath className="h-4 w-4 text-accent-600 dark:text-cyan-400" />
            </div>
            <span className="font-semibold">{property.bathrooms}</span>
            <span className="text-neutral-400 dark:text-neutral-500">baths</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 rounded-lg bg-gold-50 dark:bg-amber-900/30">
              <Maximize className="h-4 w-4 text-gold-600 dark:text-amber-400" />
            </div>
            <span className="font-semibold text-xs">
              {property.lot_size_sqft ? `${property?.lot_size_sqft.toLocaleString?.() ?? '-'}` : '-'}
            </span>
            <span className="text-neutral-400 dark:text-neutral-500 text-xs">sqft</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

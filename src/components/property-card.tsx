"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bed,
  Bath,
  Square,
  Heart,
  MapPin,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Property } from "@/interfaces";
import React, { useState } from "react";
import { useComparison } from "@/contexts/comparison-context";
import { usePropertyDetail } from "@/hooks/queries/useGetDetailProperty";

interface PropertyCardProps {
  property: Property;
  showCompareButton?: boolean;
  onCompareClick?: (property: Property) => void;
}

export function PropertyCard({
  property,
  showCompareButton = true,
  onCompareClick,
}: PropertyCardProps) {
  const [favoriteProperties, setFavoriteProperties] = useState<string[]>([]);
  const [imageError, setImageError] = useState(false);
  const { addToComparison, isInComparison } = useComparison();

  // Fetch full property details using the listing_key
  const listingId = property.listing_key || property.id || '';
  const { data: propertyDetail, isLoading } = usePropertyDetail(listingId);

  // Use propertyDetail if available, otherwise fallback to property prop
  const displayData = propertyDetail || property;

  const toggleFavorite = (e: React.MouseEvent, propertyId: string) => {
    e.preventDefault();
    e.stopPropagation();

    setFavoriteProperties((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  // Reset image error state when property changes
  React.useEffect(() => {
    setImageError(false);
  }, [property.listing_key]);

  // Get image source with fallback
  const getImageSrc = () => {
    if (imageError) {
      return "/luxury-modern-house-exterior.png";
    }
    
    if (displayData.listing_key) {
      return `/api/media?listingKey=${encodeURIComponent(displayData.listing_key)}&object=1`;
    }

    return (displayData as any).images?.[0] || 
           (displayData as any).main_image_url || 
           "/luxury-modern-house-exterior.png";
  };

  // Sanitize address
  const sanitizeAddress = (addr: string) => {
    return addr.trim().replace(/^0+\s+/, '').replace(/\s{2,}/g, ' ');
  };

  const address = sanitizeAddress(displayData.address || '');
  const city = displayData.city || '';
  const county = displayData.county || '';
  const isForRent = displayData.property_type === "ResidentialLease";

  return (
    <Link
      href={`/properties/${
        property?.address
          ? property?.address
              ?.replace(/\s+/g, "-")
              .replace(/[^\w-]/g, "")
              .toLowerCase()
          : "property"
      }/${property.listing_key || property.id || "unknown"}`}
      key={property.listing_key || property.id}
      className="group bg-white dark:bg-slate-900 rounded-3xl shadow-soft hover:shadow-strong p-0 w-full flex flex-col relative transition-all duration-500 hover-lift hover:scale-[1.02] border border-neutral-100 dark:border-slate-700 theme-transition"
    >
      {/* Status badge */}
      <div
        className={`absolute top-6 left-6 z-20 px-4 py-2 rounded-2xl text-xs font-bold backdrop-blur-sm border transition-all duration-300 group-hover:scale-105 ${
          isForRent
            ? "bg-error-500/90 border-error-400/50 text-white shadow-lg"
            : "bg-success-500/90 border-success-400/50 text-white shadow-lg"
        }`}
      >
        {isForRent ? "FOR RENT" : "FOR SALE"}
      </div>

      {/* Type badge */}
      <div className="absolute top-6 right-6 z-20 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/95 dark:bg-slate-800/95 text-neutral-700 dark:text-neutral-300 border border-neutral-200/50 dark:border-slate-600/50 backdrop-blur-sm shadow-medium transition-all duration-300 group-hover:scale-105 theme-transition">
        {displayData.property_type}
      </div>

      {/* Enhanced Heart icon */}
      <div className="absolute top-20 right-6 z-20 flex flex-col gap-2">
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

        {/* Compare Button */}
        {showCompareButton && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-10 w-10 rounded-2xl bg-white/95 dark:bg-slate-800/95 hover:bg-white dark:hover:bg-slate-700 border border-neutral-200/50 dark:border-slate-600/50 backdrop-blur-sm shadow-medium transition-all duration-300 hover:scale-110 hover:shadow-strong theme-transition",
              isInComparison(property.listing_key)
                ? "text-blue-600 border-blue-300 bg-blue-50"
                : "text-neutral-600 dark:text-neutral-400 hover:text-blue-500 dark:hover:text-blue-400"
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToComparison(property);
              onCompareClick?.(property);
            }}
            title={
              isInComparison(property.listing_key)
                ? "Property in comparison"
                : "Add to comparison"
            }
          >
            <Scale
              className={cn(
                "h-5 w-5 transition-all duration-300 group-hover:scale-110",
                isInComparison(property.listing_key) && "text-blue-600"
              )}
            />
          </Button>
        )}
      </div>

      {/* Property image */}
      <div className="relative h-64 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center rounded-t-3xl overflow-hidden theme-transition">
        <Image
          src={getImageSrc()}
          alt={address || "Property"}
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          onError={() => {
            setImageError(true);
          }}
          onLoad={(e) => {
            const imgEl = e.currentTarget as HTMLImageElement;
            if (imgEl.naturalWidth <= 2 && imgEl.naturalHeight <= 2) {
              setImageError(true);
            }
          }}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gradient-primary bg-clip-text text-transparent mb-2 line-clamp-2 leading-tight group-hover:text-primary-600 transition-colors duration-300">
            {address || city || 'Property'}
          </h3>
          <div className="flex items-center text-neutral-500 dark:text-neutral-400 text-sm theme-transition">
            <MapPin className="h-4 w-4 mr-2 text-primary-400 dark:text-primary-300" />
            <span className="font-medium">{city}{county ? `, ${county}` : ''}</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-1 theme-transition">
            ${displayData.list_price?.toLocaleString()}
          </div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400 font-medium theme-transition">
            {isForRent ? "per month" : "listing price"}
          </div>
        </div>

        <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 text-sm mt-auto pt-4 border-t border-neutral-100 dark:border-slate-700 theme-transition">
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/30">
              <Bed className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            </div>
            <span className="font-semibold">{displayData.bedrooms ?? "N/A"}</span>
            <span className="text-neutral-400 dark:text-neutral-500">beds</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 rounded-lg bg-accent-50 dark:bg-cyan-900/30">
              <Bath className="h-4 w-4 text-accent-600 dark:text-cyan-400" />
            </div>
            <span className="font-semibold">{displayData.bathrooms ?? "N/A"}</span>
            <span className="text-neutral-400 dark:text-neutral-500">
              baths
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 rounded-lg bg-gold-50 dark:bg-amber-900/30">
              <Square className="h-4 w-4 text-gold-600 dark:text-amber-400" />
            </div>
            <span className="font-semibold text-xs">
              {displayData.living_area_sqft ? displayData.living_area_sqft.toLocaleString() : "N/A"}
            </span>
            <span className="text-neutral-400 dark:text-neutral-500 text-xs">
              sqft
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}


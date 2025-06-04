"use client"

import Image from "next/image"
import Link from "next/link"
import { Bed, Bath, Square, Heart, MapPin, HomeIcon as HomeModern, Maximize } from "lucide-react" // Added HomeModern
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Property } from "@/interfaces"
import { useState } from "react"

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
      href={`/properties/${property?.address ? property?.address?.replace(/\s+/g, '-').toLowerCase() : 'address'}/${property.listing_key}`}
      key={property.listing_key}
      className="bg-white rounded-2xl shadow-lg p-0 w-full max-w-xs flex flex-col relative transition hover:shadow-xl"
    >
      {/* Status badge */}
      <div
        className={`absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-xs font-semibold ${
          property.property_type == 'ResidentialLease' ? 'bg-[#F47C6E] text-white' : 'bg-[#3CB4AC] text-white'
        }`}
      >
        {property.property_type == 'ResidentialLease' ? 'FOR RENT' : 'FOR SALE'}
      </div>

      {/* Type badge (static for now) */}
      <div className="absolute top-4 left-28 z-10 px-3 py-1 rounded-full text-xs font-medium bg-[#F6EEE7] text-[#7C6F57] border border-[#e5d8c7]">
        {property.property_type}
      </div>

      {/* Heart icon */}
      <div className="absolute top-1 right-1 z-10">
        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 md:top-3 md:right-3 h-8 w-8 rounded-full bg-white/80 hover:bg-white/90 text-slate-700 hover:text-rose-500"
          onClick={(e) => toggleFavorite(e, property._id)}
        >
          <Heart
            className={`h-4 w-4 ${
              favoriteProperties.includes(property._id) ? "fill-rose-500 text-rose-500" : ""
            }`}
          />
        </Button>
      </div>

      {/* Property image */}
      <div className="h-60 bg-[#F3F4F6] flex items-center justify-center rounded-t-2xl overflow-hidden">
        <img
          src={property.images[0] ?? "/california-coastal-sunset.png"} 
          alt={property.address}
          className="rounded-t-2xl w-full h-full object-cover"
        />
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="mb-1">
          <h3 className="text-lg font-bold text-[#1CA7A6] truncate">{property.address}</h3>
          <div className="flex items-center text-[#6B7280] text-sm mt-1">
            <MapPin className="h-4 w-4 mr-1" />
            {property.city}, {property.county}
          </div>
        </div>

        <div className="text-2xl font-bold text-[#2D3A4A] mb-2">
          ${property.list_price?.toLocaleString?.() ?? property.list_price}
        </div>

        <div className="flex items-center gap-4 text-[#6B7280] text-sm mt-auto">
          <div className="flex items-center gap-1">
            <Bed className="h-4 w-4" />
            {property.bedrooms} Beds
          </div>
          <div className="flex items-center gap-1">
            <Bath className="h-4 w-4" />
            {property.bathrooms} Baths
          </div>
          <div className="flex items-center gap-1">
            <Maximize className="h-4 w-4" />
            {property.lot_size_sqft  ? `${property?.lot_size_sqft.toLocaleString?.() ?? '-'} sqft` : '- sqft'}
          </div>
        </div>
      </div>
    </Link>
  )
}

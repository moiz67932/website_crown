"use client"

import Image from "next/image"
import Link from "next/link"
import { Bed, Bath, Square, Heart, MapPin, HomeIcon as HomeModern, Maximize } from "lucide-react" // Added HomeModern
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Property } from "@/interfaces"


interface PropertyCardProps {
  property: Property
}

export function PropertyCard({ property }: PropertyCardProps) {
  return (
    <Link href={`/properties/${property.title.replace(/\s+/g, '-').toLowerCase()}/${property.listing_key}`} key={property.listing_key} className="bg-white  rounded-2xl shadow-lg p-0 w-full max-w-xs flex flex-col relative transition hover:shadow-xl">
    {/* Status badge */}
    <div className={`absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-xs font-semibold ${property.status === 'FOR SALE' ? 'bg-[#F47C6E] text-white' : 'bg-[#3CB4AC] text-white'}`}>{property.status}</div>
    {/* Type badge (static for now) */}
    <div className="absolute top-4 left-28 z-10 px-3 py-1 rounded-full text-xs font-medium bg-[#F6EEE7] text-[#7C6F57] border border-[#e5d8c7]">{property.property_type}</div>
    {/* Heart icon */}
    <div className="absolute top-4 right-4 z-10">
      <button className="bg-white/80 rounded-full p-2 shadow hover:bg-pink-100 transition">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#F47C6E" strokeWidth="2"><path d="M12 21C12 21 4 13.5 4 8.5C4 5.42 6.42 3 9.5 3C11.24 3 12.91 3.81 14 5.08C15.09 3.81 16.76 3 18.5 3C21.58 3 24 5.42 24 8.5C24 13.5 16 21 16 21H12Z" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
    {/* Property image */}
    <div className="h-60 bg-[#F3F4F6] flex items-center justify-center rounded-t-2xl overflow-hidden">
      <img src={property.image} alt={property.title} className="rounded-t-2xl w-full h-full object-cover" />
    </div>
    <div className="p-5 flex flex-col flex-1">
      <div className="mb-1">
        <h3 className="text-lg font-bold text-[#1CA7A6] truncate">{property.title}</h3>
        <div className="flex items-center text-[#6B7280] text-sm mt-1">
          <MapPin className="h-4 w-4 mr-1" />
          {property.location}
        </div>
      </div>
      <div className="text-2xl font-bold text-[#2D3A4A] mb-2">${property.price?.toLocaleString?.() ?? property.price}</div>
      <div className="flex items-center gap-4 text-[#6B7280] text-sm mt-auto">
        <div className="flex items-center gap-1"><Bed className="h-4 w-4" />{property.beds} Beds</div>
        <div className="flex items-center gap-1"><Bath className="h-4 w-4" />{property.baths} Baths</div>
        <div className="flex items-center gap-1"><Maximize className="h-4 w-4" />{property.sqft !== '-' ? `${property.sqft.toLocaleString?.() ?? property.sqft} sqft` : '- sqft'}</div>
      </div>
    </div>
  </Link>
  )
}

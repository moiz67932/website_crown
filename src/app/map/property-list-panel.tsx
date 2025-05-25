"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Bed, Bath, Maximize, MapPin, Heart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"

// Define the property type based on useGetListProperties.ts API response
export interface Property {
  _id: string
  listing_key: string
  image?: string
  images?: string[]
  title: string
  status: string
  statusColor?: string
  list_price: number
  current_price?: number
  bedrooms: number
  bathrooms: number
  square_feet: number
  location: string
  address: string
  city?: string
  [key: string]: any
}

interface PropertyListPanelProps {
  onPropertyClick?: () => void
  filteredPropertyIds?: string[]
  properties: Property[]
  onPropertyHover?: (id: string | null) => void
}

export default function PropertyListPanel({
  onPropertyClick,
  filteredPropertyIds,
  onPropertyHover,
  properties,
}: PropertyListPanelProps) {
  const [favoriteProperties, setFavoriteProperties] = useState<string[]>([])
  const [hoveredProperty, setHoveredProperty] = useState<string | null>(null)

  const toggleFavorite = (e: React.MouseEvent, propertyId: string) => {
    e.preventDefault()
    e.stopPropagation()

    setFavoriteProperties((prev) =>
      prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId],
    )
  }

  const handlePropertyHover = (id: string | null) => {
    setHoveredProperty(id)
    if (onPropertyHover) {
      onPropertyHover(id)
    }
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <h2 className="font-semibold text-lg text-slate-900">Properties</h2>
        <p className="text-sm text-slate-500">
          Showing <span className="font-medium">{properties.length}</span> properties
          {filteredPropertyIds && filteredPropertyIds.length > 0 && " in selected area"}
        </p>
      </div>

      {properties.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No properties found</h3>
            <p className="text-sm text-slate-600">
              {filteredPropertyIds
                ? "There are no properties in your selected area. Try drawing a different area on the map."
                : "No properties match your current filters. Try adjusting your search criteria."}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-slate-200">
            {properties.map((property) => (
              <Link
                href={`/properties/${property.address.replaceAll(' ', '-')}/${property.listing_key}`}
                key={property.listing_key}
                className={`block p-4 hover:bg-slate-50 transition-colors ${
                  hoveredProperty === property.listing_key ? "bg-slate-50" : ""
                }`}
                onClick={onPropertyClick}
                onMouseEnter={() => handlePropertyHover(property.id)}
                onMouseLeave={() => handlePropertyHover(null)}
              >
                <div className="flex gap-4">
                  <div className="relative h-24 w-40 flex-shrink-0">
                    <Image
                      src={
                        property.image ||
                        (property.images && property.images.length > 0
                          ? property.images[0]
                          : "/placeholder.svg")
                      }
                      alt={property.address}
                      fill
                      className="object-cover rounded-md"
                    />
                    <Badge
                      className={`absolute top-1 left-1 text-xs bg-green-600` }
                    >
                      {property.property_type}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-sm line-clamp-1">{property.address}</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 -mt-1 -mr-1"
                        onClick={(e) => toggleFavorite(e, property.listing_key)}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            favoriteProperties.includes(property.listing_key) ? "fill-rose-500 text-rose-500" : "text-slate-400"
                          }`}
                        />
                      </Button>
                    </div>
                    <div className="flex items-center text-slate-500 mt-1">
                      <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="text-xs line-clamp-1">{property.city}</span>
                    </div>
                    <p className="font-bold text-sm mt-1">{formatPrice(property.current_price ?? property.list_price)}</p>
                    <div className="flex gap-2 mt-2 text-xs text-slate-600">
                      <div className="flex items-center">
                        <Bed className="h-3 w-3 mr-1 text-slate-400" />
                        <span>{property.bedrooms}</span>
                      </div>
                      <div className="flex items-center">
                        <Bath className="h-3 w-3 mr-1 text-slate-400" />
                        <span>{property.bathrooms}</span>
                      </div>
                      <div className="flex items-center">
                        <Maximize className="h-3 w-3 mr-1 text-slate-400" />
                        <span>
                          {property.sqft?.toLocaleString
                            ? property.sqft.toLocaleString()
                            : property.sqft}{" "}
                          sq ft
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

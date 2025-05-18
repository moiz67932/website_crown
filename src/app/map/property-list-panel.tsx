"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Bed, Bath, Maximize, MapPin, Heart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { properties } from "../properties/property-data"
import { formatPrice } from "@/lib/utils"

interface PropertyListPanelProps {
  onPropertyClick?: () => void
  filteredPropertyIds?: string[]
  onPropertyHover?: (id: string | null) => void
}

export default function PropertyListPanel({
  onPropertyClick,
  filteredPropertyIds,
  onPropertyHover,
}: PropertyListPanelProps) {
  const [favoriteProperties, setFavoriteProperties] = useState<string[]>([])
  const [displayedProperties, setDisplayedProperties] = useState(properties)
  const [hoveredProperty, setHoveredProperty] = useState<string | null>(null)

  // Update displayed properties when filtered IDs change
  useEffect(() => {
    if (filteredPropertyIds && filteredPropertyIds.length > 0) {
      setDisplayedProperties(properties.filter((p) => filteredPropertyIds.includes(p.id)))
    } else {
      setDisplayedProperties(properties)
    }
  }, [filteredPropertyIds])

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
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <h2 className="font-semibold text-lg text-slate-900">Properties</h2>
        <p className="text-sm text-slate-500">
          Showing <span className="font-medium">{displayedProperties.length}</span> properties
          {filteredPropertyIds && filteredPropertyIds.length > 0 && " in selected area"}
        </p>
      </div>

      {displayedProperties.length === 0 ? (
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
            {displayedProperties.map((property) => (
              <Link
                href={`/properties/${property.id}`}
                key={property.id}
                className={`block p-4 hover:bg-slate-50 transition-colors ${
                  hoveredProperty === property.id ? "bg-slate-50" : ""
                }`}
                onClick={onPropertyClick}
                onMouseEnter={() => handlePropertyHover(property.id)}
                onMouseLeave={() => handlePropertyHover(null)}
              >
                <div className="flex gap-4">
                  <div className="relative h-24 w-32 flex-shrink-0">
                    <Image
                      src={property.image || "/placeholder.svg"}
                      alt={property.title}
                      fill
                      className="object-cover rounded-md"
                    />
                    <Badge
                      className={`absolute top-1 left-1 text-xs ${
                        property.status === "For Sale" ? "bg-green-600" : "bg-blue-600"
                      }`}
                    >
                      {property.status}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-sm line-clamp-1">{property.title}</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 -mt-1 -mr-1"
                        onClick={(e) => toggleFavorite(e, property.id)}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            favoriteProperties.includes(property.id) ? "fill-rose-500 text-rose-500" : "text-slate-400"
                          }`}
                        />
                      </Button>
                    </div>
                    <div className="flex items-center text-slate-500 mt-1">
                      <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="text-xs line-clamp-1">{property.location}</span>
                    </div>
                    <p className="font-bold text-sm mt-1">{formatPrice(property.price)}</p>
                    <div className="flex gap-2 mt-2 text-xs text-slate-600">
                      <div className="flex items-center">
                        <Bed className="h-3 w-3 mr-1 text-slate-400" />
                        <span>{property.beds}</span>
                      </div>
                      <div className="flex items-center">
                        <Bath className="h-3 w-3 mr-1 text-slate-400" />
                        <span>{property.baths}</span>
                      </div>
                      <div className="flex items-center">
                        <Maximize className="h-3 w-3 mr-1 text-slate-400" />
                        <span>{property.sqft.toLocaleString()} sq ft</span>
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

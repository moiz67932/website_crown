"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Bed, Bath, Maximize, MapPin, Heart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface Property {
  _id: string
  main_image_url: string
  title: string
  status: string
  statusColor: string
  list_price: number
  bedrooms: number
  bathrooms: number
  sqft: number | string
  city: string
  address: string
}

export default function PropertiesGrid({ properties }: { properties: Property[] }) {
  const [favoriteProperties, setFavoriteProperties] = useState<string[]>([])

  const toggleFavorite = (e: React.MouseEvent, propertyId: string) => {
    e.preventDefault()
    e.stopPropagation()

    setFavoriteProperties((prev) =>
      prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId],
    )
  }


  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {properties.map((property) => (
          <Link href={`/properties/${property._id}`} key={property._id}>
            <Card className="overflow-hidden h-full hover:shadow-md transition-all group">
              <div className="relative">
                <div className="relative h-48 sm:h-56 md:h-64">
                  <Image
                    src={property.main_image_url || "/placeholder.svg"}
                    alt={property.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <Badge className={`absolute top-2 left-2 md:top-3 md:left-3 text-xs ${property.statusColor}`}>
                    {property.status}
                  </Badge>
                  <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3 bg-white/90 backdrop-blur-sm rounded-md px-2 py-1 md:px-3 md:py-1 text-xs md:text-sm font-medium">
                    ${property?.list_price?.toLocaleString?.() ?? property.list_price}
                  </div>

                  {/* Favorite Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 md:top-3 md:right-3 h-8 w-8 rounded-full bg-white/80 hover:bg-white/90 text-slate-700 hover:text-rose-500"
                    onClick={(e) => toggleFavorite(e, property.id)}
                  >
                    <Heart
                      className={`h-4 w-4 ${favoriteProperties.includes(property.id) ? "fill-rose-500 text-rose-500" : ""}`}
                    />
                  </Button>
                </div>
              </div>
              <CardContent className="p-3 md:p-5">
                <h3 className="text-base md:text-xl font-semibold mb-1 md:mb-2 line-clamp-1 group-hover:text-slate-700 transition-colors">
                  {property.address}
                </h3>
                <div className="flex items-center text-slate-500 mb-2 md:mb-3">
                  <MapPin className="h-3 w-3 md:h-4 md:w-4 mr-1 flex-shrink-0" />
                  <span className="text-xs md:text-sm line-clamp-1">{property.city}</span>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm">
                  <div className="flex items-center">
                    <Bed className="h-3 w-3 md:h-4 md:w-4 mr-1 text-slate-400" />
                    <span>{property.bedrooms ?? 0} Beds</span>
                  </div>
                  <div className="flex items-center">
                    <Bath className="h-3 w-3 md:h-4 md:w-4 mr-1 text-slate-400" />
                    <span>{property.bathrooms ?? 0} Baths</span>
                  </div>
                  <div className="flex items-center">
                    <Maximize className="h-3 w-3 md:h-4 md:w-4 mr-1 text-slate-400" />
                    <span>
                      {property.sqft !== "-" ? `${property?.sqft?.toLocaleString?.() ?? property.sqft} Sq Ft` : "- Sq Ft"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" isActive>
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">2</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">4</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">5</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

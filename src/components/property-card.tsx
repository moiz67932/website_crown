"use client"

import Image from "next/image"
import Link from "next/link"
import { Bed, Bath, Square, Heart, MapPin, HomeIcon as HomeModern } from "lucide-react" // Added HomeModern
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Property {
  id: number
  title: string
  price: string
  location: string
  beds: number
  baths: number
  sqft: string
  image: string
  type: "sale" | "rent"
  tags?: string[]
  architecturalStyle?: string // New property for architectural style
}

interface PropertyCardProps {
  property: Property
}

export function PropertyCard({ property }: PropertyCardProps) {
  return (
    <div className="bg-brand-white rounded-xl shadow-medium overflow-hidden transition-all duration-300 hover:shadow-strong group">
      <Link href={`/property/${property.id}`} className="block">
        <div className="relative">
          <Image
            src={property.image || "/placeholder.svg?height=300&width=400&query=Beautiful+California+home+exterior"}
            alt={property.title}
            width={400}
            height={260}
            className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-4 left-4 flex flex-col space-y-2">
            <Badge
              variant={property.type === "sale" ? "default" : "secondary"}
              className={cn(
                "text-xs font-semibold uppercase tracking-wider py-1 px-2.5 rounded-full w-fit",
                property.type === "sale" ? "bg-brand-sunsetBlush text-white" : "bg-brand-pacificTeal text-white",
              )}
            >
              For {property.type}
            </Badge>
            {/* New Architectural Style Badge */}
            {property.architecturalStyle && (
              <Badge
                variant="outline"
                className="text-xs font-medium py-1 px-2.5 rounded-full bg-brand-goldenHour/20 text-brand-midnightCove border-brand-goldenHour/50 w-fit backdrop-blur-sm"
              >
                <HomeModern className="h-3 w-3 mr-1.5 text-brand-goldenHour" />
                {property.architecturalStyle}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 bg-brand-white/80 hover:bg-brand-white rounded-full text-brand-sunsetBlush hover:text-brand-sunsetBlush/80 transition-colors"
            onClick={(e) => {
              e.preventDefault()
              console.log("Favorite clicked")
            }}
          >
            <Heart className="h-5 w-5" />
          </Button>
          {property.tags &&
            property.tags.length > 0 &&
            !property.architecturalStyle && ( // Hide tags if arch style is shown to avoid clutter, or adjust layout
              <div className="absolute bottom-3 left-3 flex gap-2">
                {property.tags.slice(0, 1).map(
                  (
                    tag, // Show only one tag if arch style is present
                  ) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-xs bg-black/40 text-white border-none backdrop-blur-sm"
                    >
                      {tag}
                    </Badge>
                  ),
                )}
              </div>
            )}
        </div>

        <div className="p-5">
          <h3 className="text-xl font-semibold text-brand-graphitePeak mb-1 truncate group-hover:text-brand-pacificTeal transition-colors">
            {property.title}
          </h3>
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <MapPin className="h-4 w-4 mr-1.5 text-gray-400" />
            {property.location}
          </div>

          <div className="text-2xl font-bold text-brand-midnightCove mb-4">{property.price}</div>

          <div className="flex items-center justify-between text-sm text-gray-600 border-t border-brand-silverMist/30 pt-4">
            <div className="flex items-center">
              <Bed className="h-4 w-4 mr-1.5 text-brand-pacificTeal" />
              {property.beds} Beds
            </div>
            <div className="flex items-center">
              <Bath className="h-4 w-4 mr-1.5 text-brand-pacificTeal" />
              {property.baths} Baths
            </div>
            <div className="flex items-center">
              <Square className="h-4 w-4 mr-1.5 text-brand-pacificTeal" />
              {property.sqft} sqft
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

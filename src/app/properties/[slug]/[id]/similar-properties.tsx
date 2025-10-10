"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Bed, Bath, Maximize, MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Property {
  id: string
  title: string
  address: string
  price: number
  bedrooms: number
  bathrooms: number
  area: number
  image: string
  status: string
}

interface SimilarPropertiesProps {
  currentPropertyId: string
}

export default function SimilarProperties({ currentPropertyId }: SimilarPropertiesProps) {
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // In a real app, you would fetch similar properties from an API
    // For this example, we'll use mock data
    const fetchSimilarProperties = async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      const mockProperties: Property[] = [
        {
          id: "124",
          title: "Contemporary Beach House",
          address: "456 Ocean View Dr, Malibu, CA",
          price: 2450000,
          bedrooms: 3,
          bathrooms: 2.5,
          area: 2800,
          image: "/modern-beach-house.png",
          status: "For Sale",
        },
        {
          id: "125",
          title: "Luxury Oceanfront Condo",
          address: "789 Shoreline Ave, Malibu, CA",
          price: 1950000,
          bedrooms: 2,
          bathrooms: 2,
          area: 1800,
          image: "/placeholder.svg?key=uc6fl",
          status: "For Sale",
        },
        {
          id: "126",
          title: "Modern Family Home",
          address: "321 Highland Dr, Malibu, CA",
          price: 3100000,
          bedrooms: 5,
          bathrooms: 4,
          area: 3600,
          image: "/placeholder.svg?key=gay6l",
          status: "For Sale",
        },
      ]

      setProperties(mockProperties)
      setIsLoading(false)
    }

    fetchSimilarProperties()
  }, [currentPropertyId])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <div className="h-48 bg-muted animate-pulse" />
            <CardContent className="p-4">
              <div className="h-6 bg-muted animate-pulse rounded mb-2" />
              <div className="h-4 bg-muted animate-pulse rounded w-3/4 mb-4" />
              <div className="flex gap-4">
                <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
                <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
                <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => (
        <Link href={`/properties/${property.id}`} key={property.id}>
          <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
            <div className="relative h-48">
              <Image src={property.image || "/placeholder-image.jpg"} alt={property.title} fill className="object-cover" onError={(e) => { try { (e.currentTarget as HTMLImageElement).src = '/placeholder-image.jpg' } catch {} }} />
              <Badge className="absolute top-2 left-2 bg-primary">{property.status}</Badge>
            </div>
            <CardContent className="p-4">
              <div className="text-xl font-semibold mb-1 line-clamp-1">{property.title}</div>
              <div className="flex items-center text-sm text-muted-foreground mb-3">
                <MapPin className="h-3 w-3 mr-1" />
                <span className="line-clamp-1">{property.address}</span>
              </div>
              <div className="text-lg font-bold text-primary mb-3">${property.price.toLocaleString()}</div>
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center">
                  <Bed className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>{property.bedrooms} Beds</span>
                </div>
                <div className="flex items-center">
                  <Bath className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>{property.bathrooms} Baths</span>
                </div>
                <div className="flex items-center">
                  <Maximize className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>{property.area.toLocaleString()} Sq Ft</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

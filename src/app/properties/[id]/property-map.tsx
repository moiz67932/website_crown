"use client"

import { useEffect, useRef } from "react"
import { MapPin } from "lucide-react"

interface PropertyMapProps {
  location: {
    lat: number
    lng: number
  }
  address: string
}

export default function PropertyMap({ location, address }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // In a real application, you would integrate with Google Maps, Mapbox, etc.
    // For this example, we'll just show a placeholder
  }, [location])

  return (
    <div className="relative h-[300px] rounded-lg overflow-hidden bg-muted">
      <div ref={mapRef} className="h-full w-full">
        {/* Placeholder for map */}
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <MapPin className="h-10 w-10 text-primary" />
          <p className="mt-2 text-center max-w-xs px-4">{address}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
          </p>
        </div>
      </div>
    </div>
  )
}

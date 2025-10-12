"use client"

import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet"
import type { Map as LeafletMap } from "leaflet"
import "leaflet/dist/leaflet.css"
import { useEffect, useState, useMemo, useCallback } from "react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { createCustomIcon } from "@/app/map/property-map"
import { useRouter } from "next/navigation"

// Component to handle map bounds
function MapBoundsController({ bounds }: { bounds: [number, number, number, number] }) {
  const map = useMap()

  useEffect(() => {
    map.fitBounds([
      [bounds[0], bounds[1]], // Southwest coordinates
      [bounds[2], bounds[3]] // Northeast coordinates
    ])
  }, [bounds, map])

  return null
}

function CityMap({ bounds, properties }: { bounds: [number, number, number, number]; properties: any[] }) {
  const router = useRouter()

  // Render only after client mount to avoid double initialization in React 18 StrictMode
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // Ensure Leaflet default icon URLs are set on client
  useEffect(() => {
    ;(async () => {
      try {
        const L = await import("leaflet")
        // @ts-ignore: private property
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "leaflet/dist/images/marker-icon-2x.png",
          iconUrl: "leaflet/dist/images/marker-icon.png",
          shadowUrl: "leaflet/dist/images/marker-shadow.png",
        })
      } catch {
        // ignore
      }
    })()
  }, [])

  const validProperties = Array.isArray(properties)
    ? properties.filter(
        (property) =>
          property &&
          typeof property.latitude === "number" &&
          typeof property.longitude === "number" &&
          !isNaN(property.latitude) &&
          !isNaN(property.longitude)
      )
    : []

  const navigateToProperty = (address: string, propertyId: string) => {
    router.push(`/properties/${address.replaceAll(" ", "-")}/${propertyId}`)
  }

  const [selectedProperty, setSelectedProperty] = useState<string | null>(null)
  const [hoveredProperty, setHoveredProperty] = useState<string | null>(null)

  const swLat = typeof bounds[0] === "number" ? bounds[0] : 0
  const swLng = typeof bounds[1] === "number" ? bounds[1] : 0
  const neLat = typeof bounds[2] === "number" ? bounds[2] : 0
  const neLng = typeof bounds[3] === "number" ? bounds[3] : 0

  const centerLat = (swLat + neLat) / 2
  const centerLng = (swLng + neLng) / 2

  // Stable key per bounds to ensure MapContainer remounts when area changes, but not on every render
  const mapKey = useMemo(() => `${swLat},${swLng},${neLat},${neLng}`,[swLat, swLng, neLat, neLng])

  const handlePropertyClick = (propertyId: string) => {
    setSelectedProperty(propertyId)
  }

  // Keep a handle to the Leaflet map instance to ensure proper cleanup on unmount
  const [leafletMap, setLeafletMap] = useState<LeafletMap | null>(null)
  useEffect(() => {
    return () => {
      try {
        leafletMap?.remove?.()
      } catch {}
    }
  }, [leafletMap])
  const mapRef = useCallback((map: LeafletMap | null) => {
    if (map) setLeafletMap(map)
  }, [])

  if (!mounted) return null

  return (
    <MapContainer
      key={mapKey}
      center={[centerLat, centerLng]}
      zoom={10}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={false}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapBoundsController bounds={[swLat, swLng, neLat, neLng]} />
      {validProperties.map((property) => (
        <Marker
          key={property.id}
          position={[property.latitude || 0, property.longitude || 0]}
          icon={createCustomIcon(property.current_price ?? property.list_price, property.status, property.property_type)}
          eventHandlers={{
            click: () => handlePropertyClick(property.id),
            mouseover: () => setHoveredProperty(property.id),
            mouseout: () => setHoveredProperty(null),
          }}
        >
          <Popup className="property-popup" closeButton={true} closeOnClick={false} maxWidth={300}>
            <div className="property-popup-content w-64">
              <div className="relative h-32 w-full mb-2">
                <img
                  src={
                    property.images?.[0] ||
                    property.main_photo_url ||
                    property.main_image_url ||
                    "/placeholder-image.jpg"
                  }
                  alt={property.address}
                  className="h-full w-full object-cover rounded-md"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).src = "/placeholder-image.jpg"
                  }}
                />
                <div
                  className={`absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-medium text-white ${
                    property.property_type === "For Sale" ? "bg-green-600" : "bg-blue-600"
                  }`}
                >
                  {property.property_type}
                </div>
              </div>
              <h3 className="font-semibold text-sm mb-1">{property.address}</h3>
              <p className="text-slate-600 text-xs mb-1">{property.city}</p>
              <p className="font-bold text-sm">${property.current_price?.toLocaleString()}</p>
              <div className="flex gap-2 mt-2 text-xs text-slate-600">
                <span>{property.bedrooms} beds</span>
                <span>•</span>
                <span>{property.bathrooms} baths</span>
                <span>•</span>
                <span>
                  {property.living_area_sqft
                    ? `${property?.living_area_sqft?.toLocaleString?.() ?? property.living_area_sqft} Sq Ft`
                    : `${property?.lot_size_sqft?.toLocaleString?.() ?? property.lot_size_sqft} sq ft`}
                </span>
              </div>

              {/* Features */}
              {property.features && property.features.length > 0 && (
                <div className="mt-2">
                  <div className="flex flex-wrap gap-1">
                    {property.features.slice(0, 3).map((feature: string) => (
                      <Badge key={feature} variant="outline" className="text-xs bg-slate-50">
                        {feature}
                      </Badge>
                    ))}
                    {property.features.length > 3 && (
                      <Badge variant="outline" className="text-xs bg-slate-50">
                        +{property.features.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <Button
                  className="flex-1 bg-slate-800 hover:bg-slate-900 text-white text-xs py-1.5 px-3 rounded-md"
                  onClick={() => navigateToProperty(property.address, property.listing_key)}
                >
                  View Details
                </Button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

export default function CityMapInner({ bounds, properties }: { bounds: [number, number, number, number]; properties: any[] }) {
  return <CityMap bounds={bounds} properties={properties} />
}

"use client"

import { useState, useEffect, useMemo, useRef, Suspense } from "react"
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, Polygon as LeafletPolygon } from "react-leaflet"
import L from "leaflet"
import * as turf from "@turf/turf"
import type { Feature, Polygon as TurfPolygon } from "geojson"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Trash2, MapPin, CircleIcon, BarChart3, ChevronDown, ChevronUp, ViewIcon as StreetView } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import PropertyStatistics from "./property-statistics"
import { useRouter } from "next/navigation"
import StreetViewModal from "@/components/shared/street-view-model"
import useGetListProperties from "@/hooks/queries/useGetListProperties" // <-- Import the hook

// Import Leaflet CSS
import "leaflet/dist/leaflet.css"
import "leaflet-draw/dist/leaflet.draw.css"

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

// Custom marker icons
const createCustomIcon = (price: number, status: string, propertyType: string, isInSearchArea = false) => {
  // Determine icon color based on status
  const bgColor = status === "For Sale" ? "bg-green-600" : "bg-blue-600"

  // Determine icon based on property type
  let icon = `<Home class="h-3 w-3 mr-1" />`
  if (propertyType.toLowerCase().includes("apartment")) {
    icon = `<Building class="h-3 w-3 mr-1" />`
  }
  return L.divIcon({
    className: "custom-marker-icon",
    html: `
      <div class="${bgColor} ${
        isInSearchArea ? "ring-2 ring-yellow-400 ring-offset-2" : ""
      } text-white px-2 py-1 rounded-lg shadow-md text-xs font-semibold whitespace-nowrap flex items-center">
        ${formatPrice(price)}
      </div>
    `,
    iconSize: [80, 30],
    iconAnchor: [40, 15],
  })
}

// California polygon coordinates (approximate, simplified for demo)
// Format: [lat, lng]
const californiaPolygonLatLngs = [
  [42.0095, -124.4096], // NW corner (Oregon border)
  [41.9983, -123.6237],
  [41.9983, -122.3789],
  [41.9983, -121.0370],
  [41.9983, -120.0019], // NE corner
  [39.0021, -120.0037],
  [37.5555, -117.9575],
  [36.3594, -116.3699],
  [35.0019, -114.6335], // SE corner (Arizona border)
  [34.9659, -114.6382],
  [34.9107, -114.6286],
  [34.8758, -114.6382],
  [34.8454, -114.5977],
  [34.7890, -114.5685],
  [34.7269, -114.4966],
  [34.6648, -114.4503],
  [34.6581, -114.4599],
  [34.5869, -114.4324],
  [34.5235, -114.3785],
  [34.4601, -114.3867],
  [34.4500, -114.3362],
  [34.4375, -114.3036],
  [34.4024, -114.2672],
  [34.3559, -114.1865],
  [34.3049, -114.1386],
  [34.2561, -114.1317],
  [34.2596, -114.1650],
  [34.2044, -114.2241],
  [34.1914, -114.2224],
  [34.1720, -114.2900],
  [34.1368, -114.3236],
  [34.1186, -114.3621],
  [34.1118, -114.4084],
  [34.0856, -114.4366],
  [34.0276, -114.4336],
  [33.9582, -114.5111],
  [33.9308, -114.5361],
  [33.9058, -114.5096],
  [33.8613, -114.5257],
  [33.8248, -114.5210],
  [33.7597, -114.5056],
  [33.7083, -114.4946],
  [33.6832, -114.5282],
  [33.6363, -114.5249],
  [33.5895, -114.4974],
  [33.5528, -114.5249],
  [33.5311, -114.5249],
  [33.5070, -114.5352],
  [33.4418, -114.5249],
  [33.4142, -114.5122],
  [33.4039, -114.5352],
  [33.3576, -114.5257],
  [33.3041, -114.5122],
  [33.2858, -114.5282],
  [33.2751, -114.4974],
  [32.7556, -117.2468], // San Diego
  [32.5343, -117.1278], // SW corner (Mexico border)
  [32.7500, -117.2500], // Back up the coast
  [33.0000, -118.0000],
  [34.0000, -120.0000],
  [35.0000, -122.0000],
  [36.0000, -123.0000],
  [37.0000, -123.5000],
  [38.0000, -123.8000],
  [39.0000, -124.0000],
  [40.0000, -124.2000],
  [41.0000, -124.3000],
  [42.0095, -124.4096], // Close the polygon
]

// Convert to [lat, lng] for react-leaflet Polygon
const californiaPolygonLatLngsLeaflet: [number, number][] = californiaPolygonLatLngs.map(([lat, lng]) => [lat, lng] as [number, number])

// Convert to GeoJSON polygon for turf
const californiaPolygonGeoJSON: Feature<TurfPolygon> = {
  type: "Feature",
  geometry: {
    type: "Polygon",
    coordinates: [
      californiaPolygonLatLngs.map(([lat, lng]) => [lng, lat])
    ]
  },
  properties: {}
}

// Component to handle map location updates
function MapLocationController({
  center,
  locationQuery,
}: {
  center: [number, number]
  locationQuery: string | null
}) {
  const map = useMap()

  // Set initial center
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])

  // Handle location query if provided
  useEffect(() => {
    if (!locationQuery) return

    // Simple geocoding simulation - in a real app, use a geocoding service
    const searchLocation = async () => {
      try {

        // This is a simplified example - in a real app, use a proper geocoding service
        // For demo purposes, we'll set different locations based on common searches
        let searchCenter: [number, number] = [34.0522, -118.2437] // Default to Los Angeles

        // Simple location matching for demo purposes
        if (locationQuery.toLowerCase().includes("los-angeles-county")) {
          searchCenter = [34.0522, -118.2437]
        } else if (locationQuery.toLowerCase().includes("orange-county")) {
          searchCenter = [33.7175, -117.8311]
        } else if (locationQuery.toLowerCase().includes("san-diego-county")) {
          searchCenter = [32.7157, -117.1611]
        } else if (locationQuery.toLowerCase().includes("santa-clara-county")) {
          searchCenter = [37.3541, -121.9552]
        } else if (locationQuery.toLowerCase().includes("alameda-county")) {
          searchCenter = [37.6017, -121.7195]
        }

        // Zoom to the location
        map.setView(searchCenter, 12)


      } catch (error) {
        console.error("Error searching location:", error)
      }
    }

    searchLocation()
  }, [locationQuery, map])

  return null
}

// Format distance in a user-friendly way
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  } else {
    const km = meters / 1000
    return `${km.toFixed(1)} km`
  }
}

interface PropertyMapProps {
  filteredPropertyIds?: string[]
  initialLocationQuery?: string | null
}

function PropertyMapContent({ filteredPropertyIds, initialLocationQuery = null }: PropertyMapProps) {
  const router = useRouter()

  // Center the map on California
  const center = useMemo<[number, number]>(() => {
    // Approximate center of California
    return [36.7783, -119.4179]
  }, [])

  // Determine the county from the initialLocationQuery
  const county = useMemo(() => {
    if (!initialLocationQuery) return null
    if (initialLocationQuery.toLowerCase().includes("los-angeles-county")) return "Los Angeles"
    if (initialLocationQuery.toLowerCase().includes("orange-county")) return "Orange"
    if (initialLocationQuery.toLowerCase().includes("san-diego-county")) return "San Diego"
    if (initialLocationQuery.toLowerCase().includes("santa-clara-county")) return "Santa Clara"
    if (initialLocationQuery.toLowerCase().includes("alameda-county")) return "Alameda"
    return null
  }, [initialLocationQuery])

  // --- Use the hook to get 100 properties, filtered by county if available ---
  const { data: properties = {listings: [], total_items: 0}, isLoading, isError } = useGetListProperties({ limit: 100, county: county ?? undefined })

  const [selectedProperty, setSelectedProperty] = useState<string | null>(null)
  // California polygon is always drawn, so set as default
  const [drawnShape, setDrawnShape] = useState<any>(californiaPolygonGeoJSON)
  const [shapeType, setShapeType] = useState<"polygon" | "circle" | null>("polygon")
  const [circleRadius, setCircleRadius] = useState<number | null>(null)
  const [circleCenter, setCircleCenter] = useState<[number, number] | null>(null)
  const [propertiesInSearchArea, setPropertiesInSearchArea] = useState<string[]>([])
  const [propertiesInAreaData, setPropertiesInAreaData] = useState<any[]>([])
  // Drawing is disabled, since California is always drawn
  const [isDrawingEnabled, setIsDrawingEnabled] = useState(false)
  const [activeDrawTool, setActiveDrawTool] = useState<"polygon" | "circle" | null>(null)
  const [showStatistics, setShowStatistics] = useState(false)
  const [hoveredProperty, setHoveredProperty] = useState<string | null>(null)
  const [streetViewOpen, setStreetViewOpen] = useState(false)
  const [streetViewProperty, setStreetViewProperty] = useState<any | null>(null)
  const featureGroupRef = useRef<L.FeatureGroup>(null)
  const mapRef = useRef<L.Map | null>(null)
  const hasSearchArea = true // Always true, since California is always drawn

  // Determine which properties to display based on filters and drawn area
  const displayedProperties = useMemo(() => {
    if (!properties || properties.length === 0) return []
    
    let displayProps = properties.listings

    // Apply filters if provided
    // if (filteredPropertyIds && filteredPropertyIds.length > 0) {
    //   displayProps = displayProps.filter((p: any) => filteredPropertyIds.includes(p.id))
    // }

    // Always filter by California polygon
    // displayProps = displayProps.filter((p: any) => propertiesInSearchArea.includes(p.id))

    return displayProps
  }, [filteredPropertyIds, propertiesInSearchArea, properties])
  // Filter properties based on California polygon
  useEffect(() => {
    // Defensive: only run if properties is a stable array (not recreated every render)
    // if (!Array.isArray(properties) || properties.length === 0) {
    //   setPropertiesInSearchArea([])
    //   setPropertiesInAreaData([])
    //   return
    // }

    // Memoize the calculation to avoid unnecessary state updates
    const filtered = properties.listings.reduce(
      (acc: { ids: string[]; data: any[] }, property: any) => {
        if (!property.lat || !property.lng) return acc
        const point = turf.point([property.lng, property.lat])
        if (turf.booleanPointInPolygon(point, californiaPolygonGeoJSON)) {
          acc.ids.push(property.id)
          acc.data.push(property)
        }
        return acc
      },
      { ids: [], data: [] }
    )

    // Only update state if values have actually changed to avoid infinite loops
    setPropertiesInSearchArea(prev =>
      JSON.stringify(prev) === JSON.stringify(filtered.ids) ? prev : filtered.ids
    )
    setPropertiesInAreaData(prev =>
      JSON.stringify(prev) === JSON.stringify(filtered.data) ? prev : filtered.data
    )
  }, [properties])

  // Drawing controls are disabled, so these handlers are not used
  const handleDrawCreated = () => {}
  const handleDrawDeleted = () => {}
  const handleDrawEdited = () => {}
  const clearDrawnShape = () => {}
  const activateDrawTool = () => {}

  const handlePropertyClick = (propertyId: string) => {
    setSelectedProperty(propertyId)
  }

  const navigateToProperty = (propertyId: string) => {
    router.push(`/properties/${propertyId}`)
  }

  const openStreetView = (property: any) => {
    setStreetViewProperty(property)
    setStreetViewOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <span>Loading properties...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <span>Failed to load properties.</span>
      </div>
    )
  }

  return (
    <>
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <div className="bg-white rounded-md shadow-md p-3">
          <h3 className="text-sm font-semibold mb-2">California Area</h3>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                className="bg-slate-800"
                disabled
              >
                <MapPin className="h-4 w-4 mr-2" />
                California Area
              </Button>
              <Button
                size="sm"
                variant="outline"
                className=""
                disabled
              >
                <CircleIcon className="h-4 w-4 mr-2" />
                Draw Radius
              </Button>
            </div>
            <Button size="sm" variant="outline" disabled>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">{properties.total_items}</span> properties
                  found in California
                </p>
                {propertiesInSearchArea.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 -mr-1"
                    onClick={() => setShowStatistics(!showStatistics)}
                  >
                    <BarChart3 className="h-3.5 w-3.5 mr-1" />
                    Stats
                    {showStatistics ? (
                      <ChevronUp className="h-3.5 w-3.5 ml-1" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 ml-1" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-md shadow-md p-3">
          <p className="text-xs text-slate-600">
            The area of California is highlighted on the map. All properties shown are within California.
          </p>
        </div>
        {/* Statistics Panel */}
        {showStatistics && propertiesInAreaData.length > 0 && <PropertyStatistics properties={propertiesInAreaData} />}
      </div>

      <MapContainer
        center={center}
        zoom={7}
        maxZoom={18}
        minZoom={6}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />
        <MapLocationController center={center} locationQuery={initialLocationQuery} />

        {/* California Polygon Area */}
        <LeafletPolygon
          positions={californiaPolygonLatLngsLeaflet}
          pathOptions={{
            fillOpacity: 0,
          }}
        />

        {/* Property Markers */}
        {displayedProperties.map((property: any) => {
          const isInSearchArea = propertiesInSearchArea.includes(property.id)
          const isFiltered = filteredPropertyIds ? filteredPropertyIds.includes(property.id) : true
          const shouldShow = true;
          const isSelected = selectedProperty === property.id
          const isHovered = hoveredProperty === property.id

          // Determine property type for icon
          // const propertyType = property.title?.toLowerCase().includes("apartment")
          //   ? "apartment"
          //   : property.title?.toLowerCase().includes("condo")
          //     ? "condo"
          //     : "house"
          const propertyType = property.property_type
          return shouldShow ? (
            <Marker
              key={property.id}
              position={[property.latitude || 0, property.longitude || 0]}
              icon={createCustomIcon(
                property.current_price ?? property.list_price,
                property.status,
                propertyType,
                isInSearchArea || isSelected || isHovered,
              )}
              eventHandlers={{
                click: () => handlePropertyClick(property.id),
                mouseover: () => setHoveredProperty(property.id),
                mouseout: () => setHoveredProperty(null),
              }}
              zIndexOffset={isSelected || isHovered ? 1000 : 0}
            >
              <Popup
                className="property-popup"
                closeButton={true}
                closeOnClick={false}
                // onClose={() => setSelectedProperty(null)}
                maxWidth={300}
              >
                <div className="property-popup-content w-64">
                  <div className="relative h-32 w-full mb-2">
                    <img
                      src={property.images[0] || "/placeholder.svg"}
                      alt={property.address}
                      className="h-full w-full object-cover rounded-md"
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
                    <span>                      {property.living_area_sqft ? `${property?.living_area_sqft?.toLocaleString?.() ?? property.living_area_sqft} Sq Ft` : `${property?.lot_size_sqft?.toLocaleString?.() ?? property.lot_size_sqft} sq ft`}                    </span>
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
                      onClick={() => navigateToProperty(property.listing_key)}
                    >
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" className="flex-none" onClick={() => openStreetView(property)}>
                      <StreetView className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ) : null
        })}
      </MapContainer>

      {/* Street View Modal */}
      {streetViewProperty && (
        <StreetViewModal
          isOpen={streetViewOpen}
          onClose={() => setStreetViewOpen(false)}
          location={{
            lat: streetViewProperty.lat ?? 0, 
            lng: streetViewProperty.lng ?? 0
          }}
          address={streetViewProperty.location}
        />
      )}
    </>
  )
}

export default function PropertyMap(props: PropertyMapProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full w-full">
        <span>Loading map...</span>
      </div>
    }>
      <PropertyMapContent {...props} />
    </Suspense>
  )
}

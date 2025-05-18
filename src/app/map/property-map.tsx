"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, FeatureGroup, Circle } from "react-leaflet"
import { EditControl } from "react-leaflet-draw"
import L from "leaflet"
import * as turf from "@turf/turf"
import { properties } from "../properties/property-data"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Trash2, MapPin, CircleIcon, BarChart3, ChevronDown, ChevronUp, ViewIcon as StreetView } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import PropertyStatistics from "./property-statistics"
import { useRouter } from "next/navigation"
import StreetViewModal from "@/components/shared/street-view-model"

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

// Component to recenter map when properties change
function MapController({ center }: { center: [number, number] }) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])

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
}

export default function PropertyMap({ filteredPropertyIds }: PropertyMapProps) {
  const router = useRouter()

  // Calculate center of all properties
  const center = useMemo<[number, number]>(() => {
    if (properties.length === 0) return [34.0522, -118.2437] // Default to LA

    const lats = properties.map((p) => p.lat || 0)
    const lngs = properties.map((p) => p.lng || 0)

    const avgLat = lats.reduce((sum, lat) => sum + lat, 0) / lats.length
    const avgLng = lngs.reduce((sum, lng) => sum + lng, 0) / lngs.length


    return [avgLat, avgLng]
  }, [])

  const [selectedProperty, setSelectedProperty] = useState<string | null>(null)
  const [drawnShape, setDrawnShape] = useState<any>(null)
  const [shapeType, setShapeType] = useState<"polygon" | "circle" | null>(null)
  const [circleRadius, setCircleRadius] = useState<number | null>(null)
  const [circleCenter, setCircleCenter] = useState<[number, number] | null>(null)
  const [propertiesInSearchArea, setPropertiesInSearchArea] = useState<string[]>([])
  const [propertiesInAreaData, setPropertiesInAreaData] = useState<typeof properties>([])
  const [isDrawingEnabled, setIsDrawingEnabled] = useState(false)
  const [activeDrawTool, setActiveDrawTool] = useState<"polygon" | "circle" | null>(null)
  const [showStatistics, setShowStatistics] = useState(false)
  const [hoveredProperty, setHoveredProperty] = useState<string | null>(null)
  const [streetViewOpen, setStreetViewOpen] = useState(false)
  const [streetViewProperty, setStreetViewProperty] = useState<(typeof properties)[0] | null>(null)
  const featureGroupRef = useRef<L.FeatureGroup>(null)
  const mapRef = useRef<L.Map | null>(null)
  const hasSearchArea = Boolean(drawnShape || circleCenter)

  // Determine which properties to display based on filters and drawn area
  const displayedProperties = useMemo(() => {
    let displayProps = properties

    // Apply filters if provided
    if (filteredPropertyIds && filteredPropertyIds.length > 0) {
      displayProps = displayProps.filter((p) => filteredPropertyIds.includes(p.id))
    }

    // Apply drawn area filter if active
    if (hasSearchArea) {
      displayProps = displayProps.filter((p) => propertiesInSearchArea.includes(p.id))
    }

    return displayProps
  }, [filteredPropertyIds, propertiesInSearchArea, hasSearchArea])

  // Filter properties based on drawn shape
  useEffect(() => {
    if (!drawnShape && !circleCenter) {
      setPropertiesInSearchArea([])
      setPropertiesInAreaData([])
      return
    }

    const propertiesInArea: string[] = []
    let propertiesData: typeof properties = []

    if (shapeType === "polygon" && drawnShape) {
      // Filter properties within polygon
      propertiesData = properties.filter((property) => {
        if (!property.lat || !property.lng) return false

        const point = turf.point([property.lng, property.lat])
        const isInArea = turf.booleanPointInPolygon(point, drawnShape)

        if (isInArea) {
          propertiesInArea.push(property.id)
        }

        return isInArea
      })
    } else if (shapeType === "circle" && circleCenter && circleRadius) {
      // Filter properties within circle radius
      propertiesData = properties.filter((property) => {
        if (!property.lat || !property.lng) return false

        const from = turf.point([circleCenter[1], circleCenter[0]])
        const to = turf.point([property.lng, property.lat])
        const distance = turf.distance(from, to, { units: "meters" })

        const isInArea = distance <= circleRadius

        if (isInArea) {
          propertiesInArea.push(property.id)
        }

        return isInArea
      })
    }

    setPropertiesInSearchArea(propertiesInArea)
    setPropertiesInAreaData(propertiesData)
  }, [drawnShape, shapeType, circleCenter, circleRadius])

  // Handle draw events
  const handleDrawCreated = (e: any) => {
    const { layerType, layer } = e

    if (layerType === "polygon" || layerType === "rectangle") {
      // Convert Leaflet layer to GeoJSON
      const drawnPolygon = layer.toGeoJSON()
      setDrawnShape(drawnPolygon)
      setShapeType("polygon")
      setCircleCenter(null)
      setCircleRadius(null)

      // Fit map to the drawn area bounds
      if (mapRef.current) {
        mapRef.current.fitBounds(layer.getBounds())
      }
    } else if (layerType === "circle") {
      const center = layer.getLatLng()
      const radius = layer.getRadius()

      setCircleCenter([center.lat, center.lng])
      setCircleRadius(radius)
      setShapeType("circle")
      setDrawnShape(null)

      // Fit map to the circle bounds
      if (mapRef.current) {
        mapRef.current.fitBounds(layer.getBounds())
      }
    }

    setActiveDrawTool(null)
    setShowStatistics(true)
  }

  const handleDrawDeleted = () => {
    setDrawnShape(null)
    setShapeType(null)
    setCircleCenter(null)
    setCircleRadius(null)
    setShowStatistics(false)
  }

  const handleDrawEdited = (e: any) => {
    const editedLayers = e.layers

    editedLayers.eachLayer((layer: any) => {
      if (layer instanceof L.Polygon) {
        setDrawnShape(layer.toGeoJSON())
        setShapeType("polygon")
        setCircleCenter(null)
        setCircleRadius(null)
      } else if (layer instanceof L.Circle) {
        const center = layer.getLatLng()
        const radius = layer.getRadius()

        setCircleCenter([center.lat, center.lng])
        setCircleRadius(radius)
        setShapeType("circle")
        setDrawnShape(null)
      }
    })
  }

  const clearDrawnShape = () => {
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers()
    }
    setDrawnShape(null)
    setShapeType(null)
    setCircleCenter(null)
    setCircleRadius(null)
    setShowStatistics(false)
  }

  const activateDrawTool = (tool: "polygon" | "circle") => {
    setIsDrawingEnabled(true)
    setActiveDrawTool(tool)
  }

  const handlePropertyClick = (propertyId: string) => {
    setSelectedProperty(propertyId)
  }

  const navigateToProperty = (propertyId: string) => {
    router.push(`/properties/${propertyId}`)
  }

  const openStreetView = (property: (typeof properties)[0]) => {
    setStreetViewProperty(property)
    setStreetViewOpen(true)
  }

  return (
    <>
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <div className="bg-white rounded-md shadow-md p-3">
          <h3 className="text-sm font-semibold mb-2">Draw Search Area</h3>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={activeDrawTool === "polygon" ? "default" : "outline"}
                className={activeDrawTool === "polygon" ? "bg-slate-800" : ""}
                onClick={() => activateDrawTool("polygon")}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Draw Area
              </Button>

              <Button
                size="sm"
                variant={activeDrawTool === "circle" ? "default" : "outline"}
                className={activeDrawTool === "circle" ? "bg-slate-800" : ""}
                onClick={() => activateDrawTool("circle")}
              >
                <CircleIcon className="h-4 w-4 mr-2" />
                Draw Radius
              </Button>
            </div>

            <Button size="sm" variant="outline" onClick={clearDrawnShape} disabled={!hasSearchArea}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          {hasSearchArea && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">{propertiesInSearchArea.length}</span> properties
                    found
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

                {shapeType === "circle" && circleRadius && (
                  <Badge variant="outline" className="self-start text-xs bg-slate-50">
                    Radius: {formatDistance(circleRadius)}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {!hasSearchArea && !isDrawingEnabled && (
          <div className="bg-white rounded-md shadow-md p-3">
            <p className="text-xs text-slate-600">
              Draw a custom area or radius on the map to find properties and view market statistics.
            </p>
          </div>
        )}

        {isDrawingEnabled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md shadow-md p-3">
            <p className="text-xs text-yellow-800">
              <span className="font-semibold">Drawing mode active.</span>{" "}
              {activeDrawTool === "polygon"
                ? "Click on the map to start drawing a polygon. Double-click to complete."
                : "Click on the map and drag to create a radius circle."}
            </p>
          </div>
        )}

        {/* Statistics Panel */}
        {showStatistics && propertiesInAreaData.length > 0 && <PropertyStatistics properties={propertiesInAreaData} />}
      </div>

      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />
        <MapController center={center} />

        {/* Drawing Controls */}
        <FeatureGroup ref={featureGroupRef}>
          {isDrawingEnabled && (
            <EditControl
              position="topright"
              onCreated={handleDrawCreated}
              onEdited={handleDrawEdited}
              onDeleted={handleDrawDeleted}
              draw={{
                rectangle: activeDrawTool === "polygon",
                polygon: activeDrawTool === "polygon",
                polyline: false,
                circle: activeDrawTool === "circle",
                circlemarker: false,
                marker: false,
              }}
            />
          )}
        </FeatureGroup>

        {/* Render circle if we have circle data */}
        {circleCenter && circleRadius && (
          <Circle
            center={circleCenter}
            radius={circleRadius}
            pathOptions={{
              color: "#3b82f6",
              fillColor: "#3b82f6",
              fillOpacity: 0.1,
              weight: 2,
            }}
          />
        )}

        {/* Property Markers */}
        {properties.map((property) => {
          const isInSearchArea = propertiesInSearchArea.includes(property.id)
          const isFiltered = filteredPropertyIds ? filteredPropertyIds.includes(property.id) : true
          const shouldShow = (!hasSearchArea || isInSearchArea) && isFiltered
          const isSelected = selectedProperty === property.id
          const isHovered = hoveredProperty === property.id

          // Determine property type for icon
          const propertyType = property.title.toLowerCase().includes("apartment")
            ? "apartment"
            : property.title.toLowerCase().includes("condo")
              ? "condo"
              : "house"

          return shouldShow ? (
            <Marker
              key={property.id}
              position={[property.lat || 0, property.lng || 0]}
              icon={createCustomIcon(
                property.price,
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
                // onClose={() => {
                //   setSelectedProperty(null);
                // }}
                maxWidth={300}
              >
                <div className="property-popup-content w-64">
                  <div className="relative h-32 w-full mb-2">
                    <img
                      src={property.image || "/placeholder.svg"}
                      alt={property.title}
                      className="h-full w-full object-cover rounded-md"
                    />
                    <div
                      className={`absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-medium text-white ${
                        property.status === "For Sale" ? "bg-green-600" : "bg-blue-600"
                      }`}
                    >
                      {property.status}
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{property.title}</h3>
                  <p className="text-slate-600 text-xs mb-1">{property.location}</p>
                  <p className="font-bold text-sm">${property.price.toLocaleString()}</p>
                  <div className="flex gap-2 mt-2 text-xs text-slate-600">
                    <span>{property.beds} beds</span>
                    <span>•</span>
                    <span>{property.baths} baths</span>
                    <span>•</span>
                    <span>{property.sqft.toLocaleString()} sq ft</span>
                  </div>

                  {/* Features */}
                  {property.features && property.features.length > 0 && (
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-1">
                        {property.features.slice(0, 3).map((feature) => (
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
                      onClick={() => navigateToProperty(property.id)}
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

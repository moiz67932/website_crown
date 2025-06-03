"use client"

import { MapContainer, TileLayer, Rectangle, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import dynamic from "next/dynamic"
import { useEffect } from "react"

// Component to handle map bounds
function MapBoundsController({ bounds }: { bounds: [number, number, number, number] }) {
  const map = useMap()
  
  useEffect(() => {
    map.fitBounds([
      [bounds[0], bounds[1]], // Southwest coordinates
      [bounds[2], bounds[3]]  // Northeast coordinates
    ])
  }, [bounds, map])

  return null
}

// City Map Component
function CityMap({ bounds }: { bounds: [number, number, number, number] }) {
  return (
    <MapContainer
      center={[(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2]}
      zoom={10}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Rectangle
        bounds={[
          [bounds[0], bounds[1]], // Southwest coordinates
          [bounds[2], bounds[3]]  // Northeast coordinates
        ]}
        pathOptions={{
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.1,
          weight: 2
        }}
      />
      <MapBoundsController bounds={bounds} />
    </MapContainer>
  )
}

// Dynamically import both react-leaflet and the map component to avoid SSR issues
const MapWithNoSSR = dynamic(
  () => import("leaflet").then((L) => {
    // This is needed for leaflet icons to work
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "leaflet/dist/images/marker-icon-2x.png",
      iconUrl: "leaflet/dist/images/marker-icon.png",
      shadowUrl: "leaflet/dist/images/marker-shadow.png",
    })
    return Promise.resolve(CityMap)
  }),
  {
    ssr: false,
  }
)

interface CityMapWrapperProps {
  bounds: [number, number, number, number]
}

export default function CityMapWrapper({ bounds }: CityMapWrapperProps) {
  return (
    <div className="aspect-video bg-gray-200 rounded-xl shadow-medium overflow-hidden">
      <MapWithNoSSR bounds={bounds} />
    </div>
  )
} 
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

// Dynamically import the map components to avoid SSR issues
const MapWithNoSSR = dynamic(() => Promise.resolve(CityMap), {
  ssr: false,
})

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
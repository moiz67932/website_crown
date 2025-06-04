"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

// Dynamically import react-leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then(mod => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import("react-leaflet").then(mod => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import("react-leaflet").then(mod => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import("react-leaflet").then(mod => mod.Popup),
  { ssr: false }
)

import "leaflet/dist/leaflet.css"

let icon: any = null

if (typeof window !== "undefined") {
  // Only require leaflet and create icon on client
  const L = require("leaflet")
  icon = L.icon({
    iconUrl: "/gps.png",
    iconRetinaUrl: "/gps.png",
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
    shadowSize: [30, 30]
  })
}

interface PropertyMapProps {
  location: {
    lat: number
    lng: number
  }
  address: string
}

export default function PropertyMap({ location, address }: PropertyMapProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Prevent rendering on server
  if (!isClient) return <div className="relative h-[300px] rounded-lg overflow-hidden" />

  return (
    <div className="relative h-[300px] rounded-lg overflow-hidden z-0">
      <MapContainer
        center={[location.lat, location.lng]}
        zoom={16}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[location.lat, location.lng]} icon={icon}>
          <Popup>
            {address}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}

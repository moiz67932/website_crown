"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Fix for default marker icon in Next.js
const icon = L.icon({
  iconUrl: "/gps.png",
  iconRetinaUrl: "/gps.png",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
  shadowSize: [30, 30]
})

interface PropertyMapProps {
  location: {
    lat: number
    lng: number
  }
  address: string
}

export default function PropertyMap({ location, address }: PropertyMapProps) {
  return (
    <div className="relative h-[300px] rounded-lg overflow-hidden">
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

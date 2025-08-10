"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface PropertyMapProps {
  location: {
    lat: number
    lng: number
  }
  address: string
}

export default function PropertyMap({ location, address }: PropertyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !mapContainerRef.current || !location.lat || !location.lng) return

    if (mapInstanceRef.current) {
      console.log('PropertyMap: Map already initialized for this container, skipping.')
      return
    }

    console.log('PropertyMap: Initializing map...')
    
    // Create custom icon
    const icon = L.icon({
      iconUrl: "/gps.png",
      iconRetinaUrl: "/gps.png",
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30],
      shadowSize: [30, 30]
    })

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [location.lat, location.lng],
      zoom: 16,
      scrollWheelZoom: false,
      zoomControl: true,
      preferCanvas: true
    })

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)

    // Add marker with popup
    const marker = L.marker([location.lat, location.lng], { icon }).addTo(map)
    marker.bindPopup(address)

    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        console.log('PropertyMap: Cleaning up map instance.')
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [isClient, location.lat, location.lng, address])

  // Prevent rendering on server
  if (!isClient) return <div className="relative h-[300px] rounded-lg overflow-hidden bg-gray-100" />

  return (
    <div className="relative h-[300px] rounded-lg overflow-hidden z-0">
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  )
}
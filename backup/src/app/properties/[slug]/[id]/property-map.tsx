"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin } from "lucide-react"

// Dynamically import Leaflet only on client side
const useLeaflet = () => {
  const [L, setL] = useState<typeof import("leaflet") | null>(null)
  
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window !== "undefined") {
        const leaflet = await import("leaflet")
        
        // Manually inject Leaflet CSS if not already present
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
          link.crossOrigin = ''
          document.head.appendChild(link)
        }
        
        setL(leaflet.default)
      }
    }
    loadLeaflet()
  }, [])
  
  return L
}

interface PropertyMapProps {
  location: {
    lat: number
    lng: number
  }
  address: string
}

export default function PropertyMap({ location, address }: PropertyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [isClient, setIsClient] = useState(false)
  const L = useLeaflet()

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    console.log('PropertyMap useEffect triggered:', {
      isClient,
      L: !!L,
      mapContainer: !!mapContainerRef.current,
      latitude: location.lat,
      longitude: location.lng,
      address
    })

    if (!isClient || !L || !mapContainerRef.current) {
      console.log('PropertyMap: Prerequisites not met')
      return
    }

    if (!location.lat || !location.lng) {
      console.log('PropertyMap: No coordinates provided')
      return
    }

    if (mapInstanceRef.current) {
      console.log('PropertyMap: Map already initialized, skipping')
      return
    }

    try {
      console.log('PropertyMap: Starting map initialization...')
      
      // Clear any existing content
      mapContainerRef.current.innerHTML = ''
      
      // Create custom icon with fallback
      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })

      // Initialize map
      const map = L.map(mapContainerRef.current, {
        center: [location.lat, location.lng],
        zoom: 15,
        scrollWheelZoom: true,
        zoomControl: true,
        preferCanvas: false,
        attributionControl: true
      })

      console.log('PropertyMap: Map created, adding tiles...')

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map)

      console.log('PropertyMap: Tiles added, adding marker...')

      // Add marker with popup
      const marker = L.marker([location.lat, location.lng], { icon }).addTo(map)
      marker.bindPopup(`<strong>${address}</strong><br/>Lat: ${location.lat}, Lng: ${location.lng}`)

      console.log('PropertyMap: Marker added successfully')

      mapInstanceRef.current = map

      // Force a resize after a short delay to ensure proper rendering
      setTimeout(() => {
        if (map) {
          map.invalidateSize()
          console.log('PropertyMap: Map size invalidated')
        }
      }, 100)

    } catch (error) {
      console.error('PropertyMap: Error initializing map:', error)
    }

    return () => {
      console.log('PropertyMap: Cleanup triggered')
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
          console.log('PropertyMap: Map cleaned up successfully')
        } catch (error) {
          console.error('PropertyMap: Error during cleanup:', error)
        }
      }
    }
  }, [isClient, L, location.lat, location.lng, address])

  // Show loading state if Leaflet is not loaded yet
  if (!L || !isClient) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary-500 rounded-xl mx-auto mb-4 animate-spin flex items-center justify-center">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 font-medium">Loading Interactive Map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden z-0">
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  )
}
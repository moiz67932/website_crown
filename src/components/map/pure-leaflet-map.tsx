"use client"

import { useEffect, useRef, useState } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

interface PureLeafletMapProps {
  center: [number, number]
  zoom?: number
  style?: React.CSSProperties
  properties?: any[]
  onMapReady?: (map: L.Map) => void
}

export default function PureLeafletMap({
  center,
  zoom = 7,
  style = { height: "100%", width: "100%" },
  properties = [],
  onMapReady
}: PureLeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<L.Marker[]>([])
  const [isReady, setIsReady] = useState(false)

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    try {
      console.log('PureLeafletMap: Creating map instance')
      
      // Create map with Leaflet directly
      const map = L.map(containerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: false,
        preferCanvas: true
      })

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map)

      // Add zoom control to bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map)

      mapRef.current = map
      setIsReady(true)

      if (onMapReady) {
        onMapReady(map)
      }

      console.log('PureLeafletMap: Map created successfully')
    } catch (error) {
      console.error('PureLeafletMap: Error creating map:', error)
    }
  }, [center, zoom, onMapReady])

  // Track current zoom level for marker switching
  const [currentZoom, setCurrentZoom] = useState(7)

  // Update markers when properties change or zoom changes
  useEffect(() => {
    if (!mapRef.current || !isReady) return

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapRef.current?.removeLayer(marker)
    })
    markersRef.current = []

    // Add new markers
    properties.forEach((property: any) => {
      if (property.latitude && property.longitude) {
        let marker

        // Use image markers for zoom level 12 and above, price markers for lower zoom
        if (currentZoom >= 12) {
          // Create image marker
          const imageIcon = L.divIcon({
            className: 'property-image-marker',
            html: `
              <div class="relative group cursor-pointer">
                <div class="w-16 h-16 rounded-lg overflow-hidden border-2 border-white shadow-lg hover:scale-110 transition-transform duration-200">
                  <img 
                    src="${property.images?.[0] || property.main_photo_url || property.main_image_url || '/placeholder-image.jpg'}" 
                    alt="${property.address || 'Property'}"
                    class="w-full h-full object-cover"
                    onError="this.src='/placeholder-image.jpg'"
                  />
                </div>
                <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded-full shadow-md border text-xs font-semibold whitespace-nowrap min-w-max">
                  $${property.list_price?.toLocaleString() || 'N/A'}
                </div>
              </div>
            `,
            iconSize: [64, 64],
            iconAnchor: [32, 40],
            popupAnchor: [0, -40]
          })
          marker = L.marker([property.latitude, property.longitude], { icon: imageIcon })
        } else {
          // Create price marker (existing behavior)
          const priceIcon = L.divIcon({
            className: 'property-price-marker',
            html: `
              <div class="bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-lg text-sm font-semibold whitespace-nowrap hover:bg-blue-700 transition-colors duration-200 cursor-pointer">
                $${property.list_price?.toLocaleString() || 'N/A'}
              </div>
            `,
            iconSize: [80, 30],
            iconAnchor: [40, 15],
            popupAnchor: [0, -15]
          })
          marker = L.marker([property.latitude, property.longitude], { icon: priceIcon })
        }

        // Enhanced popup with image and better styling
        marker.bindPopup(`
          <div class="property-popup-content w-72">
            <div class="relative h-32 w-full mb-3">
              <img
                src="${property.images?.[0] || property.main_photo_url || property.main_image_url || '/placeholder-image.jpg'}"
                alt="${property.address || 'Property'}"
                class="h-full w-full object-cover rounded-lg"
                onError="this.src='/placeholder-image.jpg'"
              />
              <div class="absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-medium text-white ${
                property.property_type?.includes('Sale') ? 'bg-green-600' : 'bg-blue-600'
              }">
                ${property.property_type || 'For Sale'}
              </div>
            </div>
            <h3 class="font-semibold text-base mb-2">${property.address || property.title || 'Property'}</h3>
            <p class="text-slate-600 text-sm mb-2">${property.city || ''}</p>
            <p class="font-bold text-lg text-blue-600 mb-3">$${property.list_price?.toLocaleString() || 'N/A'}</p>
            <div class="flex justify-between text-sm text-slate-600 mb-3">
              <span><strong>${property.bedrooms || 'N/A'}</strong> beds</span>
              <span><strong>${property.bathrooms || 'N/A'}</strong> baths</span>
              <span><strong>${property.living_area_sqft?.toLocaleString() || 'N/A'}</strong> sq ft</span>
            </div>
            <button 
              onclick="window.location.href='/properties/${(property.address || '').replace(/\s+/g, '-')}/${property.listing_key || property.id}'"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              View Details
            </button>
          </div>
        `, {
          maxWidth: 300,
          closeButton: true,
          closeOnClick: false
        })

        marker.addTo(mapRef.current!)
        markersRef.current.push(marker)
      }
    })
  }, [properties, isReady, currentZoom])

  // Listen for zoom changes
  useEffect(() => {
    if (!mapRef.current || !isReady) return

    const handleZoomEnd = () => {
      const zoom = mapRef.current!.getZoom()
      setCurrentZoom(zoom)
    }

    mapRef.current.on('zoomend', handleZoomEnd)

    return () => {
      if (mapRef.current) {
        mapRef.current.off('zoomend', handleZoomEnd)
      }
    }
  }, [isReady])

  // Cleanup
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try {
          console.log('PureLeafletMap: Cleaning up map')
          mapRef.current.remove()
          mapRef.current = null
          markersRef.current = []
          setIsReady(false)
        } catch (error) {
          console.warn('PureLeafletMap: Error during cleanup:', error)
        }
      }
    }
  }, [])

  return (
    <div 
      ref={containerRef} 
      style={style}
      className="leaflet-container"
    />
  )
}

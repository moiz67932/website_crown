"use client"

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet'
import L from 'leaflet'

interface StrictModeSafeMapProps {
  center: [number, number]
  zoom: number
  children: React.ReactNode
  onMapReady?: () => void
  style?: React.CSSProperties
}

// Component that renders outside of React's lifecycle to avoid Strict Mode issues
export default function StrictModeSafeMap({
  center,
  zoom,
  children,
  onMapReady,
  style = { height: "100%", width: "100%" }
}: StrictModeSafeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current || mapInstanceRef.current || !mountedRef.current) return

    try {
      console.log('StrictModeSafeMap: Creating map instance')
      
      // Create map directly with Leaflet to bypass React-Leaflet's lifecycle
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

      // Add zoom control
      L.control.zoom({ position: 'bottomright' }).addTo(map)

      mapInstanceRef.current = map
      setIsMapReady(true)
      
      if (onMapReady) {
        onMapReady()
      }

      console.log('StrictModeSafeMap: Map created successfully')
    } catch (error) {
      console.error('StrictModeSafeMap: Error creating map:', error)
    }
  }, [center, zoom, onMapReady])

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      if (mapInstanceRef.current) {
        try {
          console.log('StrictModeSafeMap: Cleaning up map')
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
          setIsMapReady(false)
        } catch (error) {
          console.warn('StrictModeSafeMap: Error during cleanup:', error)
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

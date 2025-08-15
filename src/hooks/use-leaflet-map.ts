"use client"

import { useEffect, useRef, useState, useCallback } from 'react'

// Global map instance tracker to prevent multiple initializations
const globalMapTracker = {
  instances: new Set(),
  getUniqueId: () => `map_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Custom hook to handle Leaflet map lifecycle and prevent re-initialization
export function useLeafletMap() {
  const [isMapReady, setIsMapReady] = useState(false)
  const mapInstanceRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mapIdRef = useRef<string | null>(null)
  const mountedRef = useRef(false)

  // Generate a unique ID on first render only
  if (!mapIdRef.current) {
    mapIdRef.current = globalMapTracker.getUniqueId()
  }

  const mapKey = mapIdRef.current

  // Cleanup function
  const cleanup = useCallback(() => {
    if (mapInstanceRef.current && mapIdRef.current) {
      try {
        console.log('useLeafletMap: Cleaning up map instance', mapIdRef.current)
        
        // Remove from global tracker
        globalMapTracker.instances.delete(mapIdRef.current)
        
        // Clean up Leaflet instance
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        
        // Clean up DOM
        if (containerRef.current) {
          containerRef.current.innerHTML = ''
        }
        
        console.log('useLeafletMap: Cleanup completed')
      } catch (error) {
        console.warn('useLeafletMap: Error during cleanup:', error)
      }
    }
    
    setIsMapReady(false)
    mountedRef.current = false
  }, [])

  useEffect(() => {
    mountedRef.current = true
    console.log('useLeafletMap: Component mounted with ID:', mapIdRef.current)
    
    // Add to global tracker
    if (mapIdRef.current) {
      globalMapTracker.instances.add(mapIdRef.current)
    }

    return cleanup
  }, [cleanup])

  const handleMapRef = useCallback((mapInstance: any) => {
    if (mapInstance && mountedRef.current && !mapInstanceRef.current) {
      console.log('useLeafletMap: Map instance received for ID:', mapIdRef.current)
      mapInstanceRef.current = mapInstance
      setIsMapReady(true)
    } else if (mapInstance && mapInstanceRef.current) {
      console.warn('useLeafletMap: Attempted to set map instance but one already exists')
    }
  }, [])

  const handleMapReady = useCallback(() => {
    if (mountedRef.current) {
      console.log('useLeafletMap: Map ready for ID:', mapIdRef.current)
      setIsMapReady(true)
    }
  }, [])

  return {
    mapKey,
    isMapReady,
    mapRef: handleMapRef,
    containerRef,
    onMapReady: handleMapReady
  }
}

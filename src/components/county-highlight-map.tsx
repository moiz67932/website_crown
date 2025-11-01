"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Loader2, AlertCircle } from 'lucide-react'
import { Badge } from './ui/badge'

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

interface CountyHighlightMapProps {
  countyName?: string
  className?: string
  height?: string
}

export default function CountyHighlightMap({ 
  countyName, 
  className = "", 
  height = "300px" 
}: CountyHighlightMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const countyLayerRef = useRef<L.GeoJSON | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countyInfo, setCountyInfo] = useState<{
    name: string
    state: string
    area?: number
  } | null>(null)

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    try {
      const map = L.map(containerRef.current, {
        center: [36.7783, -119.4179], // California center
        zoom: 6,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        attributionControl: true
      })

      // Add beautiful tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18
      }).addTo(map)

      // Add zoom control to bottom right
      map.zoomControl.setPosition('bottomright')

      mapRef.current = map
    } catch (error) {
      console.error('Error initializing county map:', error)
      setError('Failed to initialize map')
    }
  }, [])

  // Fetch county boundary data
  const fetchCountyBoundary = useCallback(async (county: string) => {
    if (!county || !mapRef.current) return

    setIsLoading(true)
    setError(null)

    try {
      // Clean county name for API query
      const cleanCountyName = county.replace(/\s*County\s*$/i, '').trim()
      console.log(`🗺️ Fetching boundary for: ${cleanCountyName}`)

      // Try multiple query approaches for better success rate
      const queryTemplates = [
        // County with "County" suffix
        `relation["boundary"="administrative"]["admin_level"~"6|7"]["name"~"^${cleanCountyName}\\s*County$",i]["place"!="city"]["place"!="town"];`,
        // County without "County" suffix
        `relation["boundary"="administrative"]["admin_level"~"6|7"]["name"~"^${cleanCountyName}$",i]["place"!="city"]["place"!="town"];`,
        // More permissive search
        `relation["boundary"="administrative"]["admin_level"~"6|7"]["name"~"${cleanCountyName}",i];`
      ]

      let succeeded = false

      for (const template of queryTemplates) {
        try {
          const overpassQuery = `[out:json][timeout:30];(${template});(._;>;);out geom;`
          
          console.log(`🔍 Trying query: ${template}`)
          
          const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: overpassQuery,
            headers: {
              'Content-Type': 'text/plain'
            }
          })

          if (!response.ok) {
            console.warn(`❌ Overpass HTTP error: ${response.status}`)
            continue
          }

          const data = await response.json()
          const relations = data.elements?.filter((e: any) => e.type === 'relation') || []

          if (relations.length === 0) {
            console.log(`🔍 No relations found for this query`)
            continue
          }

          // Pick the best relation (prefer lower admin_level)
          const bestRelation = relations
            .map((r: any) => ({
              relation: r,
              adminLevel: parseInt(r.tags?.admin_level || '99', 10)
            }))
            .sort((a: any, b: any) => a.adminLevel - b.adminLevel)[0].relation

          console.log(`✅ Found county relation:`, bestRelation.tags)

          // Extract county info
          setCountyInfo({
            name: bestRelation.tags.name || county,
            state: bestRelation.tags['addr:state'] || bestRelation.tags.state || 'CA'
          })

          // Get ways for the boundary
          const allWays = data.elements.filter((e: any) => e.type === 'way' && e.geometry)
          const outerWayIds = (bestRelation.members || [])
            .filter((m: any) => m.type === 'way' && (m.role === 'outer' || !m.role))
            .map((m: any) => m.ref)

          const outerWays = allWays.filter((w: any) => outerWayIds.includes(w.id))

          if (outerWays.length === 0) {
            console.warn('⚠️ No outer ways found for county')
            continue
          }

          // Convert to GeoJSON
          const coordinates = outerWays.map((way: any) => 
            way.geometry.map((point: any) => [point.lon, point.lat])
          )

          const geoJson = {
            type: 'Feature',
            properties: {
              name: bestRelation.tags.name,
              admin_level: bestRelation.tags.admin_level
            },
            geometry: {
              type: coordinates.length > 1 ? 'MultiPolygon' : 'Polygon',
              coordinates: coordinates.length > 1 ? [coordinates] : [coordinates[0]]
            }
          }

          // Clear existing county layer
          if (countyLayerRef.current) {
            mapRef.current!.removeLayer(countyLayerRef.current)
          }

          // Add highlighted county boundary
          const countyLayer = L.geoJSON(geoJson as any, {
            style: {
              fillColor: '#3b82f6',
              fillOpacity: 0.15,
              color: '#1d4ed8',
              weight: 3,
              opacity: 0.8,
              dashArray: '5, 5'
            },
            onEachFeature: (feature, layer) => {
              // Add popup with county info
              layer.bindPopup(`
                <div class="p-3 min-w-[200px]">
                  <h3 class="font-bold text-lg text-blue-600 mb-2">${feature.properties.name}</h3>
                  <div class="space-y-1 text-sm text-gray-600">
                    <div>📍 Administrative Level: ${feature.properties.admin_level}</div>
                    <div>🏛️ State: California</div>
                    <div class="mt-3 p-2 bg-blue-50 rounded text-blue-800 text-xs">
                      ✨ Currently viewing properties in this county
                    </div>
                  </div>
                </div>
              `, {
                closeButton: true,
                className: 'county-popup'
              })
            }
          }).addTo(mapRef.current!)

          countyLayerRef.current = countyLayer

          // Fit map to county bounds with padding
          const bounds = countyLayer.getBounds()
          mapRef.current!.fitBounds(bounds, {
            padding: [20, 20],
            maxZoom: 10
          })

          succeeded = true
          console.log(`🎉 Successfully highlighted ${cleanCountyName} County`)
          break

        } catch (err) {
          console.warn(`❌ Query failed:`, err)
          continue
        }
      }

      if (!succeeded) {
        throw new Error(`Could not find boundary data for ${county}`)
      }

    } catch (error) {
      console.error('❌ Error fetching county boundary:', error)
      setError(error instanceof Error ? error.message : 'Failed to load county boundary')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch county when countyName changes
  useEffect(() => {
    if (countyName && mapRef.current) {
      fetchCountyBoundary(countyName)
    }
  }, [countyName, fetchCountyBoundary])

  // Cleanup
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove()
          mapRef.current = null
        } catch (error) {
          console.warn('Error cleaning up county map:', error)
        }
      }
    }
  }, [])

  return (
    <div className={`relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-neutral-200 dark:border-slate-600 shadow-soft ${className}`}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-gradient-to-r from-white/95 to-blue-50/95 dark:from-slate-800/95 dark:to-blue-900/95 backdrop-blur-sm border-b border-neutral-200/50 dark:border-slate-600/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                {countyName ? `${countyName}` : 'County Map'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {isLoading ? 'Loading boundary...' : countyInfo ? `${countyInfo.state} • Administrative Region` : 'Select a county to view boundary'}
              </p>
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2">
            {isLoading && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Loading
              </Badge>
            )}
            {error && (
              <Badge variant="destructive" className="bg-red-100 text-red-700">
                <AlertCircle className="h-3 w-3 mr-1" />
                Error
              </Badge>
            )}
            {countyInfo && !isLoading && !error && (
              <Badge className="bg-green-100 text-green-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Active
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Map container */}
      <div 
        ref={containerRef}
        style={{ height }}
        className="w-full"
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm flex items-center justify-center z-[999]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Fetching {countyName} boundary...
            </p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm flex items-center justify-center z-[999]">
          <div className="text-center p-6">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
            <p className="text-sm text-red-600 dark:text-red-400 mb-3">
              {error}
            </p>
            <button 
              onClick={() => countyName && fetchCountyBoundary(countyName)}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      {countyInfo && !error && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg p-3 border border-neutral-200/50 dark:border-slate-600/50 shadow-soft">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-3 border-2 border-blue-600" style={{
              background: 'rgba(59, 130, 246, 0.15)',
              borderStyle: 'dashed'
            }}></div>
            <span className="text-slate-600 dark:text-slate-400">County Boundary</span>
          </div>
        </div>
      )}
    </div>
  )
}
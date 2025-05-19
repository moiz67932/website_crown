"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import MapViewHeader, { type FilterValues } from "./map-view-header"
import MapFilterDrawer from "./map-filter-drawer"
import MapListToggle from "./map-list-toggle"
import PropertyListPanel from "./property-list-panel"
import MapLoadingSkeleton from "./map-loading-skeleton"
import MapFAQ from "./map-faq"
import { properties } from "../properties/property-data"
import { useMediaQuery } from "@/hooks/use-media-query"
import "@/styles/map-styles.css"

// Dynamically import the map component with no SSR
// This is necessary because Leaflet requires the window object
const PropertyMap = dynamic(() => import("./property-map"), {
  ssr: false,
  loading: () => <MapLoadingSkeleton />,
})

export default function MapViewPage() {
  const [activeFilters, setActiveFilters] = useState<FilterValues>({})
  const [filteredPropertyIds, setFilteredPropertyIds] = useState<string[]>([])
  const [showFAQ, setShowFAQ] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")
  // const searchParams = useSearchParams()

  // Get location from search params
  // const locationQuery = searchParams.get("location")
  const locationQuery = "California"
  // Filter properties based on active filters
  useEffect(() => {
    if (Object.keys(activeFilters).length === 0) {
      setFilteredPropertyIds([])
      return
    }

    const filtered = properties
      .filter((property) => {
        // Filter by property type
        if (activeFilters.propertyType && activeFilters.propertyType.length > 0) {
          // This is a simplified example - in a real app, you'd have property types in your data
          const matchesType = activeFilters.propertyType.some((type) =>
            property.title.toLowerCase().includes(type.toLowerCase()),
          )
          if (!matchesType) return false
        }

        // Filter by status
        if (activeFilters.status && activeFilters.status.length > 0) {
          if (!activeFilters.status.includes(property.status)) return false
        }

        // Filter by price range
        if (activeFilters.priceRange) {
          const [min, max] = activeFilters.priceRange
          if (property.price < min || property.price > max) return false
        }

        // Filter by beds
        if (activeFilters.beds && activeFilters.beds !== "Any") {
          const minBeds = Number.parseInt(activeFilters.beds)
          if (property.beds < minBeds) return false
        }

        // Filter by baths
        if (activeFilters.baths && activeFilters.baths !== "Any") {
          const minBaths = Number.parseInt(activeFilters.baths)
          if (property.baths < minBaths) return false
        }

        // Filter by area range
        if (activeFilters.areaRange) {
          const [min, max] = activeFilters.areaRange
          if (property.sqft < min || property.sqft > max) return false
        }

        // Filter by features
        if (activeFilters.features && activeFilters.features.length > 0 && property.features) {
          const hasAllFeatures = activeFilters.features.every((feature) => property.features?.includes(feature))
          if (!hasAllFeatures) return false
        }

        return true
      })
      .map((p) => p.id)

    setFilteredPropertyIds(filtered)
  }, [activeFilters])

  const handleFilterChange = (filters: FilterValues) => {
    setActiveFilters(filters)
  }

  const handleClearFilters = () => {
    setActiveFilters({})
    setFilteredPropertyIds([])
  }

  const toggleFAQ = () => {
    setShowFAQ(!showFAQ)
  }

  return (
    <main className="pt-16 h-screen flex flex-col">
      <MapViewHeader
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        onToggleFAQ={toggleFAQ}
      />

      <div className="flex-1 flex flex-col md:flex-row relative">
        {/* Map Container */}
        <div className="flex-1 relative">
          <Suspense fallback={<MapLoadingSkeleton />}>
            <PropertyMap filteredPropertyIds={filteredPropertyIds} initialLocationQuery={locationQuery} />
          </Suspense>

          {/* Mobile Filter Drawer - Only visible on mobile */}
          <div className="md:hidden absolute top-4 left-4 z-[1000]">
            <MapFilterDrawer
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* Map/List Toggle - Only visible on mobile */}
          <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]">
            <MapListToggle filteredPropertyIds={filteredPropertyIds} />
          </div>
        </div>

        {/* Property List Panel - Hidden on mobile when map is shown */}
        <div className="hidden md:block w-full md:w-[400px] lg:w-[450px] border-l border-slate-200 bg-white overflow-y-auto">
          <PropertyListPanel filteredPropertyIds={filteredPropertyIds} />
        </div>
      </div>

      {/* FAQ Section */}
      {showFAQ && (
        <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <MapFAQ onClose={toggleFAQ} />
          </div>
        </div>
      )}
    </main>
  )
}

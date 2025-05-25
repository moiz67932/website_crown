"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { Suspense } from "react"
import MapViewHeader, { type FilterValues } from "./map-view-header"
import MapFilterDrawer from "./map-filter-drawer"
import MapListToggle from "./map-list-toggle"
import PropertyListPanel from "./property-list-panel"
import MapLoadingSkeleton from "./map-loading-skeleton"
import MapFAQ from "./map-faq"
import { useMediaQuery } from "@/hooks/use-media-query"
import useListProperties from "@/hooks/queries/useGetListProperties"
import "@/styles/map-styles.css"
import { useSearchParams } from "next/navigation"

// Dynamically import the map component with no SSR
const PropertyMap = dynamic(() => import("./property-map"), {
  ssr: false,
  loading: () => <MapLoadingSkeleton />,
})

export default function MapViewPage() {
  const [activeFilters, setActiveFilters] = useState<FilterValues>({})
  const [showFAQ, setShowFAQ] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const searchParams = useSearchParams()

  // Get location from search params
  const locationQuery = searchParams.get("location")

  // Determine the county from the locationQuery
  const county = useMemo(() => {
    if (!locationQuery) return null
    if (locationQuery.toLowerCase().includes("los-angeles-county")) return "Los Angeles"
    if (locationQuery.toLowerCase().includes("orange-county")) return "Orange"
    if (locationQuery.toLowerCase().includes("san-diego-county")) return "San Diego"
    if (locationQuery.toLowerCase().includes("santa-clara-county")) return "Santa Clara"
    if (locationQuery.toLowerCase().includes("alameda-county")) return "Alameda"
    return null
  }, [locationQuery])

  // Map activeFilters to API params for useListProperties
  const apiParams = useMemo(() => {
    // Map FilterValues to API params
    // Only 10 items
    const params: Record<string, any> = { limit: 10 }
    if (activeFilters.propertyType && activeFilters.propertyType.length > 0) {
      // Only use the first propertyType for API param
      params.propertyType = Array.isArray(activeFilters.propertyType)
        ? activeFilters.propertyType[0]
        : activeFilters.propertyType
    }
    if (activeFilters.priceRange) {
      params.minPrice = activeFilters.priceRange[0]
      params.maxPrice = activeFilters.priceRange[1]
    }
    if (activeFilters.beds && activeFilters.beds !== "Any") {
      params.minBedroom = Number.parseInt(activeFilters.beds)
    }
    if (activeFilters.baths && activeFilters.baths !== "Any") {
      params.minBathroom = Number.parseInt(activeFilters.baths)
    }
    if (activeFilters.areaRange) {
      params.min_sqft = activeFilters.areaRange[0]
      params.max_sqft = activeFilters.areaRange[1]
    }
    if (county) {
      params.county = county
    }
    // You can add more mappings as needed (e.g., city, yearBuilt, etc.)
    return params
  }, [activeFilters, county])

  const { data, isLoading } = useListProperties(apiParams)
  const properties = data?.listings || []

  // Filter by features and status on the client side if needed
  const filteredProperties = useMemo(() => {
    let filtered = properties
    // if (activeFilters.status && activeFilters.status.length > 0) {
    //   filtered = filtered.filter((property: any) =>
    //     activeFilters.status.includes(property.status)
    //   )
    // }
    // if (activeFilters.features && activeFilters.features.length > 0) {
    //   filtered = filtered.filter((property: any) =>
    //     activeFilters.features.every((feature: string) =>
    //       property.features?.includes(feature)
    //     )
    //   )
    // }
    return filtered
  }, [properties, activeFilters.status, activeFilters.features])

  const filteredPropertyIds = filteredProperties.map((p: any) => p.id)

  const handleFilterChange = (filters: FilterValues) => {
    setActiveFilters(filters)
  }

  const handleClearFilters = () => {
    setActiveFilters({})
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
        <div className="flex-1 relative h-[calc(100vh-100px)]">
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
          <PropertyListPanel filteredPropertyIds={filteredPropertyIds} properties={properties} />
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

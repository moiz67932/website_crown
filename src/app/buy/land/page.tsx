"use client"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import PropertyListingHeader from "../../properties/property-header"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useTrestlePropertiesIntegrated } from "@/hooks/useTrestlePropertiesIntegrated"
import { PropertyCard } from "@/components/property-card"
import { Property } from "@/interfaces"
import { PropertyFilters } from "@/types/filters"
import AdvancedSearch from "@/components/filters/advanced-search"

const PropertyGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
    {[...Array(18)].map((_, index) => (
      <div key={`skeleton-${index}`} className="space-y-4">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="space-y-3 px-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-1/3" />
          <div className="flex gap-4 pt-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    ))}
  </div>
)

function LandPageContent() {
  const [currentPage, setCurrentPage] = useState(1)
  const searchParams = useSearchParams()
  const router = useRouter()

  const [filters, setFilters] = useState<PropertyFilters>({
    propertyType: ["Land"],
    status: ["for_sale"],
    sortBy: "recommended"
  })

  const [legacyFilters, setLegacyFilters] = useState<{
    propertyType: string;
    minPrice: number | undefined;
    maxPrice: number | undefined;
    city: string;
    county: string;
    minBathroom: number | undefined;
    minBedroom: number | undefined;
    yearBuilt: number | undefined;
    max_sqft: number | undefined;
    min_sqft: number | undefined;
    sortBy: "recommended" | "price-asc" | "price-desc" | "date-desc" | "area-desc";
  }>({
    propertyType: "Land",
    minPrice: undefined,
    maxPrice: undefined,
    city: "",
    county: "",
    minBathroom: undefined,
    minBedroom: undefined,
    yearBuilt: undefined,
    max_sqft: undefined,
    min_sqft: undefined,
    sortBy: "recommended"
  })

  useEffect(() => {
    const sortByParam = searchParams?.get("sortBy")
    const validSortBy = ["recommended", "price-asc", "price-desc", "date-desc", "area-desc"].includes(sortByParam || "")
      ? sortByParam as "recommended" | "price-asc" | "price-desc" | "date-desc" | "area-desc"
      : "recommended"

    const updatedLegacyFilters = {
      ...legacyFilters,
      minPrice: searchParams?.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
      maxPrice: searchParams?.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
      city: searchParams?.get("search") || searchParams?.get("city") || "",
      county: searchParams?.get("county") || "",
      minBathroom: searchParams?.get("minBathroom") ? Number(searchParams.get("minBathroom")) : undefined,
      minBedroom: searchParams?.get("minBedroom") ? Number(searchParams.get("minBedroom")) : undefined,
      yearBuilt: searchParams?.get("yearBuilt") ? Number(searchParams.get("yearBuilt")) : undefined,
      max_sqft: searchParams?.get("max_sqft") ? Number(searchParams.get("max_sqft")) : undefined,
      min_sqft: searchParams?.get("min_sqft") ? Number(searchParams.get("min_sqft")) : undefined,
      sortBy: validSortBy
    }

    setLegacyFilters(updatedLegacyFilters)

    const newFilters: PropertyFilters = {
      ...filters,
      propertyType: ["Land"],
      searchQuery: searchParams?.get("search") || "",
      priceRange: updatedLegacyFilters.minPrice || updatedLegacyFilters.maxPrice ? 
        [updatedLegacyFilters.minPrice || 0, updatedLegacyFilters.maxPrice || 5000000] : undefined,
      city: updatedLegacyFilters.city,
      county: updatedLegacyFilters.county,
      sortBy: updatedLegacyFilters.sortBy
    }

    setFilters(newFilters)
  }, [searchParams])

  const limit = 18
  const trestleFilters = {
    city: legacyFilters.city,
    state: legacyFilters.county,
    minPrice: legacyFilters.minPrice,
    maxPrice: legacyFilters.maxPrice,
    propertyType: legacyFilters.propertyType,
    keywords: []
  }

  const { 
    properties, 
    loading: isLoading, 
    total: totalItems,
    refresh,
  } = useTrestlePropertiesIntegrated(trestleFilters, limit, currentPage)

  const totalPages = Math.min(70, Math.ceil(totalItems / limit))

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleFilterChange = (newFilters: PropertyFilters) => {
    const updatedFilters = {
      ...newFilters,
      propertyType: ["Land"]
    }
    
    setFilters(updatedFilters)
    setCurrentPage(1)

    const params = new URLSearchParams()
    if (updatedFilters.searchQuery) params.set('search', updatedFilters.searchQuery)
    if (updatedFilters.priceRange) {
      params.set('minPrice', updatedFilters.priceRange[0].toString())
      params.set('maxPrice', updatedFilters.priceRange[1].toString())
    }
    if (updatedFilters.city) params.set('city', updatedFilters.city)
    if (updatedFilters.county) params.set('county', updatedFilters.county)
    if (updatedFilters.sortBy) params.set('sortBy', updatedFilters.sortBy)

    const newUrl = `/buy/land${params.toString() ? '?' + params.toString() : ''}`
    router.replace(newUrl, { scroll: false })
  }

  return (
    <main className="bg-slate-50 dark:bg-slate-900 min-h-screen pt-16 md:pt-20 theme-transition">
      <PropertyListingHeader 
        currentPage={currentPage} 
        totalProperties={totalItems}
        propertyType="Land for Sale"
        sortBy={legacyFilters.sortBy}
        onSortChange={(newSort) => {
          const updatedFilters = { ...filters, sortBy: newSort }
          handleFilterChange(updatedFilters)
        }}
        onBuyClick={() => {}}
      />
      
      <div className="bg-white dark:bg-slate-900 border-b border-neutral-200/50 dark:border-slate-700/50 theme-transition">
        <div className="container mx-auto px-4 md:px-6 py-6">
          <AdvancedSearch
            onSearch={handleFilterChange}
            initialFilters={filters}
            showMap={false}
          />
        </div>
      </div>

      <section className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Land for Sale
            {totalItems > 0 && (
              <span className="ml-2 text-lg font-normal text-gray-600">
                ({totalItems.toLocaleString()} found)
              </span>
            )}
          </h2>
          <Button onClick={refresh} variant="outline" size="sm" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            🔄 Refresh Data
          </Button>
        </div>

        <div className="w-full">
          {isLoading ? <PropertyGridSkeleton /> : (
            <>
              {properties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-10">
                  {properties.map((property: Property, index: number) => (
                    <PropertyCard 
                      key={property.listing_key || property.id || `property-${index}`} 
                      property={property} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-500 text-lg mb-4">
                    🌳 No land found with current filters
                  </div>
                  <Button onClick={refresh} variant="outline">
                    Try refreshing or adjust your filters
                  </Button>
                </div>
              )}
            </>
          )}
          
          {!isLoading && totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, index) => {
                    const page = index + 1
                    
                    if (
                      page === 1 || 
                      page === totalPages || 
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={`page-${page}`}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={page === currentPage}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <PaginationItem key={`ellipsis-${page}`}>
                          <span className="px-4">...</span>
                        </PaginationItem>
                      )
                    }
                    return null
                  }).filter(Boolean)}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default function LandPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LandPageContent />
    </Suspense>
  )
}

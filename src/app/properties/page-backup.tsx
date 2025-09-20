"use client"
import { useState, useEffect, Suspense } from "react"
import dynamic from "next/dynamic"
import PropertiesGrid from "./properties-grid"
import PropertyListingHeader from "./property-header"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import useListProperties from "@/hooks/queries/useGetListProperties"
import { useSearchParams } from "next/navigation"
import { PropertyCard } from "@/components/property-card"
import { Property } from "@/interfaces"

// Dynamically import FilterSidebar and MobileFilterDrawer with SSR disabled
const FilterSidebar = dynamic(() => import("./filter-sidebar"), { ssr: false })
const MobileFilterDrawer = dynamic(() => import("./mobile-filter-drawer"), { ssr: false })

// Client-side component that uses useSearchParams
function PropertiesPageContent() {
  const [currentPage, setCurrentPage] = useState(1)
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState<{
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
    propertyType: "",
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

    setFilters({
  propertyType: searchParams?.get("propertyType") || "",
  minPrice: searchParams?.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
  maxPrice: searchParams?.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
  city: searchParams?.get("searchLocationType") === "city" ? searchParams?.get("location") || "" : "",
  county: searchParams?.get("searchLocationType") === "county" ? searchParams?.get("location") || "" : "",
  minBathroom: searchParams?.get("minBathroom") ? Number(searchParams.get("minBathroom")) : undefined,
  minBedroom: searchParams?.get("minBedroom") ? Number(searchParams.get("minBedroom")) : undefined,
  yearBuilt: searchParams?.get("yearBuilt") ? Number(searchParams.get("yearBuilt")) : undefined,
  max_sqft: searchParams?.get("max_sqft") ? Number(searchParams.get("max_sqft")) : undefined,
  min_sqft: searchParams?.get("min_sqft") ? Number(searchParams.get("min_sqft")) : undefined,
      sortBy: validSortBy
    })
  }, [searchParams])

  const limit = 12
  const skip = (currentPage - 1) * limit

  const { data, isLoading } = useListProperties({ 
    skip, 
    limit,
    propertyType: filters.propertyType,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    city: filters.city,
    county: filters.county,
    minBathroom: filters.minBathroom,
    minBedroom: filters.minBedroom,
    yearBuilt: filters.yearBuilt,
    max_sqft: filters.max_sqft,
    min_sqft: filters.min_sqft,
    sortBy: filters.sortBy
  })

  const properties = data?.listings || []
  const totalPages = data?.total_pages || 1
  const totalItems = data?.total_items || 0

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
  }

  return (
    <main className="bg-slate-50 min-h-screen pt-16 md:pt-20">
      <PropertyListingHeader 
        currentPage={currentPage} 
        totalProperties={totalItems}
        propertyType={filters.propertyType}
        sortBy={filters.sortBy}
        onSortChange={(newSort) => handleFilterChange({ ...filters, sortBy: newSort })}
        onBuyClick={(type: string | undefined) => handleFilterChange({ ...filters, propertyType: type || "" })}
      />

      <section className="container mx-auto px-2 md:px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block w-full lg:w-1/4 xl:w-1/5">
            <FilterSidebar filters={filters} onFilterChange={handleFilterChange} />
          </div>

          {/* Mobile Filter Drawer - Only rendered on mobile */}
          <div className="lg:hidden">
            <MobileFilterDrawer filters={filters} onFilterChange={handleFilterChange} />
          </div>

          {/* Properties Grid */}
          <div className="w-full lg:w-3/4 xl:w-4/5">
            {isLoading ? <PropertyGridSkeleton /> :
            <div className="flex flex-wrap justify-center gap-8 mb-10">
            {properties.map((property: Property) => (
              <PropertyCard key={property.listing_key} property={property} />
            ))}
          </div>
            }
            
            {/* Pagination */}
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
                    
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={currentPage === page}
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
                          <PaginationItem key={page}>
                            <span className="px-4">...</span>
                          </PaginationItem>
                        )
                      }
                      return null
                    })}

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
        </div>
      </section>
    </main>
  )
}

function PropertyGridSkeleton() {
  return (
    <div className="pt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {[...Array(9)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm">
          <Skeleton className="h-48 w-full" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Main component with Suspense boundary
export default function PropertiesPage() {
  return (
    <Suspense fallback={<PropertyGridSkeleton />}>
      <PropertiesPageContent />
    </Suspense>
  )
}
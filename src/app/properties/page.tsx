"use client"
import { useEffect, useState } from "react"
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

// Dynamically import FilterSidebar and MobileFilterDrawer with SSR disabled
const FilterSidebar = dynamic(() => import("./filter-sidebar"), { ssr: false })
const MobileFilterDrawer = dynamic(() => import("./mobile-filter-drawer"), { ssr: false })

export default function PropertiesPage() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const limit = 12

  useEffect(() => {
    let isMounted = true
    async function fetchProperties() {
      try {
        const skip = (currentPage - 1) * limit
        const res = await fetch(`http://34.133.70.161:8000/api/listings?skip=${skip}&limit=${limit}`)
        if (!res.ok) {
          throw new Error("Failed to fetch properties")
        }
        const data = await res.json()
        if (isMounted) {
          setProperties(data.listings)
          setTotalPages(data.total_pages)
          setTotalItems(data.total_items)
        }
      } catch (error) {
        console.error(error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchProperties()
    return () => {
      isMounted = false
    }
  }, [currentPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setLoading(true)
  }

  return (
    <main className="bg-slate-50 min-h-screen pt-16 md:pt-20">
      <PropertyListingHeader />

      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block w-full lg:w-1/4 xl:w-1/5">
            <FilterSidebar />
          </div>

          {/* Mobile Filter Drawer - Only rendered on mobile */}
          <div className="lg:hidden">
            <MobileFilterDrawer />
          </div>

          {/* Properties Grid */}
          <div className="w-full lg:w-3/4 xl:w-4/5">
            {loading ? <PropertyGridSkeleton /> : <PropertiesGrid properties={properties} />}
            
            {/* Pagination */}
            {!loading && totalPages > 1 && (
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
                      // Show first page, last page, current page, and pages around current page
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
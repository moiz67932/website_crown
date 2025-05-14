"use client"
import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import PropertiesGrid from "./properties-grid"
import PropertyListingHeader from "./property-header"
import { Skeleton } from "@/components/ui/skeleton"

// Dynamically import FilterSidebar and MobileFilterDrawer with SSR disabled
const FilterSidebar = dynamic(() => import("./filter-sidebar"), { ssr: false })
const MobileFilterDrawer = dynamic(() => import("./mobile-filter-drawer"), { ssr: false })

export default function PropertiesPage() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    async function fetchProperties() {
      try {
        const res = await fetch(`http://34.133.70.161:8000/api/listings?skip=0&limit=12`)
        if (!res.ok) {
          throw new Error("Failed to fetch properties")
        }
        const data = await res.json()
        if (isMounted) setProperties(data.listings)
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
  }, [])

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

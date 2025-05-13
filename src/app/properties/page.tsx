"use client"
import { Suspense, useEffect, useState } from "react"
import PropertiesGrid from "./properties-grid"
import FilterSidebar from "./filter-sidebar"
import PropertyListingHeader from "./property-header"
import MobileFilterDrawer from "./mobile-filter-drawer"
import { Skeleton } from "@/components/ui/skeleton"

// export const metadata = {
//   title: "Properties | Real Estate",
//   description: "Browse our extensive collection of premium properties",
// }

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProperties() {
      try {
        const res = await fetch(`http://34.133.70.161:8000/api/listings?skip=1&limit=3`);
        if (!res.ok) {
          throw new Error("Failed to fetch properties");
        }
        const data = await res.json();
        setProperties(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, []);

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
            <Suspense fallback={<PropertyGridSkeleton />}>
              {loading ? <PropertyGridSkeleton /> : <PropertiesGrid properties={properties} />}
            </Suspense>
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

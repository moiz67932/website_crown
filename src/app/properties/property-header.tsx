import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GridIcon, LayoutList } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useMemo } from "react"
import dynamic from "next/dynamic"

// Load the client-only CountyHighlightMap dynamically with SSR disabled so
// Leaflet (which depends on window) isn't evaluated during server builds.
const CountyHighlightMap = dynamic(() => import("@/components/county-highlight-map"), { ssr: false })

interface IPropertyListingHeaderProps {
  totalProperties: number
  currentPage: number
  sortBy: "recommended" | "price-asc" | "price-desc" | "date-desc" | "area-desc"
  propertyType: string
  onSortChange: (sort: "recommended" | "price-asc" | "price-desc" | "date-desc" | "area-desc") => void
  onBuyClick: (type: "Residential" | "ResidentialLease") => void
}

export default function PropertyListingHeader({ totalProperties, currentPage, sortBy, propertyType, onSortChange, onBuyClick }: IPropertyListingHeaderProps) {
  const searchParams = useSearchParams()
  const startIndex = (currentPage - 1) * 12 + 1
  const endIndex = Math.min(startIndex + 11, totalProperties)

  // Extract county from URL parameters
  const countyName: string | null = useMemo(() => {
    // useSearchParams() can return null in some contexts, guard with fallback
    const params = searchParams ?? new URLSearchParams()
    const county = params.get("county")
    const location = params.get("location")
    const searchLocationType = params.get("searchLocationType")

    // Check if we have a county parameter or if location is a county
    if (county) {
      return county
    } else if (searchLocationType === "county" && location) {
      return location
    }
    return null
  }, [searchParams])

  return (
    <div className="bg-gradient-to-br from-white via-neutral-50 to-primary-50/20 dark:from-slate-900 dark:via-slate-800 dark:to-orange-900/10 border-b border-neutral-200/50 dark:border-slate-700/50 shadow-soft theme-transition">
      <div className="container mx-auto px-6 py-12 md:py-16">
        <div className="flex flex-col gap-6">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-8 h-[2px] bg-gradient-primary rounded-full"></div>
              <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Property Listings</span>
              <div className="w-8 h-[2px] bg-gradient-primary rounded-full"></div>
            </div>
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-neutral-100 mb-4 theme-transition">
              Discover Your 
              <span className="block text-gradient-luxury bg-clip-text text-transparent">Perfect Home</span>
            </h1>
            <p className="text-neutral-600 dark:text-neutral-300 text-lg md:text-xl max-w-2xl mx-auto lg:mx-0 leading-relaxed theme-transition">
              Browse our curated collection of exceptional properties along California's stunning coastline
            </p>
          </div>

          {/* County Map Section - Only show when county is detected */}
          {countyName && (
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-neutral-200/50 dark:border-slate-600/50 shadow-soft theme-transition overflow-hidden">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                  📍 {countyName} Properties
                </h2>
                <p className="text-neutral-600 dark:text-neutral-300 text-sm">
                  Exploring properties in {countyName}. The highlighted area shows the county boundary.
                </p>
              </div>
              <div className="w-full overflow-hidden">
                <CountyHighlightMap 
                  countyName={countyName}
                  height="400px"
                  className="w-full"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-neutral-200/50 dark:border-slate-600/50 shadow-soft theme-transition">
            <div className="flex items-center text-neutral-600 dark:text-neutral-300 font-medium theme-transition">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-400 dark:bg-primary-300 rounded-full"></div>
                <span className="text-sm sm:text-base">
                  Showing <span className="font-bold text-neutral-900 dark:text-neutral-100">{startIndex}-{endIndex}</span> of <span className="font-bold text-neutral-900 dark:text-neutral-100">{totalProperties.toLocaleString()}</span> properties
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center bg-neutral-100 dark:bg-slate-700 rounded-2xl p-1 border border-neutral-200 dark:border-slate-600 theme-transition">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                    propertyType !== "ResidentialLease" 
                      ? "bg-gradient-primary text-white shadow-medium hover:shadow-strong" 
                      : "text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-white dark:hover:bg-slate-600"
                  }`}
                  onClick={() => onBuyClick("Residential")}
                >
                  Buy
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                    propertyType === "ResidentialLease" 
                      ? "bg-gradient-primary text-white shadow-medium hover:shadow-strong" 
                      : "text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-white dark:hover:bg-slate-600"
                  }`}
                  onClick={() => onBuyClick("ResidentialLease")}
                >
                  Lease
                </Button>
              </div>

              <Select value={sortBy} onValueChange={(value) => {
                console.log('🔥 Sort dropdown changed to:', value);
                onSortChange(value as "recommended" | "price-asc" | "price-desc" | "date-desc" | "area-desc");
              }}>
                <SelectTrigger className="h-11 text-sm font-semibold w-[160px] md:w-[200px] bg-white dark:bg-slate-800 border-neutral-200 dark:border-slate-600 rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 text-neutral-900 dark:text-neutral-100 theme-transition">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-neutral-200 dark:border-slate-600 rounded-2xl shadow-strong theme-transition">
                  <SelectItem value="recommended" className="rounded-xl font-medium">Recommended</SelectItem>
                  <SelectItem value="price-asc" className="rounded-xl font-medium">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc" className="rounded-xl font-medium">Price: High to Low</SelectItem>
                  <SelectItem value="date-desc" className="rounded-xl font-medium">Newest First</SelectItem>
                  <SelectItem value="area-desc" className="rounded-xl font-medium">Largest Size</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

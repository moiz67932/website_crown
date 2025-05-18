"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SlidersHorizontal, X, Check } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import MapFilterSidebar from "./map-filter-sidebar"
import { Badge } from "@/components/ui/badge"
import type { FilterValues } from "./map-view-header"

interface MapFilterDrawerProps {
  activeFilters?: FilterValues
  onFilterChange?: (filters: FilterValues) => void
  onClearFilters?: () => void
}

export default function MapFilterDrawer({ activeFilters, onFilterChange, onClearFilters }: MapFilterDrawerProps) {
  const [open, setOpen] = useState(false)
  const [tempFilters, setTempFilters] = useState<FilterValues>(activeFilters || {})

  // Update temp filters when active filters change
  useState(() => {
    setTempFilters(activeFilters || {})
  })

  const handleFilterApply = (filters: FilterValues) => {
    setTempFilters(filters)
    if (onFilterChange) {
      onFilterChange(filters)
    }
    setOpen(false)
  }

  const handleClearFilters = () => {
    setTempFilters({})
    if (onClearFilters) {
      onClearFilters()
    }
    setOpen(false)
  }

  // Check if there are any active filters
  const hasActiveFilters = activeFilters && Object.keys(activeFilters).length > 0
  const filterCount = hasActiveFilters ? Object.keys(activeFilters).length : 0

  // Format price for display
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(0)}K`
    } else {
      return `$${price}`
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="h-9 px-3 bg-white text-slate-800 border shadow-md hover:bg-slate-100">
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-slate-800 text-white">
              {filterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="w-full h-[90vh] p-0 sm:max-w-none rounded-t-xl border-b-0 sm:h-[90vh]">
        <SheetHeader className="px-4 py-3 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div className="w-8">
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SheetTitle className="text-center">Filters</SheetTitle>
            <div className="w-8">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-xs h-8 px-2 text-slate-600"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Active filter summary */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-1 mt-2">
              {activeFilters?.propertyType && activeFilters.propertyType.length > 0 && (
                <Badge variant="outline" className="bg-slate-50 text-xs">
                  {activeFilters.propertyType.length} Types
                </Badge>
              )}
              {activeFilters?.status && activeFilters.status.length > 0 && (
                <Badge variant="outline" className="bg-slate-50 text-xs">
                  {activeFilters.status.join(", ")}
                </Badge>
              )}
              {activeFilters?.priceRange && (
                <Badge variant="outline" className="bg-slate-50 text-xs">
                  {formatPrice(activeFilters.priceRange[0])} - {formatPrice(activeFilters.priceRange[1])}
                </Badge>
              )}
              {activeFilters?.beds && (
                <Badge variant="outline" className="bg-slate-50 text-xs">
                  {activeFilters.beds} Beds
                </Badge>
              )}
              {activeFilters?.baths && (
                <Badge variant="outline" className="bg-slate-50 text-xs">
                  {activeFilters.baths} Baths
                </Badge>
              )}
              {activeFilters?.features && activeFilters.features.length > 0 && (
                <Badge variant="outline" className="bg-slate-50 text-xs">
                  {activeFilters.features.length} Features
                </Badge>
              )}
            </div>
          )}
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(90vh-130px)]">
          <MapFilterSidebar
            initialValues={activeFilters}
            onApplyFilters={handleFilterApply}
            onClearFilters={handleClearFilters}
            isMobile={true}
          />
        </div>

        <SheetFooter className="px-4 py-3 border-t border-slate-200 sticky bottom-0 bg-white z-10 flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button className="flex-1 bg-slate-800 hover:bg-slate-900" onClick={() => handleFilterApply(tempFilters)}>
            <Check className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

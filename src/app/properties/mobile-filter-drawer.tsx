"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SlidersHorizontal } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import FilterSidebar from "./filter-sidebar"

interface FilterSidebarProps {
  filters: {
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
    sortBy: "recommended" | "price-asc" | "price-desc" | "date-desc" | "area-desc"
  };
  onFilterChange: (filters: {
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
    sortBy: "recommended" | "price-asc" | "price-desc" | "date-desc" | "area-desc"
  }) => void;
}

export default function MobileFilterDrawer({ filters, onFilterChange }: FilterSidebarProps) {
  const [open, setOpen] = useState(false)
  const closeDrawer = () => {
    setOpen(false)
  }

  return (
    <div className="mb-4">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full flex items-center justify-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full sm:max-w-md p-0">
          <SheetHeader className="p-4 border-b border-slate-200">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto h-[calc(100vh-5rem)]">
            <FilterSidebar filters={filters} onFilterChange={onFilterChange} closeDrawer={closeDrawer} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

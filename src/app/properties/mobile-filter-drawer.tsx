"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SlidersHorizontal, X } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import FilterSidebar from "./filter-sidebar"

export default function MobileFilterDrawer() {
  const [open, setOpen] = useState(false)

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
            <div className="flex items-center justify-between">
              <SheetTitle>Filters</SheetTitle>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>
          <div className="overflow-y-auto h-[calc(100vh-5rem)]">
            <FilterSidebar />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

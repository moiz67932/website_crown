"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Map, List, X } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import PropertyListPanel from "./property-list-panel"

interface MapListToggleProps {
  filteredPropertyIds?: string[]
}

export default function MapListToggle({ filteredPropertyIds }: MapListToggleProps) {
  const [showList, setShowList] = useState(false)

  return (
    <div className="flex bg-white rounded-full shadow-md">
      <Button
        variant="ghost"
        size="sm"
        className={`rounded-l-full px-4 ${!showList ? "bg-slate-800 text-white hover:bg-slate-900" : ""}`}
        onClick={() => setShowList(false)}
      >
        <Map className="h-4 w-4 mr-1" />
        Map
      </Button>

      <Sheet open={showList} onOpenChange={setShowList}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-r-full px-4 ${showList ? "bg-slate-800 text-white hover:bg-slate-900" : ""}`}
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh] p-0 rounded-t-xl border-b-0">
          <SheetHeader className="px-4 py-3 border-b border-slate-200 sticky top-0 bg-white z-10">
            <div className="flex items-center justify-between">
              <SheetTitle>Properties</SheetTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowList(false)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>
          <div className="h-[calc(80vh-56px)] overflow-hidden">
            <PropertyListPanel onPropertyClick={() => setShowList(false)} filteredPropertyIds={filteredPropertyIds} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

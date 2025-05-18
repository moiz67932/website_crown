import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GridIcon, LayoutList } from "lucide-react"

interface IPropertyListingHeaderProps {
  totalProperties: number
  totalPages: number
  currentPage: number
}

export default function PropertyListingHeader({ totalProperties, totalPages, currentPage }: IPropertyListingHeaderProps) {
  const startIndex = (currentPage - 1) * 12 + 1
  const endIndex = Math.min(startIndex + 11, totalProperties)
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Properties</h1>
            <p className="text-slate-600 mt-1">Browse our extensive collection of premium properties</p>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center text-sm text-slate-600">
              <span>
                Showing <strong>{startIndex}-{endIndex}</strong> of <strong>{totalProperties}</strong> properties
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center border rounded-md overflow-hidden">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none border-r">
                  <GridIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none">
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>

              <Select defaultValue="recommended">
                <SelectTrigger className="h-8 text-xs md:text-sm w-[140px] md:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="date-desc">Newest First</SelectItem>
                  <SelectItem value="area-desc">Largest Size</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

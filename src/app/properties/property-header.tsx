import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GridIcon, LayoutList } from "lucide-react"

interface IPropertyListingHeaderProps {
  totalProperties: number
  currentPage: number
  sortBy: "recommended" | "price-asc" | "price-desc" | "date-desc" | "area-desc"
  propertyType: string
  onSortChange: (sort: "recommended" | "price-asc" | "price-desc" | "date-desc" | "area-desc") => void
  onBuyClick: (type: "Residential" | "ResidentialLease") => void
}

export default function PropertyListingHeader({ totalProperties, currentPage, sortBy, propertyType, onSortChange, onBuyClick }: IPropertyListingHeaderProps) {
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
                <Button
                  variant="default"
                  size="sm"
                  className={`h-8 px-4 rounded-none border-r-0 font-semibold text-sm ${propertyType !== "ResidentialLease" ? "bg-brand-sunsetBlush text-white hover:bg-brand-sunsetBlush/90 focus:bg-brand-sunsetBlush/90" : "bg-slate-100 text-slate-900 hover:bg-slate-200 focus:bg-slate-200"}`}
                  onClick={() => onBuyClick("Residential")}
                >
                  Buy
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className={`h-8 px-4 rounded-none border-r-0 font-semibold text-sm ${propertyType === "ResidentialLease" ?  "bg-brand-sunsetBlush text-white hover:bg-brand-sunsetBlush/90 focus:bg-brand-sunsetBlush/90" : "bg-slate-100 text-slate-900 hover:bg-slate-200 focus:bg-slate-200"}`}
                  onClick={() => onBuyClick("ResidentialLease")}
                >
                  Lease
                </Button>
              </div>

              <Select value={sortBy} onValueChange={onSortChange}>
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

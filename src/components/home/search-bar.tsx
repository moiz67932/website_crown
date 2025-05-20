"use client"

import { FormEvent, useState } from "react"
import { Search, MapPin, Home, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import useGetPropertyTypes from "@/hooks/queries/useGetPropertyType"

export default function SearchBar() {
  const [searchType, setSearchType] = useState("buy")
  const [location, setLocation] = useState("")
  const [propertyType, setPropertyType] = useState("any")
  const [priceRange, setPriceRange] = useState("any")
  const router = useRouter()

  const { data: propertyTypes, isLoading } = useGetPropertyTypes()

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()

    // Build query parameters
    const params = new URLSearchParams()

    if (location) {
      params.append("location", location)
    }

    if (propertyType !== "any") {
      params.append("propertyType", propertyType)
    }

    if (priceRange !== "any") {
      params.append("priceRange", priceRange)
    }

    // Redirect to map page with search parameters
    // router.push(`/map?${params.toString()}`)
  }
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 md:p-4 w-full max-w-4xl">
      <div className="flex gap-2 mb-3 md:mb-4">
        <Button
          variant={searchType === "buy" ? "default" : "outline"}
          onClick={() => setSearchType("buy")}
          className={`text-xs md:text-sm px-2 md:px-3 py- 1 h-auto ${searchType === "buy" ? "bg-slate-800 hover:bg-slate-900" : ""}`}
        >
          Buy
        </Button>
        <Button
          variant={searchType === "rent" ? "default" : "outline"}
          onClick={() => setSearchType("rent")}
          className={`text-xs md:text-sm px-2 md:px-3 py-1 h-auto ${searchType === "rent" ? "bg-slate-800 hover:bg-slate-900" : ""}`}
        >
          Rent
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
      <div className="sm:col-span-2">
          <div className="flex items-center border rounded-md px-2 md:px-3 py-1.5 md:py-2 bg-slate-50 focus-within:ring-1 focus-within:ring-slate-400 focus-within:border-slate-400">
            <MapPin className="h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Enter location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 text-sm h-7 md:h-8"
              aria-label="Search location"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleSearch(e)
                }
              }}
            />
          </div>
        </div>

        <div>
          <Select defaultValue="any" onValueChange={setPropertyType}>
            <SelectTrigger className="bg-slate-50 border focus:ring-1 focus:ring-slate-400 focus:border-slate-400 h-[34px] md:h-[42px] text-sm">
              <div className="flex items-center">
                <Home className="h-4 w-4 text-slate-400 mr-2" />
                <SelectValue placeholder="Property Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Type</SelectItem>
              {propertyTypes?.property_type.map((type: any) => (
                <SelectItem key={type._id} value={type.type}>{type.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select defaultValue="any" onValueChange={setPriceRange}>
            <SelectTrigger className="bg-slate-50 border focus:ring-1 focus:ring-slate-400 focus:border-slate-400 h-[34px] md:h-[42px] text-sm">
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 text-slate-400 mr-2" />
                <SelectValue placeholder="Price Range" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Price</SelectItem>
              <SelectItem value="100k-500k">$100k - $500k</SelectItem>
              <SelectItem value="500k-1m">$500k - $1M</SelectItem>
              <SelectItem value="1m-2m">$1M - $2M</SelectItem>
              <SelectItem value="2m-5m">$2M - $5M</SelectItem>
              <SelectItem value="5m+">$5M+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-3 md:mt-4 flex justify-end">
        <Button className="bg-slate-800 hover:bg-slate-900 text-xs md:text-sm h-8 md:h-10" onClick={handleSearch}>
          <Search className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
          Search Properties
        </Button>
      </div>
    </div>
  )
}

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
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()

  const { data: propertyTypes, isLoading } = useGetPropertyTypes()

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault()
    setIsSearching(true)

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

    // Simulate a network request
    setTimeout(() => {
      setIsSearching(false)
      // Redirect to map page with search parameters
      router.push(`/map?${params.toString()}`)
    }, 1000)
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 md:p-4 w-full max-w-4xl">
      <div className="flex gap-2 mb-3 md:mb-4">
        <Button
          variant={searchType === "buy" ? "default" : "outline"}
          onClick={() => setSearchType("buy")}
          className={`text-xs md:text-sm px-2 md:px-3 py-1 h-auto ${searchType === "buy" ? "bg-slate-800 hover:bg-slate-900" : ""}`}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 w-full">
        <div className="sm:col-span-2 w-full">
          <div className="flex items-center border rounded-md px-2 md:px-3 py-1.5 md:py-2 bg-slate-50 focus-within:ring-1 focus-within:ring-slate-400 focus-within:border-slate-400 w-full">
            <MapPin className="h-4 w-4 text-slate-400" />
            <Select defaultValue="any" onValueChange={setLocation}>
              <SelectTrigger className="bg-transparent border-0 focus:ring-0 focus:border-0 h-7 md:h-8 text-sm w-full">
                <SelectValue placeholder="Select County" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any County</SelectItem>
                <SelectItem value="los-angeles-county">Los Angeles County</SelectItem>
                <SelectItem value="orange-county">Orange County</SelectItem>
                <SelectItem value="san-diego-county">San Diego County</SelectItem>
                <SelectItem value="santa-clara-county">Santa Clara County</SelectItem>
                <SelectItem value="alameda-county">Alameda County</SelectItem>
                <SelectItem value="sacramento-county">Sacramento County</SelectItem>
                <SelectItem value="san-francisco-county">San Francisco County</SelectItem>
                <SelectItem value="riverside-county">Riverside County</SelectItem>
                <SelectItem value="san-bernardino-county">San Bernardino County</SelectItem>
                <SelectItem value="san-joaquin-county">San Joaquin County</SelectItem>
                <SelectItem value="san-luis-obispo-county">San Luis Obispo County</SelectItem>
                <SelectItem value="san-mateo-county">San Mateo County</SelectItem>
                <SelectItem value="santa-barbara-county">Santa Barbara County</SelectItem>
                <SelectItem value="santa-cruz-county">Santa Cruz County</SelectItem>
                <SelectItem value="shasta-county">Shasta County</SelectItem>
                <SelectItem value="sierra-county">Sierra County</SelectItem>
                <SelectItem value="siskiyou-county">Siskiyou County</SelectItem>
                <SelectItem value="solano-county">Solano County</SelectItem>
                <SelectItem value="sonoma-county">Sonoma County</SelectItem>
                <SelectItem value="stanislaus-county">Stanislaus County</SelectItem>
                <SelectItem value="sutter-county">Sutter County</SelectItem>
                <SelectItem value="tehama-county">Tehama County</SelectItem>
                <SelectItem value="trinity-county">Trinity County</SelectItem>
                <SelectItem value="tulare-county">Tulare County</SelectItem>
                <SelectItem value="tuolumne-county">Tuolumne County</SelectItem>
                <SelectItem value="ventura-county">Ventura County</SelectItem>
                <SelectItem value="yolo-county">Yolo County</SelectItem>
                <SelectItem value="yuba-county">Yuba County</SelectItem>
                <SelectItem value="alpine-county">Alpine County</SelectItem>
                <SelectItem value="amador-county">Amador County</SelectItem>
                <SelectItem value="butte-county">Butte County</SelectItem>
                <SelectItem value="calaveras-county">Calaveras County</SelectItem>
                <SelectItem value="colusa-county">Colusa County</SelectItem>
                <SelectItem value="contra-costa-county">Contra Costa County</SelectItem>
                <SelectItem value="del-norte-county">Del Norte County</SelectItem>
                <SelectItem value="el-dorado-county">El Dorado County</SelectItem>
                <SelectItem value="fresno-county">Fresno County</SelectItem>
                <SelectItem value="glenn-county">Glenn County</SelectItem>
                <SelectItem value="humboldt-county">Humboldt County</SelectItem>
                <SelectItem value="imperial-county">Imperial County</SelectItem>
                <SelectItem value="inyo-county">Inyo County</SelectItem>
                <SelectItem value="kern-county">Kern County</SelectItem>
                <SelectItem value="kings-county">Kings County</SelectItem>
                <SelectItem value="lake-county">Lake County</SelectItem>
                <SelectItem value="lassen-county">Lassen County</SelectItem>
                <SelectItem value="madera-county">Madera County</SelectItem>
                <SelectItem value="marin-county">Marin County</SelectItem>
                <SelectItem value="mariposa-county">Mariposa County</SelectItem>
                <SelectItem value="mendocino-county">Mendocino County</SelectItem>
                <SelectItem value="merced-county">Merced County</SelectItem>
                <SelectItem value="modoc-county">Modoc County</SelectItem>
                <SelectItem value="mono-county">Mono County</SelectItem>
                <SelectItem value="monterey-county">Monterey County</SelectItem>
                <SelectItem value="napa-county">Napa County</SelectItem>
                <SelectItem value="nevada-county">Nevada County</SelectItem>
                <SelectItem value="placer-county">Placer County</SelectItem>
                <SelectItem value="plumas-county">Plumas County</SelectItem>
                <SelectItem value="san-benito-county">San Benito County</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="w-full">
          <Select defaultValue="any" onValueChange={setPropertyType}>
            <SelectTrigger className="bg-slate-50 border focus:ring-1 focus:ring-slate-400 focus:border-slate-400 h-[34px] md:h-[42px] text-sm w-full">
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

        <div className="w-full">
          <Select defaultValue="any" onValueChange={setPriceRange}>
            <SelectTrigger className="bg-slate-50 border focus:ring-1 focus:ring-slate-400 focus:border-slate-400 h-[34px] md:h-[42px] text-sm w-full">
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
        <Button
          className={`bg-slate-800 hover:bg-slate-900 text-xs md:text-sm h-8 md:h-10 ${isSearching ? "cursor-wait" : "cursor-pointer"}`}
          onClick={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? (
            <span>Loading...</span>
          ) : (
            <>
              <Search className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              Search Properties
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

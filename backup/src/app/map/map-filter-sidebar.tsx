"use client"

import { Badge } from "@/components/ui/badge"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Home, Building, MapPin, Wifi, Car, Waves, Trees, Utensils, Dumbbell } from "lucide-react"
import type { FilterValues } from "./map-view-header"

interface MapFilterSidebarProps {
  initialValues?: FilterValues
  onApplyFilters?: (filters: FilterValues) => void
  onClearFilters?: () => void
  isMobile?: boolean
}

export default function MapFilterSidebar({
  initialValues,
  onApplyFilters,
  onClearFilters,
  isMobile = false,
}: MapFilterSidebarProps) {
  // Initialize state with initial values or defaults
  const [propertyTypes, setPropertyTypes] = useState<string[]>(initialValues?.propertyType || [])
  const [statusFilters, setStatusFilters] = useState<string[]>(initialValues?.status || [])
  const [priceRange, setPriceRange] = useState<[number, number]>(initialValues?.priceRange || [0, 5000000])
  const [bedsFilter, setBedsFilter] = useState<string>(initialValues?.beds || "Any")
  const [bathsFilter, setBathsFilter] = useState<string>(initialValues?.baths || "Any")
  const [areaRange, setAreaRange] = useState<[number, number]>(initialValues?.areaRange || [0, 10000])
  const [featuresFilter, setFeaturesFilter] = useState<string[]>(initialValues?.features || [])

  // Update state when initialValues change
  useEffect(() => {
    if (initialValues) {
      if (initialValues.propertyType) setPropertyTypes(initialValues.propertyType)
      if (initialValues.status) setStatusFilters(initialValues.status)
      if (initialValues.priceRange) setPriceRange(initialValues.priceRange)
      if (initialValues.beds) setBedsFilter(initialValues.beds)
      if (initialValues.baths) setBathsFilter(initialValues.baths)
      if (initialValues.areaRange) setAreaRange(initialValues.areaRange)
      if (initialValues.features) setFeaturesFilter(initialValues.features)
    }
  }, [initialValues])

  const togglePropertyType = (type: string) => {
    setPropertyTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  const toggleStatus = (status: string) => {
    setStatusFilters((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]))
  }

  const toggleFeature = (feature: string) => {
    setFeaturesFilter((prev) => (prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]))
  }

  const handleApplyFilters = () => {
    if (onApplyFilters) {
      const filters: FilterValues = {}

      if (propertyTypes.length > 0) filters.propertyType = propertyTypes
      if (statusFilters.length > 0) filters.status = statusFilters
      if (priceRange[0] > 0 || priceRange[1] < 5000000) filters.priceRange = priceRange
      if (bedsFilter !== "Any") filters.beds = bedsFilter
      if (bathsFilter !== "Any") filters.baths = bathsFilter
      if (areaRange[0] > 0 || areaRange[1] < 10000) filters.areaRange = areaRange
      if (featuresFilter.length > 0) filters.features = featuresFilter

      onApplyFilters(filters)
    }
  }

  const handleClearFilters = () => {
    setPropertyTypes([])
    setStatusFilters([])
    setPriceRange([0, 5000000])
    setBedsFilter("Any")
    setBathsFilter("Any")
    setAreaRange([0, 10000])
    setFeaturesFilter([])

    if (onClearFilters) {
      onClearFilters()
    }
  }

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
    <div className="bg-white overflow-hidden">
      <div className={isMobile ? "px-4 py-2" : "p-4"}>
        {!isMobile && (
          <>
            <h2 className="font-semibold text-lg text-slate-900">Filter Properties</h2>
            <p className="text-sm text-slate-500">Refine your map results</p>
          </>
        )}
      </div>

      <div className={isMobile ? "px-4 pb-4" : "p-4 max-h-[calc(100vh-180px)] overflow-y-auto"}>
        <Accordion
          type="multiple"
          defaultValue={["category", "status", "price", "bedsBaths", "features"]}
          className="space-y-2"
        >
          {/* Property Type */}
          <AccordionItem value="category" className="border rounded-lg overflow-hidden">
            <AccordionTrigger className="text-base font-medium px-4 py-3 hover:no-underline">
              Property Type
              {propertyTypes.length > 0 && (
                <Badge variant="outline" className="ml-2 bg-slate-100 text-xs">
                  {propertyTypes.length}
                </Badge>
              )}
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div
                  className={`flex flex-col items-center gap-1 p-2 border rounded-md hover:bg-slate-50 cursor-pointer ${
                    propertyTypes.includes("Houses") ? "bg-slate-100 border-slate-300" : ""
                  }`}
                  onClick={() => togglePropertyType("Houses")}
                >
                  <Home className="h-5 w-5 text-slate-600" />
                  <span className="text-xs text-center">Houses</span>
                </div>
                <div
                  className={`flex flex-col items-center gap-1 p-2 border rounded-md hover:bg-slate-50 cursor-pointer ${
                    propertyTypes.includes("Apartments") ? "bg-slate-100 border-slate-300" : ""
                  }`}
                  onClick={() => togglePropertyType("Apartments")}
                >
                  <Building className="h-5 w-5 text-slate-600" />
                  <span className="text-xs text-center">Apartments</span>
                </div>
                <div
                  className={`flex flex-col items-center gap-1 p-2 border rounded-md hover:bg-slate-50 cursor-pointer ${
                    propertyTypes.includes("Villas") ? "bg-slate-100 border-slate-300" : ""
                  }`}
                  onClick={() => togglePropertyType("Villas")}
                >
                  <Home className="h-5 w-5 text-slate-600" />
                  <span className="text-xs text-center">Villas</span>
                </div>
                <div
                  className={`flex flex-col items-center gap-1 p-2 border rounded-md hover:bg-slate-50 cursor-pointer ${
                    propertyTypes.includes("Commercial") ? "bg-slate-100 border-slate-300" : ""
                  }`}
                  onClick={() => togglePropertyType("Commercial")}
                >
                  <Building className="h-5 w-5 text-slate-600" />
                  <span className="text-xs text-center">Commercial</span>
                </div>
                <div
                  className={`flex flex-col items-center gap-1 p-2 border rounded-md hover:bg-slate-50 cursor-pointer ${
                    propertyTypes.includes("Land") ? "bg-slate-100 border-slate-300" : ""
                  }`}
                  onClick={() => togglePropertyType("Land")}
                >
                  <MapPin className="h-5 w-5 text-slate-600" />
                  <span className="text-xs text-center">Land</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Status */}
          <AccordionItem value="status" className="border rounded-lg overflow-hidden">
            <AccordionTrigger className="text-base font-medium px-4 py-3 hover:no-underline">
              Status
              {statusFilters.length > 0 && (
                <Badge variant="outline" className="ml-2 bg-slate-100 text-xs">
                  {statusFilters.length}
                </Badge>
              )}
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div
                  className={`flex items-center justify-center gap-2 p-3 border rounded-md hover:bg-slate-50 cursor-pointer ${
                    statusFilters.includes("For Sale") ? "bg-slate-100 border-slate-300" : ""
                  }`}
                  onClick={() => toggleStatus("For Sale")}
                >
                  <Checkbox checked={statusFilters.includes("For Sale")} className="pointer-events-none" />
                  <Label className="text-sm cursor-pointer">For Sale</Label>
                </div>
                <div
                  className={`flex items-center justify-center gap-2 p-3 border rounded-md hover:bg-slate-50 cursor-pointer ${
                    statusFilters.includes("For Rent") ? "bg-slate-100 border-slate-300" : ""
                  }`}
                  onClick={() => toggleStatus("For Rent")}
                >
                  <Checkbox checked={statusFilters.includes("For Rent")} className="pointer-events-none" />
                  <Label className="text-sm cursor-pointer">For Rent</Label>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Price Range */}
          <AccordionItem value="price" className="border rounded-lg overflow-hidden">
            <AccordionTrigger className="text-base font-medium px-4 py-3 hover:no-underline">
              Price Range
              {(priceRange[0] > 0 || priceRange[1] < 5000000) && (
                <Badge variant="outline" className="ml-2 bg-slate-100 text-xs">
                  {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                </Badge>
              )}
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4 pt-2">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{formatPrice(priceRange[0])}</span>
                  <span>{formatPrice(priceRange[1])}</span>
                </div>
                <Slider
                  value={priceRange}
                  min={0}
                  max={5000000}
                  step={50000}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                  className="py-4"
                />
                <div className="flex items-center justify-between gap-4">
                  <div className="w-full">
                    <Label htmlFor="price-min" className="text-xs text-slate-500">
                      Min Price
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                      <Input
                        id="price-min"
                        type="number"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([Number.parseInt(e.target.value), priceRange[1]])}
                        className="pl-7"
                      />
                    </div>
                  </div>
                  <div className="w-full">
                    <Label htmlFor="price-max" className="text-xs text-slate-500">
                      Max Price
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                      <Input
                        id="price-max"
                        type="number"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number.parseInt(e.target.value)])}
                        className="pl-7"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Beds & Baths */}
          <AccordionItem value="bedsBaths" className="border rounded-lg overflow-hidden">
            <AccordionTrigger className="text-base font-medium px-4 py-3 hover:no-underline">
              Beds & Baths
              {(bedsFilter !== "Any" || bathsFilter !== "Any") && (
                <Badge variant="outline" className="ml-2 bg-slate-100 text-xs">
                  {bedsFilter !== "Any" ? bedsFilter : ""} {bathsFilter !== "Any" ? bathsFilter : ""}
                </Badge>
              )}
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4 pt-2">
                <div>
                  <Label className="text-sm mb-2 block">Bedrooms</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Any", "1+", "2+", "3+", "4+", "5+"].map((num) => (
                      <Button
                        key={num}
                        variant={bedsFilter === num ? "default" : "outline"}
                        className={`h-10 px-3 text-sm ${bedsFilter === num ? "bg-slate-800" : ""}`}
                        onClick={() => setBedsFilter(num)}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm mb-2 block">Bathrooms</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Any", "1+", "2+", "3+", "4+", "5+"].map((num) => (
                      <Button
                        key={num}
                        variant={bathsFilter === num ? "default" : "outline"}
                        className={`h-10 px-3 text-sm ${bathsFilter === num ? "bg-slate-800" : ""}`}
                        onClick={() => setBathsFilter(num)}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Area */}
          <AccordionItem value="area" className="border rounded-lg overflow-hidden">
            <AccordionTrigger className="text-base font-medium px-4 py-3 hover:no-underline">
              Area (Sq Ft)
              {(areaRange[0] > 0 || areaRange[1] < 10000) && (
                <Badge variant="outline" className="ml-2 bg-slate-100 text-xs">
                  {areaRange[0].toLocaleString()} - {areaRange[1].toLocaleString()}
                </Badge>
              )}
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4 pt-2">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{areaRange[0].toLocaleString()} sq ft</span>
                  <span>{areaRange[1].toLocaleString()} sq ft</span>
                </div>
                <Slider
                  value={areaRange}
                  min={0}
                  max={10000}
                  step={100}
                  onValueChange={(value) => setAreaRange(value as [number, number])}
                  className="py-4"
                />
                <div className="flex items-center justify-between gap-4">
                  <div className="w-full">
                    <Label htmlFor="area-min" className="text-xs text-slate-500">
                      Min Area
                    </Label>
                    <Input
                      id="area-min"
                      type="number"
                      value={areaRange[0]}
                      onChange={(e) => setAreaRange([Number.parseInt(e.target.value), areaRange[1]])}
                    />
                  </div>
                  <div className="w-full">
                    <Label htmlFor="area-max" className="text-xs text-slate-500">
                      Max Area
                    </Label>
                    <Input
                      id="area-max"
                      type="number"
                      value={areaRange[1]}
                      onChange={(e) => setAreaRange([areaRange[0], Number.parseInt(e.target.value)])}
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Features */}
          <AccordionItem value="features" className="border rounded-lg overflow-hidden">
            <AccordionTrigger className="text-base font-medium px-4 py-3 hover:no-underline">
              Features & Amenities
              {featuresFilter.length > 0 && (
                <Badge variant="outline" className="ml-2 bg-slate-100 text-xs">
                  {featuresFilter.length}
                </Badge>
              )}
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid grid-cols-1 gap-3 pt-2">
                <div
                  className={`flex items-center gap-2 p-3 border rounded-md hover:bg-slate-50 cursor-pointer ${
                    featuresFilter.includes("Swimming Pool") ? "bg-slate-100 border-slate-300" : ""
                  }`}
                  onClick={() => toggleFeature("Swimming Pool")}
                >
                  <Checkbox checked={featuresFilter.includes("Swimming Pool")} className="pointer-events-none" />
                  <Label className="text-sm flex items-center cursor-pointer">
                    <Waves className="h-4 w-4 mr-2 text-slate-500" />
                    Swimming Pool
                  </Label>
                </div>
                <div
                  className={`flex items-center gap-2 p-3 border rounded-md hover:bg-slate-50 cursor-pointer ${
                    featuresFilter.includes("Garage") ? "bg-slate-100 border-slate-300" : ""
                  }`}
                  onClick={() => toggleFeature("Garage")}
                >
                  <Checkbox checked={featuresFilter.includes("Garage")} className="pointer-events-none" />
                  <Label className="text-sm flex items-center cursor-pointer">
                    <Car className="h-4 w-4 mr-2 text-slate-500" />
                    Garage
                  </Label>
                </div>
                <div
                  className={`flex items-center gap-2 p-3 border rounded-md hover:bg-slate-50 cursor-pointer ${
                    featuresFilter.includes("Garden") ? "bg-slate-100 border-slate-300" : ""
                  }`}
                  onClick={() => toggleFeature("Garden")}
                >
                  <Checkbox checked={featuresFilter.includes("Garden")} className="pointer-events-none" />
                  <Label className="text-sm flex items-center cursor-pointer">
                    <Trees className="h-4 w-4 mr-2 text-slate-500" />
                    Garden
                  </Label>
                </div>
                <div
                  className={`flex items-center gap-2 p-3 border rounded-md hover:bg-slate-50 cursor-pointer ${
                    featuresFilter.includes("High-Speed Internet") ? "bg-slate-100 border-slate-300" : ""
                  }`}
                  onClick={() => toggleFeature("High-Speed Internet")}
                >
                  <Checkbox checked={featuresFilter.includes("High-Speed Internet")} className="pointer-events-none" />
                  <Label className="text-sm flex items-center cursor-pointer">
                    <Wifi className="h-4 w-4 mr-2 text-slate-500" />
                    High-Speed Internet
                  </Label>
                </div>
                <div
                  className={`flex items-center gap-2 p-3 border rounded-md hover:bg-slate-50 cursor-pointer ${
                    featuresFilter.includes("Modern Kitchen") ? "bg-slate-100 border-slate-300" : ""
                  }`}
                  onClick={() => toggleFeature("Modern Kitchen")}
                >
                  <Checkbox checked={featuresFilter.includes("Modern Kitchen")} className="pointer-events-none" />
                  <Label className="text-sm flex items-center cursor-pointer">
                    <Utensils className="h-4 w-4 mr-2 text-slate-500" />
                    Modern Kitchen
                  </Label>
                </div>
                <div
                  className={`flex items-center gap-2 p-3 border rounded-md hover:bg-slate-50 cursor-pointer ${
                    featuresFilter.includes("Fitness Center") ? "bg-slate-100 border-slate-300" : ""
                  }`}
                  onClick={() => toggleFeature("Fitness Center")}
                >
                  <Checkbox checked={featuresFilter.includes("Fitness Center")} className="pointer-events-none" />
                  <Label className="text-sm flex items-center cursor-pointer">
                    <Dumbbell className="h-4 w-4 mr-2 text-slate-500" />
                    Fitness Center
                  </Label>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {!isMobile && (
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex gap-2">
            <Button className="w-full bg-slate-800 hover:bg-slate-900" onClick={handleApplyFilters}>
              Apply Filters
            </Button>
            <Button variant="outline" className="flex-shrink-0" onClick={handleClearFilters}>
              Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

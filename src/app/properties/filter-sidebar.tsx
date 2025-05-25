"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building, Wifi, Car, Waves, Trees, Utensils, Dumbbell } from "lucide-react"
import useGetPropertyTypes from "@/hooks/queries/useGetPropertyType"

interface FilterSidebarProps {
  filters: {
    propertyType: string;
    minPrice: number | undefined;
    maxPrice: number | undefined;
    minBathroom: number | undefined;
    minBedroom: number | undefined;
    yearBuilt: number | undefined;
    max_sqft: number | undefined;
    min_sqft: number | undefined;
    city: string;
    county: string;
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
  }) => void;
}

export default function FilterSidebar({ filters, onFilterChange }: FilterSidebarProps) {
  const [priceRange, setPriceRange] = useState([filters.minPrice || 0, filters.maxPrice || 5000000])
  const [areaRange, setAreaRange] = useState([0, 10000])
  const { data: propertyTypes, isLoading } = useGetPropertyTypes()

  const handlePriceChange = (newRange: number[]) => {
    setPriceRange(newRange)
    onFilterChange({
      ...filters,
      minPrice: newRange[0],
      maxPrice: newRange[1]
    })
  }

  const handlePropertyTypeSelect = (type: string) => {
    onFilterChange({
      ...filters,
      propertyType: type
    })
  }

  const handleCitySelect = (city: string) => {
    onFilterChange({
      ...filters,
      city
    })
  }

  const handleBedroomSelect = (bedrooms: string) => {
    const minBedroom = bedrooms === "Any" ? undefined : parseInt(bedrooms);
    onFilterChange({
      ...filters,
      minBedroom
    })
  }

  const handleBathroomSelect = (bathrooms: string) => {
    const minBathroom = bathrooms === "Any" ? undefined : parseInt(bathrooms);
    onFilterChange({
      ...filters,
      minBathroom
    })
  }

  const handleYearBuiltSelect = (yearBuilt: string) => {
    const currentYear = new Date().getFullYear();
    const year = yearBuilt === "any" ? undefined : yearBuilt === "new" ? currentYear : currentYear - parseInt(yearBuilt);
    
    onFilterChange({
      ...filters,
      yearBuilt: year,
    });
  }

  const handleReset = () => {
    setPriceRange([0, 5000000])
    setAreaRange([0, 10000])
    onFilterChange({
      propertyType: "",
      minPrice: undefined,
      maxPrice: undefined,
      city: "",
      county: "",
      minBathroom: undefined,
      minBedroom: undefined,
      yearBuilt: undefined,
      max_sqft: undefined,
      min_sqft: undefined
    })
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden sticky top-24">
      <div className="p-4 border-b border-slate-200">
        <h2 className="font-semibold text-lg text-slate-900">Filter Properties</h2>
        <p className="text-sm text-slate-500">Refine your search results</p>
      </div>

      <div className="p-4 max-h-[calc(80vh-180px)] overflow-y-auto">
        <Accordion type="multiple" defaultValue={["category", "price", "bedsBaths", "features"]}>
          {/* Property Type */}
          <AccordionItem value="category">
            <AccordionTrigger className="text-base font-medium">Property Type</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-2 pt-2">
                {propertyTypes?.property_type?.map((type: any) => (
                  <div 
                    key={type._id}
                    className={`flex flex-col items-center gap-1 p-2 border rounded-md hover:bg-slate-50 cursor-pointer ${filters.propertyType === type.type ? 'bg-slate-50 border-slate-300' : ''}`}
                    onClick={() => handlePropertyTypeSelect(type.type)}
                  >
                    <Building className="h-5 w-5 text-slate-600" />
                    <span className="text-xs text-center">{type.name}</span>
                  </div>
                ))}
                {isLoading && <p>Loading property types...</p>}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Status */}
          {/* <AccordionItem value="status">
            <AccordionTrigger className="text-base font-medium">Status</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="status-sale" />
                  <Label htmlFor="status-sale" className="text-sm">
                    For Sale
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="status-rent" />
                  <Label htmlFor="status-rent" className="text-sm">
                    For Rent
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="status-sold" />
                  <Label htmlFor="status-sold" className="text-sm">
                    Sold
                  </Label>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem> */}

          {/* Price Range */}
          <AccordionItem value="price">
            <AccordionTrigger className="text-base font-medium">Price Range</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <Slider
                  value={priceRange}
                  min={0}
                  max={5000000}
                  step={50000}
                  onValueChange={handlePriceChange}
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
                        onChange={(e) => handlePriceChange([Number.parseInt(e.target.value), priceRange[1]])}
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
                        onChange={(e) => handlePriceChange([priceRange[0], Number.parseInt(e.target.value)])}
                        className="pl-7"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Beds & Baths */}
          <AccordionItem value="bedsBaths">
            <AccordionTrigger className="text-base font-medium">Beds & Baths</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <div>
                  <Label className="text-sm mb-2 block">Bedrooms</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Any", "1+", "2+", "3+", "4+", "5+"].map((num) => (
                      <Button 
                        key={num} 
                        variant="outline" 
                        className={`h-8 px-3 text-xs rounded-full ${filters.minBedroom === parseInt(num) ? 'bg-slate-50 border-slate-300' : ''}`}
                        onClick={() => handleBedroomSelect(num)}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm mb-2 block">Bathrooms</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Any", "1+", "2+", "3+", "4+", "5+"].map((num) => (
                      <Button 
                        key={num} 
                        variant="outline" 
                        className={`h-8 px-3 text-xs rounded-full ${filters.minBathroom === parseInt(num) ? 'bg-slate-50 border-slate-300' : ''}`}
                        onClick={() => handleBathroomSelect(num)}
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
          <AccordionItem value="area">
            <AccordionTrigger className="text-base font-medium">Area (Sq Ft)</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <Slider
                  value={areaRange}
                  min={0}
                  max={10000}
                  step={100}
                  onValueChange={setAreaRange}
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

          {/* Location
          <AccordionItem value="location">
            <AccordionTrigger className="text-base font-medium">Location</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <Select value={filters.city} onValueChange={handleCitySelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="los-angeles">Los Angeles</SelectItem>
                    <SelectItem value="san-francisco">San Francisco</SelectItem>
                    <SelectItem value="new-york">New York</SelectItem>
                    <SelectItem value="miami">Miami</SelectItem>
                    <SelectItem value="chicago">Chicago</SelectItem>
                  </SelectContent>
                </Select>

                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Neighborhood" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="downtown">Downtown</SelectItem>
                    <SelectItem value="west-side">West Side</SelectItem>
                    <SelectItem value="east-side">East Side</SelectItem>
                    <SelectItem value="north-end">North End</SelectItem>
                    <SelectItem value="south-bay">South Bay</SelectItem>
                  </SelectContent>
                </Select>

                <div>
                  <Label htmlFor="zip-code" className="text-sm">
                    Zip Code
                  </Label>
                  <Input id="zip-code" placeholder="Enter zip code" />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem> */}

          {/* Features
          <AccordionItem value="features">
            <AccordionTrigger className="text-base font-medium">Features & Amenities</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 gap-2 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="feature-pool" />
                  <Label htmlFor="feature-pool" className="text-sm flex items-center">
                    <Waves className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                    Swimming Pool
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="feature-garage" />
                  <Label htmlFor="feature-garage" className="text-sm flex items-center">
                    <Car className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                    Garage
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="feature-garden" />
                  <Label htmlFor="feature-garden" className="text-sm flex items-center">
                    <Trees className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                    Garden
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="feature-wifi" />
                  <Label htmlFor="feature-wifi" className="text-sm flex items-center">
                    <Wifi className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                    High-Speed Internet
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="feature-kitchen" />
                  <Label htmlFor="feature-kitchen" className="text-sm flex items-center">
                    <Utensils className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                    Modern Kitchen
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="feature-gym" />
                  <Label htmlFor="feature-gym" className="text-sm flex items-center">
                    <Dumbbell className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                    Fitness Center
                  </Label>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem> */}

          {/* Year Built */}
          <AccordionItem value="year">
            <AccordionTrigger className="text-base font-medium">Year Built</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                <Select value={filters.yearBuilt ? filters.yearBuilt.toString() : "Any"} onValueChange={handleYearBuiltSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Any">Any Year</SelectItem>
                    <SelectItem value={new Date().getFullYear().toString()}>New Construction</SelectItem>
                    <SelectItem value={(new Date().getFullYear() - 5).toString()}>Built within 5 years</SelectItem>
                    <SelectItem value={(new Date().getFullYear() - 10).toString()}>Built within 10 years</SelectItem>
                    <SelectItem value={(new Date().getFullYear() - 20).toString()}>Built within 20 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex gap-2">
          <Button className="w-full bg-slate-800 hover:bg-slate-900">Apply Filters</Button>
          <Button variant="outline" className="flex-shrink-0" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  )
}

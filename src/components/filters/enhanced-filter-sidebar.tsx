"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Building, Building2, Home, Trees, Car, Waves, Flame, Dumbbell, Shield, 
  Wifi, Utensils, Wind, Thermometer, ArrowUp, User, Heart, Accessibility,
  MapPin, Calendar, DollarSign, Bed, Bath, Maximize, Search
} from "lucide-react"
import { PropertyFilters, PROPERTY_FEATURES, PROPERTY_TYPES, PROPERTY_STATUS, SORT_OPTIONS } from "@/types/filters"
import useGetPropertyTypes from "@/hooks/queries/useGetPropertyType"

interface EnhancedFilterSidebarProps {
  filters: PropertyFilters;
  onFilterChange: (filters: PropertyFilters) => void;
  closeDrawer?: () => void;
  showAdvanced?: boolean;
  compact?: boolean;
}

const ICONS = {
  Home, Building, Building2, Trees, Car, Waves, Flame, Dumbbell, Shield,
  Wifi, Utensils, Wind, Thermometer, ArrowUp, User, Heart, Accessibility
}

export default function EnhancedFilterSidebar({ 
  filters, 
  onFilterChange, 
  closeDrawer,
  showAdvanced = false,
  compact = false
}: EnhancedFilterSidebarProps) {
  
  // State for range sliders
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.priceRange?.[0] || 0, 
    filters.priceRange?.[1] || 5000000
  ]);
  
  const [areaRange, setAreaRange] = useState<[number, number]>([
    filters.areaRange?.[0] || 0, 
    filters.areaRange?.[1] || 10000
  ]);
  
  const [lotSizeRange, setLotSizeRange] = useState<[number, number]>([
    filters.lotSizeRange?.[0] || 0, 
    filters.lotSizeRange?.[1] || 50000
  ]);
  
  const [yearBuiltRange, setYearBuiltRange] = useState<[number, number]>([
    filters.yearBuiltRange?.[0] || 1900, 
    filters.yearBuiltRange?.[1] || new Date().getFullYear()
  ]);

  const [showMoreFeatures, setShowMoreFeatures] = useState(false);
  const [activeFeatures, setActiveFeatures] = useState<string[]>(filters.features || []);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>(filters.propertyType || []);
  const [selectedStatus, setSelectedStatus] = useState<string[]>(filters.status || []);

  const { data: propertyTypesData, isLoading } = useGetPropertyTypes();
  
  // Use static property types if API is not working
  const propertyTypes = propertyTypesData?.property_type?.length ? propertyTypesData.property_type : PROPERTY_TYPES;

  // Ref to track if component is mounted
  const isMounted = useRef(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Update internal state when filters change
  useEffect(() => {
    if (filters.priceRange) setPriceRange(filters.priceRange);
    if (filters.areaRange) setAreaRange(filters.areaRange);
    if (filters.lotSizeRange) setLotSizeRange(filters.lotSizeRange);
    if (filters.yearBuiltRange) setYearBuiltRange(filters.yearBuiltRange);
    if (filters.features) setActiveFeatures(filters.features);
    if (filters.propertyType) setSelectedPropertyTypes(filters.propertyType);
    if (filters.status) setSelectedStatus(filters.status);
  }, [filters]);

  // Mark component as mounted
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
        debounceTimeout.current = null;
      }
    };
  }, []);

  // Debounced filter updates using useCallback and useEffect
  // DISABLED: Only apply filters when "Apply Filters" button is clicked
  const debouncedFilterUpdate = useCallback(() => {
    // Auto-update disabled - filters only applied on button click
    return;
  }, []);

  // Effect to trigger debounced updates when dependencies change
  // DISABLED: Only apply filters when "Apply Filters" button is clicked
  useEffect(() => {
    // Auto-update disabled - filters only applied on button click
  }, []);

  const handlePropertyTypeToggle = (type: string) => {
    const newTypes = selectedPropertyTypes.includes(type)
      ? selectedPropertyTypes.filter(t => t !== type)
      : [...selectedPropertyTypes, type];
    setSelectedPropertyTypes(newTypes);
  };

  const handleStatusToggle = (status: string) => {
    const newStatus = selectedStatus.includes(status)
      ? selectedStatus.filter(s => s !== status)
      : [...selectedStatus, status];
    setSelectedStatus(newStatus);
  };

  const handleFeatureToggle = (feature: string) => {
    const newFeatures = activeFeatures.includes(feature)
      ? activeFeatures.filter(f => f !== feature)
      : [...activeFeatures, feature];
    setActiveFeatures(newFeatures);
  };

  const handleInputChange = (key: keyof PropertyFilters, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  const handleReset = () => {
    setPriceRange([0, 5000000]);
    setAreaRange([0, 10000]);
    setLotSizeRange([0, 50000]);
    setYearBuiltRange([1900, new Date().getFullYear()]);
    setActiveFeatures([]);
    setSelectedPropertyTypes([]);
    setSelectedStatus([]);
    
    onFilterChange({
      sortBy: "recommended"
    });
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(0)}K`;
    } else {
      return `$${price}`;
    }
  };

  const formatArea = (area: number) => {
    if (area >= 1000) {
      return `${(area / 1000).toFixed(1)}K sq ft`;
    }
    return `${area} sq ft`;
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedPropertyTypes.length > 0) count++;
    if (selectedStatus.length > 0) count++;
    if (priceRange[0] !== 0 || priceRange[1] !== 5000000) count++;
    if (filters.beds && filters.beds !== "Any") count++;
    if (filters.baths && filters.baths !== "Any") count++;
    if (areaRange[0] !== 0 || areaRange[1] !== 10000) count++;
    if (lotSizeRange[0] !== 0 || lotSizeRange[1] !== 50000) count++;
    if (yearBuiltRange[0] !== 1900 || yearBuiltRange[1] !== new Date().getFullYear()) count++;
    if (activeFeatures.length > 0) count++;
    if (filters.city || filters.county || filters.zipCode) count++;
    return count;
  };

  const accordionDefaultValues = showAdvanced 
    ? ["propertyType", "status", "price", "bedsBaths", "area", "lotSize", "yearBuilt", "features", "location"]
    : ["propertyType", "price", "bedsBaths", "features"];

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-700 shadow-soft overflow-hidden transition-all duration-300 theme-transition ${compact ? '' : 'sticky top-24'}`}>
      <div className="p-6 border-b border-neutral-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-neutral-100 theme-transition">Filter Properties</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 theme-transition">
              {getActiveFiltersCount() > 0 && `${getActiveFiltersCount()} filters active`}
            </p>
          </div>
          <Search className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
        </div>
      </div>

      <div className={`p-4 ${compact ? 'max-h-[60vh]' : 'max-h-[calc(80vh-180px)]'} overflow-y-auto`}>
        <Accordion type="multiple" defaultValue={accordionDefaultValues}>
          
          {/* Property Type */}
          <AccordionItem value="propertyType">
            <AccordionTrigger className="text-base font-medium">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Property Type
                {selectedPropertyTypes.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {selectedPropertyTypes.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-2 pt-2">
                {propertyTypes.map((type: any) => {
                  const Icon = ICONS[type.icon as keyof typeof ICONS] || Building;
                  const isSelected = selectedPropertyTypes.includes(type.value || type.type);
                  
                  return (
                    <div 
                      key={type.value || type._id || type.type}
                      className={`flex flex-col items-center gap-1 p-3 border rounded-xl hover:bg-neutral-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all duration-300 theme-transition ${
                        isSelected 
                          ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-700 text-primary-700 dark:text-primary-300' 
                          : 'border-neutral-200 dark:border-slate-600 text-neutral-700 dark:text-neutral-300'
                      }`}
                      onClick={() => handlePropertyTypeToggle(type.value || type.type)}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs text-center font-medium">{type.label || type.name || type.type}</span>
                    </div>
                  );
                })}
                {isLoading && propertyTypes === PROPERTY_TYPES && <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading property types...</p>}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Status */}
          <AccordionItem value="status">
            <AccordionTrigger className="text-base font-medium">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Status
                {selectedStatus.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {selectedStatus.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {PROPERTY_STATUS.map((status) => (
                  <div key={status.value} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`status-${status.value}`}
                      checked={selectedStatus.includes(status.value)}
                      onCheckedChange={() => handleStatusToggle(status.value)}
                    />
                    <Label htmlFor={`status-${status.value}`} className="text-sm flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-${status.color}-500`} />
                      {status.label}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Price Range */}
          <AccordionItem value="price">
            <AccordionTrigger className="text-base font-medium">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Price Range
                {(priceRange[0] !== 0 || priceRange[1] !== 5000000) && (
                  <Badge variant="secondary" className="ml-auto">
                    {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <Slider
                  value={[
                    isNaN(priceRange[0]) ? 0 : priceRange[0], 
                    isNaN(priceRange[1]) ? 5000000 : priceRange[1]
                  ]}
                  min={0}
                  max={5000000}
                  step={50000}
                  onValueChange={(value) => {
                    console.log('Price range slider changed:', value);
                    if (value && value.length === 2 && !isNaN(value[0]) && !isNaN(value[1])) {
                      setPriceRange([value[0], value[1]]);
                    }
                  }}
                  className="py-4"
                />
                <div className="flex items-center justify-between gap-4">
                  <div className="w-full">
                    <Label htmlFor="price-min" className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold">
                      Min Price
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400">$</span>
                      <Input
                        id="price-min"
                        type="number"
                        value={isNaN(priceRange[0]) ? 0 : priceRange[0]}
                        onChange={(e) => {
                          const value = e.target.value;
                          const newMin = value === '' ? 0 : Number.parseInt(value);
                          if (!isNaN(newMin)) {
                            console.log('Price min input changed:', newMin);
                            setPriceRange([newMin, priceRange[1]]);
                          }
                        }}
                        className="pl-7"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="w-full">
                    <Label htmlFor="price-max" className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold">
                      Max Price
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400">$</span>
                      <Input
                        id="price-max"
                        type="number"
                        value={isNaN(priceRange[1]) ? 5000000 : priceRange[1]}
                        onChange={(e) => {
                          const value = e.target.value;
                          const newMax = value === '' ? 5000000 : Number.parseInt(value);
                          if (!isNaN(newMax)) {
                            console.log('Price max input changed:', newMax);
                            setPriceRange([priceRange[0], newMax]);
                          }
                        }}
                        className="pl-7"
                        placeholder="5000000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Beds & Baths */}
          <AccordionItem value="bedsBaths">
            <AccordionTrigger className="text-base font-medium">
              <div className="flex items-center gap-2">
                <Bed className="h-4 w-4" />
                Beds & Baths
                {(filters.beds && filters.beds !== "Any") || (filters.baths && filters.baths !== "Any") ? (
                  <Badge variant="secondary" className="ml-auto">
                    {filters.beds && filters.beds !== "Any" ? filters.beds : ''} 
                    {filters.beds && filters.beds !== "Any" && filters.baths && filters.baths !== "Any" ? ' / ' : ''}
                    {filters.baths && filters.baths !== "Any" ? filters.baths : ''}
                  </Badge>
                ) : null}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <div>
                  <Label className="text-sm mb-2 block">Bedrooms</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Any", "1+", "2+", "3+", "4+", "5+"].map((num) => (
                      <Button 
                        key={num} 
                        variant={filters.beds === num ? "default" : "outline"}
                        className="h-8 px-3 text-xs rounded-full"
                        onClick={() => handleInputChange('beds', num)}
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
                        variant={filters.baths === num ? "default" : "outline"}
                        className="h-8 px-3 text-xs rounded-full"
                        onClick={() => handleInputChange('baths', num)}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Living Area */}
          <AccordionItem value="area">
            <AccordionTrigger className="text-base font-medium">
              <div className="flex items-center gap-2">
                <Maximize className="h-4 w-4" />
                Living Area
                {(areaRange[0] !== 0 || areaRange[1] !== 10000) && (
                  <Badge variant="secondary" className="ml-auto">
                    {formatArea(areaRange[0])} - {formatArea(areaRange[1])}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <Slider
                  value={areaRange}
                  min={0}
                  max={10000}
                  step={100}
                  onValueChange={(value) => setAreaRange([value[0], value[1]])}
                  className="py-4"
                />
                <div className="flex items-center justify-between gap-4">
                  <div className="w-full">
                    <Label htmlFor="area-min" className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold">
                      Min Area (sq ft)
                    </Label>
                    <Input
                      id="area-min"
                      type="number"
                      value={areaRange[0]}
                      onChange={(e) => setAreaRange([Number.parseInt(e.target.value) || 0, areaRange[1]])}
                    />
                  </div>
                  <div className="w-full">
                    <Label htmlFor="area-max" className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold">
                      Max Area (sq ft)
                    </Label>
                    <Input
                      id="area-max"
                      type="number"
                      value={areaRange[1]}
                      onChange={(e) => setAreaRange([areaRange[0], Number.parseInt(e.target.value) || 10000])}
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Lot Size - Advanced Filter */}
          {showAdvanced && (
            <AccordionItem value="lotSize">
              <AccordionTrigger className="text-base font-medium">
                <div className="flex items-center gap-2">
                  <Trees className="h-4 w-4" />
                  Lot Size
                  {(lotSizeRange[0] !== 0 || lotSizeRange[1] !== 50000) && (
                    <Badge variant="secondary" className="ml-auto">
                      {formatArea(lotSizeRange[0])} - {formatArea(lotSizeRange[1])}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <Slider
                    value={lotSizeRange}
                    min={0}
                    max={50000}
                    step={500}
                    onValueChange={(value) => setLotSizeRange([value[0], value[1]])}
                    className="py-4"
                  />
                  <div className="flex items-center justify-between gap-4">
                    <div className="w-full">
                      <Label htmlFor="lot-min" className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold">
                        Min Lot Size (sq ft)
                      </Label>
                      <Input
                        id="lot-min"
                        type="number"
                        value={lotSizeRange[0]}
                        onChange={(e) => setLotSizeRange([Number.parseInt(e.target.value) || 0, lotSizeRange[1]])}
                      />
                    </div>
                    <div className="w-full">
                      <Label htmlFor="lot-max" className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold">
                        Max Lot Size (sq ft)
                      </Label>
                      <Input
                        id="lot-max"
                        type="number"
                        value={lotSizeRange[1]}
                        onChange={(e) => setLotSizeRange([lotSizeRange[0], Number.parseInt(e.target.value) || 50000])}
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Year Built - Advanced Filter */}
          {showAdvanced && (
            <AccordionItem value="yearBuilt">
              <AccordionTrigger className="text-base font-medium">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Year Built
                  {(yearBuiltRange[0] !== 1900 || yearBuiltRange[1] !== new Date().getFullYear()) && (
                    <Badge variant="secondary" className="ml-auto">
                      {yearBuiltRange[0]} - {yearBuiltRange[1]}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <Slider
                    value={yearBuiltRange}
                    min={1900}
                    max={new Date().getFullYear()}
                    step={1}
                    onValueChange={(value) => setYearBuiltRange([value[0], value[1]])}
                    className="py-4"
                  />
                  <div className="flex items-center justify-between gap-4">
                    <div className="w-full">
                      <Label htmlFor="year-min" className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold">
                        From Year
                      </Label>
                      <Input
                        id="year-min"
                        type="number"
                        value={yearBuiltRange[0]}
                        onChange={(e) => setYearBuiltRange([Number.parseInt(e.target.value) || 1900, yearBuiltRange[1]])}
                      />
                    </div>
                    <div className="w-full">
                      <Label htmlFor="year-max" className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold">
                        To Year
                      </Label>
                      <Input
                        id="year-max"
                        type="number"
                        value={yearBuiltRange[1]}
                        onChange={(e) => setYearBuiltRange([yearBuiltRange[0], Number.parseInt(e.target.value) || new Date().getFullYear()])}
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Features & Amenities */}
          <AccordionItem value="features">
            <AccordionTrigger className="text-base font-medium">
              <div className="flex items-center gap-2">
                <Waves className="h-4 w-4" />
                Features & Amenities
                {activeFeatures.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {activeFeatures.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                
                {/* Essential Features */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Essential Features</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {PROPERTY_FEATURES.ESSENTIAL.slice(0, showMoreFeatures ? undefined : 4).map((feature) => {
                      const Icon = ICONS[feature.icon as keyof typeof ICONS] || Home;
                      return (
                        <div key={feature.value} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`feature-${feature.value}`}
                            checked={activeFeatures.includes(feature.value)}
                            onCheckedChange={() => handleFeatureToggle(feature.value)}
                          />
                          <Label htmlFor={`feature-${feature.value}`} className="text-sm flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
                            {feature.label}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Amenities */}
                {showMoreFeatures && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Amenities</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {PROPERTY_FEATURES.AMENITIES.map((feature) => {
                          const Icon = ICONS[feature.icon as keyof typeof ICONS] || Home;
                          return (
                            <div key={feature.value} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`feature-${feature.value}`}
                                checked={activeFeatures.includes(feature.value)}
                                onCheckedChange={() => handleFeatureToggle(feature.value)}
                              />
                              <Label htmlFor={`feature-${feature.value}`} className="text-sm flex items-center gap-2">
                                <Icon className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
                                {feature.label}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <Separator />
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Building Features</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {PROPERTY_FEATURES.BUILDING.map((feature) => {
                          const Icon = ICONS[feature.icon as keyof typeof ICONS] || Home;
                          return (
                            <div key={feature.value} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`feature-${feature.value}`}
                                checked={activeFeatures.includes(feature.value)}
                                onCheckedChange={() => handleFeatureToggle(feature.value)}
                              />
                              <Label htmlFor={`feature-${feature.value}`} className="text-sm flex items-center gap-2">
                                <Icon className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
                                {feature.label}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowMoreFeatures(!showMoreFeatures)}
                  className="w-full"
                >
                  {showMoreFeatures ? 'Show Less' : 'Show More Features'}
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Location - Advanced Filter */}
          {showAdvanced && (
            <AccordionItem value="location">
              <AccordionTrigger className="text-base font-medium">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                  {(filters.city || filters.county || filters.zipCode) && (
                    <Badge variant="secondary" className="ml-auto">
                      ✓
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <div>
                    <Label htmlFor="city" className="text-sm mb-1 block">City</Label>
                    <Input
                      id="city"
                      value={filters.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Enter city name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="county" className="text-sm mb-1 block">County</Label>
                    <Input
                      id="county"
                      value={filters.county || ''}
                      onChange={(e) => handleInputChange('county', e.target.value)}
                      placeholder="Enter county name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="zip-code" className="text-sm mb-1 block">Zip Code</Label>
                    <Input
                      id="zip-code"
                      value={filters.zipCode || ''}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      placeholder="Enter zip code"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Sort */}
          <AccordionItem value="sort">
            <AccordionTrigger className="text-base font-medium">
              <div className="flex items-center gap-2">
                <ArrowUp className="h-4 w-4" />
                Sort By
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-2">
                <Select value={filters.sortBy || "recommended"} onValueChange={(value) => handleInputChange('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sorting option" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800/50 theme-transition">
        <div className="flex gap-3">
          <Button 
            className="flex-1 bg-gradient-primary hover:shadow-strong font-semibold rounded-2xl" 
            onClick={() => {
              // Apply the current filters before closing
              const newFilters = {
                ...filters,
                priceRange: priceRange[0] !== 0 || priceRange[1] !== 5000000 ? priceRange : undefined,
                areaRange: areaRange[0] !== 0 || areaRange[1] !== 10000 ? areaRange : undefined,
                lotSizeRange: lotSizeRange[0] !== 0 || lotSizeRange[1] !== 50000 ? lotSizeRange : undefined,
                yearBuiltRange: yearBuiltRange[0] !== 1900 || yearBuiltRange[1] !== new Date().getFullYear() ? yearBuiltRange : undefined,
                features: activeFeatures.length > 0 ? activeFeatures : [],
                propertyType: selectedPropertyTypes.length > 0 ? selectedPropertyTypes : [],
                status: selectedStatus.length > 0 ? selectedStatus : [],
              };
              console.log('Apply Filters clicked - sending filters:', newFilters);
              onFilterChange(newFilters);
              closeDrawer?.();
            }}
          >
            Apply Filters
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2 bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
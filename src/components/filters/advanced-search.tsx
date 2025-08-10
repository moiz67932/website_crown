"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { 
  Search, SlidersHorizontal, MapPin, DollarSign, Bed, Bath, Calendar, 
  Maximize, Building, Zap, Save, History, X, Plus
} from "lucide-react"
import { PropertyFilters, PROPERTY_TYPES, PROPERTY_STATUS, SORT_OPTIONS } from "@/types/filters"
import EnhancedFilterSidebar from "./enhanced-filter-sidebar"

interface AdvancedSearchProps {
  onSearch: (filters: PropertyFilters) => void;
  initialFilters?: PropertyFilters;
  searchHistory?: PropertyFilters[];
  savedSearches?: Array<{ id: string; name: string; filters: PropertyFilters }>;
  onSaveSearch?: (search: { name: string; filters: PropertyFilters; userId: string; alertsEnabled: boolean }) => void;
  showMap?: boolean;
  onToggleMap?: () => void;
}

export default function AdvancedSearch({
  onSearch,
  initialFilters = {},
  searchHistory = [],
  savedSearches = [],
  onSaveSearch,
  showMap = false,
  onToggleMap
}: AdvancedSearchProps) {
  
  const [filters, setFilters] = useState<PropertyFilters>(initialFilters);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState("");

  // Quick filter presets
  const quickFilters = [
    {
      name: "Under $500K",
      filters: { priceRange: [0, 500000] as [number, number] }
    },
    {
      name: "3+ Bedrooms",
      filters: { beds: "3+" }
    },
    {
      name: "New Construction",
      filters: { yearBuiltRange: [new Date().getFullYear() - 2, new Date().getFullYear()] as [number, number] }
    },
    {
      name: "With Pool",
      filters: { features: ["pool"] }
    },
    {
      name: "Large Lot",
      filters: { lotSizeRange: [10000, 50000] as [number, number] }
    }
  ];

  const handleQuickFilter = useCallback((quickFilter: typeof quickFilters[0]) => {
    const newFilters = { ...filters, ...quickFilter.filters };
    setFilters(newFilters);
    onSearch(newFilters);
  }, [filters, onSearch]);

  const handleFilterChange = useCallback((newFilters: PropertyFilters) => {
    setFilters(newFilters);
  }, []);

  const handleSearch = useCallback(() => {
    const searchFilters = {
      ...filters,
      ...(searchQuery && { searchQuery })
    };
    onSearch(searchFilters);
  }, [filters, searchQuery, onSearch]);

  const handleSaveSearch = useCallback(() => {
    if (searchName.trim() && onSaveSearch) {
      onSaveSearch({
        name: searchName.trim(),
        filters,
        userId: "current-user",
        alertsEnabled: false
      });
      setSearchName("");
      setSaveDialogOpen(false);
    }
  }, [searchName, filters, onSaveSearch]);

  const handleLoadSavedSearch = useCallback((savedSearch: typeof savedSearches[0]) => {
    setFilters(savedSearch.filters);
    onSearch(savedSearch.filters);
  }, [onSearch]);

  const clearFilters = useCallback(() => {
    const clearedFilters: PropertyFilters = { sortBy: "recommended" };
    setFilters(clearedFilters);
    setSearchQuery("");
  }, []);

  const getActiveFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.propertyType?.length) count++;
    if (filters.status?.length) count++;
    if (filters.priceRange) count++;
    if (filters.beds && filters.beds !== "Any") count++;
    if (filters.baths && filters.baths !== "Any") count++;
    if (filters.areaRange) count++;
    if (filters.lotSizeRange) count++;
    if (filters.yearBuiltRange) count++;
    if (filters.features?.length) count++;
    if (filters.city || filters.county || filters.zipCode) count++;
    return count;
  }, [filters]);

  const activeFiltersCount = getActiveFiltersCount;

  const filterSummary = useMemo(() => {
    const summary: string[] = [];
    
    if (filters.propertyType?.length) {
      summary.push(`${filters.propertyType.length} property type${filters.propertyType.length > 1 ? 's' : ''}`);
    }
    
    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      const formatPrice = (price: number) => {
        if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
        if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
        return `$${price}`;
      };
      summary.push(`${formatPrice(min)} - ${formatPrice(max)}`);
    }
    
    if (filters.beds && filters.beds !== "Any") {
      summary.push(`${filters.beds} beds`);
    }
    
    if (filters.features?.length) {
      summary.push(`${filters.features.length} feature${filters.features.length > 1 ? 's' : ''}`);
    }
    
    return summary.join(" • ");
  }, [filters]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      
      {/* Main Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search by address, city, zip code, or MLS number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={handleSearch}
                className="h-12 px-6 bg-blue-600 hover:bg-blue-700"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              
              <Sheet open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="h-12 px-4">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle>Advanced Filters</SheetTitle>
                  </SheetHeader>
                  <div className="h-full overflow-y-auto">
                    <EnhancedFilterSidebar
                      filters={filters}
                      onFilterChange={handleFilterChange}
                      closeDrawer={() => setShowAdvancedFilters(false)}
                      showAdvanced={true}
                      compact={true}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              {onToggleMap && (
                <Button 
                  variant="outline" 
                  onClick={onToggleMap}
                  className={`h-12 px-4 ${showMap ? 'bg-blue-50 border-blue-200' : ''}`}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {showMap ? 'List' : 'Map'}
                </Button>
              )}
            </div>
          </div>

          {/* Quick Filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-slate-600 mr-2 flex items-center">
              <Zap className="h-3 w-3 mr-1" />
              Quick filters:
            </span>
            {quickFilters.map((quickFilter) => (
              <Button
                key={quickFilter.name}
                variant="outline"
                size="sm"
                onClick={() => handleQuickFilter(quickFilter)}
                className="h-7 text-xs"
              >
                {quickFilter.name}
              </Button>
            ))}
          </div>

          {/* Active Filters Summary */}
          {(activeFiltersCount > 0 || filterSummary) && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    Active filters ({activeFiltersCount}):
                  </span>
                  <span className="text-sm text-slate-600">{filterSummary}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear all
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Saved Searches & History */}
      {(savedSearches.length > 0 || searchHistory.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Saved Searches */}
          {savedSearches.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Saved Searches
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {savedSearches.slice(0, 3).map((savedSearch) => (
                  <div
                    key={savedSearch.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-slate-50 cursor-pointer"
                    onClick={() => handleLoadSavedSearch(savedSearch)}
                  >
                    <span className="text-sm font-medium">{savedSearch.name}</span>
                    <Button variant="ghost" size="sm">
                      Load
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recent Searches */}
          {searchHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Recent Searches
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {searchHistory.slice(0, 3).map((historyItem, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded hover:bg-slate-50 cursor-pointer"
                    onClick={() => {
                      setFilters(historyItem);
                      onSearch(historyItem);
                    }}
                  >
                    <span className="text-sm text-slate-600">
                      Search #{index + 1}
                    </span>
                    <Button variant="ghost" size="sm">
                      Load
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Save Search Dialog */}
      {onSaveSearch && (
        <Sheet open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="fixed bottom-4 right-4 shadow-lg"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Search
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto">
            <SheetHeader>
              <SheetTitle>Save This Search</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="search-name">Search Name</Label>
                <Input
                  id="search-name"
                  placeholder="e.g., 3BR Houses Under $500K"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveSearch} disabled={!searchName.trim()}>
                  Save Search
                </Button>
                <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
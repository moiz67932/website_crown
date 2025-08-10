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
    <div className="w-full max-w-6xl mx-auto space-y-6">
      
      {/* Main Search Bar */}
      <Card className="glass-card border-neutral-200/50 dark:border-slate-700/50 theme-transition">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 dark:text-neutral-500 h-5 w-5" />
                <Input
                  placeholder="Search by address, city, zip code, or MLS number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-base bg-white dark:bg-slate-800 border-neutral-200 dark:border-slate-600 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 theme-transition"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={handleSearch}
                className="h-14 px-8 bg-gradient-primary hover:shadow-strong font-semibold rounded-2xl"
              >
                <Search className="h-5 w-5 mr-2" />
                Search
              </Button>
              
              <Sheet open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="h-14 px-6 border-neutral-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-slate-700 rounded-2xl font-semibold shadow-soft hover:shadow-medium transition-all duration-300 theme-transition">
                    <SlidersHorizontal className="h-5 w-5 mr-2" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md p-0 bg-white dark:bg-slate-900 theme-transition">
                  <SheetHeader className="p-6 border-b border-neutral-200 dark:border-slate-700">
                    <SheetTitle className="text-neutral-900 dark:text-neutral-100 font-display text-xl">Advanced Filters</SheetTitle>
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
                  className={`h-14 px-6 border-neutral-200 dark:border-slate-600 rounded-2xl font-semibold shadow-soft hover:shadow-medium transition-all duration-300 theme-transition ${
                    showMap 
                      ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-700 text-primary-700 dark:text-primary-300' 
                      : 'bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <MapPin className="h-5 w-5 mr-2" />
                  {showMap ? 'List' : 'Map'}
                </Button>
              )}
            </div>
          </div>

          {/* Quick Filters */}
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="text-sm text-neutral-600 dark:text-neutral-400 mr-2 flex items-center font-semibold theme-transition">
              <Zap className="h-4 w-4 mr-2 text-primary-500" />
              Quick filters:
            </span>
            {quickFilters.map((quickFilter) => (
              <Button
                key={quickFilter.name}
                variant="outline"
                size="sm"
                onClick={() => handleQuickFilter(quickFilter)}
                className="h-9 px-4 text-sm border-neutral-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-300 dark:hover:border-primary-600 hover:text-primary-700 dark:hover:text-primary-300 rounded-xl font-medium transition-all duration-300 theme-transition"
              >
                {quickFilter.name}
              </Button>
            ))}
          </div>

          {/* Active Filters Summary */}
          {(activeFiltersCount > 0 || filterSummary) && (
            <div className="mt-6 p-4 bg-neutral-50 dark:bg-slate-800/50 rounded-2xl border border-neutral-200/50 dark:border-slate-700/50 theme-transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 theme-transition">
                    Active filters ({activeFiltersCount}):
                  </span>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400 theme-transition">{filterSummary}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-xl theme-transition"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear all
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Saved Searches & History */}
      {(savedSearches.length > 0 || searchHistory.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Saved Searches */}
          {savedSearches.length > 0 && (
            <Card className="glass-card border-neutral-200/50 dark:border-slate-700/50 theme-transition">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-display flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                  <Save className="h-5 w-5 text-primary-500" />
                  Saved Searches
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {savedSearches.slice(0, 3).map((savedSearch) => (
                  <div
                    key={savedSearch.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all duration-300 theme-transition"
                    onClick={() => handleLoadSavedSearch(savedSearch)}
                  >
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{savedSearch.name}</span>
                    <Button variant="ghost" size="sm" className="text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30">
                      Load
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recent Searches */}
          {searchHistory.length > 0 && (
            <Card className="glass-card border-neutral-200/50 dark:border-slate-700/50 theme-transition">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-display flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                  <History className="h-5 w-5 text-accent-500" />
                  Recent Searches
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {searchHistory.slice(0, 3).map((historyItem, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all duration-300 theme-transition"
                    onClick={() => {
                      setFilters(historyItem);
                      onSearch(historyItem);
                    }}
                  >
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      Search #{index + 1}
                    </span>
                    <Button variant="ghost" size="sm" className="text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/30">
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
              className="fixed bottom-6 right-6 shadow-strong hover:shadow-xl bg-white dark:bg-slate-800 border-neutral-200 dark:border-slate-600 text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-300 dark:hover:border-primary-600 backdrop-blur-sm rounded-2xl transition-all duration-300 theme-transition"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Search
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto bg-white dark:bg-slate-900 theme-transition">
            <SheetHeader className="border-b border-neutral-200 dark:border-slate-700 pb-4">
              <SheetTitle className="text-neutral-900 dark:text-neutral-100 font-display text-xl">Save This Search</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 py-6">
              <div>
                <Label htmlFor="search-name" className="text-neutral-700 dark:text-neutral-300 font-semibold">Search Name</Label>
                <Input
                  id="search-name"
                  placeholder="e.g., 3BR Houses Under $500K"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="mt-2 h-12 bg-white dark:bg-slate-800 border-neutral-200 dark:border-slate-600 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 rounded-xl theme-transition"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleSaveSearch} disabled={!searchName.trim()} className="bg-gradient-primary rounded-xl font-semibold">
                  Save Search
                </Button>
                <Button variant="outline" onClick={() => setSaveDialogOpen(false)} className="border-neutral-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-slate-700 rounded-xl theme-transition">
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
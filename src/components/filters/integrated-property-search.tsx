"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, Map, List, Filter, Save, History, 
  TrendingUp, MapPin, Settings, BarChart3
} from "lucide-react"

// Import our new components
import AdvancedSearch from "./advanced-search"
import EnhancedFilterSidebar from "./enhanced-filter-sidebar"
import LocationAutocomplete, { LocationSuggestion } from "./location-autocomplete"
import SavedSearches from "./saved-searches"
import MapPolygonSearch, { MapPolygon } from "./map-polygon-search"

// Import utilities
import { PropertyFilters, SavedSearch } from "@/types/filters"
import { generateSEOURL, parseURLToFilters, generatePageTitle, generateMetaDescription } from "@/utils/url-filters"
import { searchOptimizer, performanceMonitor, processFacetResponse, Facet } from "@/utils/search-optimization"

interface PropertySearchResult {
  properties: any[];
  totalCount: number;
  facets: Facet[];
  searchTime: number;
  fromCache: boolean;
}

interface IntegratedPropertySearchProps {
  initialView?: 'list' | 'map';
  showSavedSearches?: boolean;
  enableMapDrawing?: boolean;
  userId?: string;
}

export default function IntegratedPropertySearch({
  initialView = 'list',
  showSavedSearches = true,
  enableMapDrawing = true,
  userId
}: IntegratedPropertySearchProps) {
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State management
  const [currentView, setCurrentView] = useState<'list' | 'map'>(initialView);
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [searchResults, setSearchResults] = useState<PropertySearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchHistory, setSearchHistory] = useState<PropertyFilters[]>([]);
  const [activePolygons, setActivePolygons] = useState<MapPolygon[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Performance state
  const [performanceMetrics, setPerformanceMetrics] = useState({
    searchTime: 0,
    cacheHitRate: 0,
    totalSearches: 0
  });

  // Initialize filters from URL on mount
  useEffect(() => {
    const spForParse: URLSearchParams = searchParams ? new URLSearchParams(searchParams.toString()) : new URLSearchParams();
    const urlFilters = parseURLToFilters(window.location.pathname, spForParse);
    if (Object.keys(urlFilters).length > 0) {
      setFilters(urlFilters);
      performSearch(urlFilters);
    }
  }, []);

  // Mock search function - replace with actual API call
  const performSearch = useCallback(async (searchFilters: PropertyFilters, page: number = 1) => {
    setIsLoading(true);
    
    try {
      // Use our optimized search
      const result = await searchOptimizer.optimizedSearch(
        {
          filters: searchFilters,
          page,
          limit: 24,
          facetFields: ['propertyType', 'status', 'city', 'features'],
          useCache: true,
          debounceMs: 300
        },
        async (params) => {
          // Mock API call - replace with actual implementation
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const mockResult: PropertySearchResult = {
            properties: Array.from({ length: params.limit }, (_, i) => ({
              id: `prop-${page}-${i}`,
              title: `Property ${page * params.limit + i + 1}`,
              price: Math.floor(Math.random() * 1000000) + 200000,
              bedrooms: Math.floor(Math.random() * 5) + 1,
              bathrooms: Math.floor(Math.random() * 3) + 1,
              sqft: Math.floor(Math.random() * 2000) + 1000,
              city: 'Los Angeles',
              status: 'for_sale'
            })),
            totalCount: 1247,
            facets: [
              {
                field: 'propertyType',
                label: 'Property Type',
                type: 'checkbox',
                values: [
                  { value: 'house', count: 450 },
                  { value: 'condo', count: 320 },
                  { value: 'townhouse', count: 180 }
                ]
              },
              {
                field: 'city',
                label: 'City',
                type: 'checkbox',
                values: [
                  { value: 'Los Angeles', count: 520 },
                  { value: 'San Diego', count: 340 },
                  { value: 'San Francisco', count: 280 }
                ]
              }
            ],
            searchTime: Math.floor(Math.random() * 500) + 100,
            fromCache: Math.random() > 0.7
          };

          // Record performance metrics
          performanceMonitor.recordSearchLatency(mockResult.searchTime);
          
          return mockResult;
        }
      );

      setSearchResults(result);
      setCurrentPage(page);
      
      // Update performance metrics
      const cacheStats = searchOptimizer.getCacheStats();
      setPerformanceMetrics({
        searchTime: result.searchTime,
        cacheHitRate: cacheStats.hitRatio,
        totalSearches: cacheStats.totalHits
      });

      // Add to search history
      if (!result.fromCache) {
        setSearchHistory(prev => [searchFilters, ...prev.slice(0, 9)]);
      }

    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: PropertyFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    
    // Update URL
    const newUrl = generateSEOURL(newFilters);
    router.push(newUrl, { scroll: false });
    
    // Update page title and meta
    const pageTitle = generatePageTitle(newFilters);
    document.title = pageTitle;
    
    const metaDescription = generateMetaDescription(newFilters, searchResults?.totalCount);
    const metaDescElement = document.querySelector('meta[name="description"]');
    if (metaDescElement) {
      metaDescElement.setAttribute('content', metaDescription);
    }
    
    // Perform search
    performSearch(newFilters);
  }, [router, searchResults?.totalCount, performSearch]);

  // Handle location selection
  const handleLocationSelect = useCallback((location: LocationSuggestion | null) => {
    setSelectedLocation(location);
    if (location) {
      const newFilters = { 
        ...filters, 
        city: location.city,
        county: location.county,
        zipCode: location.zipCode 
      };
      handleFilterChange(newFilters);
    }
  }, [filters, handleFilterChange]);

  // Handle polygon changes
  const handlePolygonChange = useCallback((polygons: MapPolygon[]) => {
    setActivePolygons(polygons);
    // Convert polygons to geographic filters
    if (polygons.length > 0) {
      // In a real implementation, you'd convert polygon coordinates to a geo query
      console.log('Searching within polygons:', polygons);
    }
  }, []);

  // Saved search management
  const handleSaveSearch = useCallback(async (search: Omit<SavedSearch, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSearch: SavedSearch = {
      ...search,
      id: `search-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setSavedSearches(prev => [newSearch, ...prev]);
    
    // In a real app, save to backend
    console.log('Saving search:', newSearch);
  }, []);

  const handleUpdateSearch = useCallback(async (id: string, updates: Partial<SavedSearch>) => {
    setSavedSearches(prev => 
      prev.map(search => 
        search.id === id 
          ? { ...search, ...updates, updatedAt: new Date().toISOString() }
          : search
      )
    );
  }, []);

  const handleDeleteSearch = useCallback(async (id: string) => {
    setSavedSearches(prev => prev.filter(search => search.id !== id));
  }, []);

  const handleLoadSearch = useCallback((search: SavedSearch) => {
    handleFilterChange(search.filters);
  }, [handleFilterChange]);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.propertyType?.length) count++;
    if (filters.status?.length) count++;
    if (filters.priceRange) count++;
    if (filters.beds && filters.beds !== "Any") count++;
    if (filters.baths && filters.baths !== "Any") count++;
    if (filters.areaRange) count++;
    if (filters.features?.length) count++;
    if (filters.city || filters.county) count++;
    return count;
  }, [filters]);

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Property Search</h1>
              <p className="text-slate-600">
                {searchResults ? `${searchResults.totalCount.toLocaleString()} properties found` : 'Find your perfect property'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Performance indicator */}
              <Badge variant="outline" className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                {performanceMetrics.searchTime}ms
                {searchResults?.fromCache && ' (cached)'}
              </Badge>
              
              {/* View toggle */}
              <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as 'list' | 'map')}>
                <TabsList>
                  <TabsTrigger value="list" className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    List
                  </TabsTrigger>
                  <TabsTrigger value="map" className="flex items-center gap-2">
                    <Map className="h-4 w-4" />
                    Map
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Advanced Search Bar */}
          <AdvancedSearch
            onSearch={handleFilterChange}
            initialFilters={filters}
            searchHistory={searchHistory}
            savedSearches={savedSearches}
            onSaveSearch={handleSaveSearch}
            showMap={currentView === 'map'}
            onToggleMap={() => setCurrentView(currentView === 'map' ? 'list' : 'map')}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Location Search */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LocationAutocomplete
                  value={selectedLocation?.display || ""}
                  onSelect={handleLocationSelect}
                  showRecentSearches={true}
                  showPopularLocations={true}
                />
              </CardContent>
            </Card>

            {/* Enhanced Filters */}
            <EnhancedFilterSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              showAdvanced={true}
            />

            {/* Map Drawing Tools (when in map view) */}
            {currentView === 'map' && enableMapDrawing && (
              <MapPolygonSearch
                map={null} // Pass actual map instance
                onPolygonChange={handlePolygonChange}
                savedPolygons={[]}
                maxPolygons={3}
                enableDrawing={true}
                showPropertyCounts={true}
              />
            )}

            {/* Performance Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-3 w-3" />
                  Search Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Search Time:</span>
                  <span>{performanceMetrics.searchTime}ms</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Cache Hit Rate:</span>
                  <span>{(performanceMetrics.cacheHitRate * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Total Searches:</span>
                  <span>{performanceMetrics.totalSearches}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold">
                  {searchResults ? `${searchResults.totalCount.toLocaleString()} Properties` : 'Search Results'}
                </h2>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary">
                    <Filter className="h-3 w-3 mr-1" />
                    {activeFilterCount} filters active
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Facets
                </Button>
              </div>
            </div>

            {/* Faceted Search Results */}
            {showFilters && searchResults?.facets && (
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Refine Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {searchResults.facets.map((facet) => (
                      <div key={facet.field}>
                        <h4 className="font-medium text-sm mb-2">{facet.label}</h4>
                        <div className="space-y-1">
                          {facet.values.slice(0, 5).map((value) => (
                            <div key={value.value} className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">{value.value}</span>
                              <Badge variant="outline" className="text-xs">
                                {value.count}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search Results */}
            <div className="min-h-[600px]">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-600">Searching properties...</p>
                </div>
              ) : currentView === 'list' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {searchResults?.properties.map((property) => (
                    <Card key={property.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="aspect-video bg-slate-200 rounded mb-3"></div>
                        <h3 className="font-semibold mb-2">{property.title}</h3>
                        <p className="text-lg font-bold text-blue-600 mb-2">
                          ${property.price.toLocaleString()}
                        </p>
                        <div className="flex gap-4 text-sm text-slate-600">
                          <span>{property.bedrooms} bed</span>
                          <span>{property.bathrooms} bath</span>
                          <span>{property.sqft} sqft</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-200 rounded-lg h-[600px] flex items-center justify-center">
                  <div className="text-center">
                    <Map className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">Map view with {searchResults?.totalCount || 0} properties</p>
                    <p className="text-sm text-slate-500 mt-2">
                      Map integration would be implemented here
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Pagination */}
            {searchResults && searchResults.totalCount > 24 && (
              <div className="flex justify-center mt-8">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    disabled={currentPage === 1}
                    onClick={() => performSearch(filters, currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => performSearch(filters, currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved Searches Modal/Section */}
      {showSavedSearches && userId && (
        <div className="container mx-auto px-4 py-8">
          <SavedSearches
            savedSearches={savedSearches}
            onSaveSearch={handleSaveSearch}
            onUpdateSearch={handleUpdateSearch}
            onDeleteSearch={handleDeleteSearch}
            onLoadSearch={handleLoadSearch}
            currentFilters={filters}
            userId={userId}
          />
        </div>
      )}
    </div>
  );
}
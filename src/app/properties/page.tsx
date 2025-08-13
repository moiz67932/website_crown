"use client"
import { useState, useEffect, Suspense } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import PropertiesGrid from "./properties-grid"
import PropertyListingHeader from "./property-header"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useTrestlePropertiesIntegrated } from "@/hooks/useTrestlePropertiesIntegrated"
import { useSearchParams } from "next/navigation"
import { PropertyCard } from "@/components/property-card"
import { Property } from "@/interfaces"
import { PropertyFilters } from "@/types/filters"
import { generateSEOURL, parseURLToFilters } from "@/utils/url-filters"

// Import the new enhanced components
import AdvancedSearch from "@/components/filters/advanced-search"

// Property Grid Skeleton
const PropertyGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
    {[...Array(18)].map((_, index) => (
      <div key={`skeleton-${index}`} className="space-y-4">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="space-y-3 px-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-1/3" />
          <div className="flex gap-4 pt-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    ))}
  </div>
)

// Client-side component that uses useSearchParams
function PropertiesPageContent() {
  const [currentPage, setCurrentPage] = useState(1)
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [semanticQuery, setSemanticQuery] = useState('')
  const [semanticResults, setSemanticResults] = useState<Property[]>([])
  const [semanticLoading, setSemanticLoading] = useState(false)
  const [showSemanticResults, setShowSemanticResults] = useState(false)

  // Updated to use the new PropertyFilters interface
  const [filters, setFilters] = useState<PropertyFilters>({
    propertyType: [],
    status: [],
    priceRange: undefined,
    beds: undefined,
    baths: undefined,
    areaRange: undefined,
    lotSizeRange: undefined,
    yearBuiltRange: undefined,
    city: "",
    county: "",
    zipCode: "",
    features: [],
    sortBy: "recommended"
  })

  // Legacy filter state for backward compatibility with existing API
  const [legacyFilters, setLegacyFilters] = useState<{
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
    sortBy: "recommended" | "price-asc" | "price-desc" | "date-desc" | "area-desc";
  }>({
    propertyType: "",
    minPrice: undefined,
    maxPrice: undefined,
    city: "",
    county: "",
    minBathroom: undefined,
    minBedroom: undefined,
    yearBuilt: undefined,
    max_sqft: undefined,
    min_sqft: undefined,
    sortBy: "recommended"
  })

  // Convert new filters to legacy format for API compatibility
  const convertToLegacyFilters = (newFilters: PropertyFilters) => {
    // Map new sortBy values to legacy ones
    const mapSortBy = (sortBy: string | undefined): "recommended" | "price-asc" | "price-desc" | "date-desc" | "area-desc" => {
      if (!sortBy) return "recommended"
      
      switch (sortBy) {
        case "newest":
          return "date-desc"
        case "popular":
          return "recommended"
        case "price-asc":
        case "price-desc":
        case "date-desc":
        case "area-desc":
          return sortBy
        default:
          return "recommended"
      }
    }
    
    // Map new property types to legacy API values
    const mapPropertyType = (types: string[] | undefined): string => {
      if (!types || types.length === 0) return "";
      
      const type = types[0];
      switch (type) {
        case "house":
        case "single_family":
          return "Residential";
        case "condo":
        case "condominium":
          return "Condominium";
        case "townhouse":
        case "townhome":
          return "Residential";
        case "apartment":
          return "ResidentialLease";
        case "manufactured":
          return "ManufacturedInPark";
        case "land":
          return "Land";
        case "commercial":
          return "Commercial";
        default:
          return type;
      }
    };

    // Map status to legacy property type if needed
    let finalPropertyType = mapPropertyType(newFilters.propertyType);
    if (!finalPropertyType && newFilters.status?.length) {
      const status = newFilters.status[0];
      if (status === "for_rent") {
        finalPropertyType = "ResidentialLease";
      } else if (status === "for_sale") {
        finalPropertyType = "Residential";
      }
    }

    return {
      propertyType: finalPropertyType,
      minPrice: newFilters.priceRange?.[0],
      maxPrice: newFilters.priceRange?.[1],
      city: newFilters.searchQuery || newFilters.city || "",
      county: newFilters.county || "",
      minBathroom: newFilters.baths && newFilters.baths !== "Any" ? parseInt(newFilters.baths.replace('+', '')) : undefined,
      minBedroom: newFilters.beds && newFilters.beds !== "Any" ? parseInt(newFilters.beds.replace('+', '')) : undefined,
      yearBuilt: newFilters.yearBuiltRange?.[0],
      max_sqft: newFilters.areaRange?.[1],
      min_sqft: newFilters.areaRange?.[0],
      sortBy: mapSortBy(newFilters.sortBy)
    }
  }

  // Monitor legacyFilters.sortBy changes
  useEffect(() => {
    console.log('🔥 legacyFilters.sortBy changed to:', legacyFilters.sortBy);
  }, [legacyFilters.sortBy]);

  useEffect(() => {
    // Parse URL parameters into new filter format
    try {
      const urlFilters = parseURLToFilters(window.location.pathname, searchParams)
      
      // If URL has filters, use them, otherwise use legacy URL parsing
      if (Object.keys(urlFilters).length > 0) {
        setFilters(urlFilters)
        setLegacyFilters(convertToLegacyFilters(urlFilters))
      } else {
        // Legacy URL parsing for backward compatibility
        const sortByParam = searchParams.get("sortBy")
        const validSortBy = ["recommended", "price-asc", "price-desc", "date-desc", "area-desc"].includes(sortByParam || "")
          ? sortByParam as "recommended" | "price-asc" | "price-desc" | "date-desc" | "area-desc"
          : "recommended"

        // Map status to propertyType for legacy API compatibility
        let propertyTypeFromStatus = searchParams.get("propertyType") || "";
        const status = searchParams.get("status");
        
        // If no propertyType but has status, determine propertyType from status
        if (!propertyTypeFromStatus && status) {
          if (status === "for_rent") {
            propertyTypeFromStatus = "ResidentialLease";
          } else if (status === "for_sale") {
            propertyTypeFromStatus = "Residential";
          }
        }

        const legacyFiltersFromUrl = {
          propertyType: propertyTypeFromStatus,
          minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
          maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
          city: searchParams.get("search") || searchParams.get("city") || (searchParams.get("searchLocationType") === "city" ? searchParams.get("location") || "" : ""),
          county: searchParams.get("county") || (searchParams.get("searchLocationType") === "county" ? searchParams.get("location") || "" : ""),
          minBathroom: searchParams.get("minBathroom") ? Number(searchParams.get("minBathroom")) : undefined,
          minBedroom: searchParams.get("minBedroom") ? Number(searchParams.get("minBedroom")) : undefined,
          yearBuilt: searchParams.get("yearBuilt") ? Number(searchParams.get("yearBuilt")) : undefined,
          max_sqft: searchParams.get("max_sqft") ? Number(searchParams.get("max_sqft")) : undefined,
          min_sqft: searchParams.get("min_sqft") ? Number(searchParams.get("min_sqft")) : undefined,
          sortBy: validSortBy
        }
        
        setLegacyFilters(legacyFiltersFromUrl)
        
        // Convert to new format
        const newFilters: PropertyFilters = {
          searchQuery: searchParams.get("search") || "",
          propertyType: legacyFiltersFromUrl.propertyType ? [legacyFiltersFromUrl.propertyType] : [],
          status: searchParams.get("status") ? [searchParams.get("status")!] : [],
          priceRange: legacyFiltersFromUrl.minPrice || legacyFiltersFromUrl.maxPrice ? 
            [legacyFiltersFromUrl.minPrice || 0, legacyFiltersFromUrl.maxPrice || 5000000] : undefined,
          city: legacyFiltersFromUrl.city,
          county: legacyFiltersFromUrl.county,
          beds: legacyFiltersFromUrl.minBedroom ? `${legacyFiltersFromUrl.minBedroom}+` : undefined,
          baths: legacyFiltersFromUrl.minBathroom ? `${legacyFiltersFromUrl.minBathroom}+` : undefined,
          areaRange: legacyFiltersFromUrl.min_sqft || legacyFiltersFromUrl.max_sqft ?
            [legacyFiltersFromUrl.min_sqft || 0, legacyFiltersFromUrl.max_sqft || 10000] : undefined,
          yearBuiltRange: legacyFiltersFromUrl.yearBuilt ? 
            [legacyFiltersFromUrl.yearBuilt, new Date().getFullYear()] : undefined,
          sortBy: legacyFiltersFromUrl.sortBy,
          features: []
        }
        
        setFilters(newFilters)
      }
    } catch (error) {
      console.error('Error parsing URL filters:', error)
    }
  }, [searchParams])

  const limit = 18
  const skip = (currentPage - 1) * limit

  // Add debugging for API parameters
  console.log('API Parameters being sent:', {
    skip, 
    limit,
    propertyType: legacyFilters.propertyType,
    minPrice: legacyFilters.minPrice,
    maxPrice: legacyFilters.maxPrice,
    city: legacyFilters.city,
    county: legacyFilters.county,
    minBathroom: legacyFilters.minBathroom,
    minBedroom: legacyFilters.minBedroom,
    yearBuilt: legacyFilters.yearBuilt,
    max_sqft: legacyFilters.max_sqft,
    min_sqft: legacyFilters.min_sqft,
    sortBy: legacyFilters.sortBy
  });

  // Convert legacy filters to Trestle format
  const trestleFilters = {
    city: legacyFilters.city,
    state: legacyFilters.county, // Using county as state for now
    minPrice: legacyFilters.minPrice,
    maxPrice: legacyFilters.maxPrice,
    minBedrooms: legacyFilters.minBedroom,
    minBathrooms: legacyFilters.minBathroom,
    propertyType: legacyFilters.propertyType,
    keywords: [] // Can be extended with features
  };

  // Get data using Trestle API with vector database integration
  const { 
    properties, 
    loading: isLoading, 
    error: trestleError,
    total: totalItems,
    hasMore,
    loadMore,
    refresh,
    searchSemantic
  } = useTrestlePropertiesIntegrated(trestleFilters, limit, currentPage)

  const totalPages = Math.min(70, Math.ceil(totalItems / limit)) // Cap at 70 pages max

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Semantic search handler
  const handleSemanticSearch = async () => {
    if (!semanticQuery.trim()) return;
    
    try {
      setSemanticLoading(true);
      const results = await searchSemantic(semanticQuery);
      setSemanticResults(results);
      setShowSemanticResults(true);
      console.log(`🔍 Semantic search for "${semanticQuery}" returned ${results.length} results`);
    } catch (error) {
      console.error('❌ Semantic search error:', error);
    } finally {
      setSemanticLoading(false);
    }
  }

  // Clear semantic search
  const clearSemanticSearch = () => {
    setSemanticQuery('');
    setSemanticResults([]);
    setShowSemanticResults(false);
  }

  // Enhanced filter change handler with SEO URLs
  const handleFilterChange = (newFilters: PropertyFilters) => {
    console.log('Filter change received:', newFilters);
    console.log('Current sortBy:', newFilters.sortBy);
    setFilters(newFilters)
    setCurrentPage(1)
    
    // Convert to legacy format for API
    const legacy = convertToLegacyFilters(newFilters)
    console.log('Legacy filters converted:', legacy);
    console.log('Legacy sortBy:', legacy.sortBy);
    setLegacyFilters(legacy)
    
    // Always use query parameter approach to avoid routing issues
    const params = new URLSearchParams();
    
    if (newFilters.searchQuery) {
      params.set('search', newFilters.searchQuery);
    }
    if (newFilters.priceRange) {
      params.set('minPrice', newFilters.priceRange[0].toString());
      params.set('maxPrice', newFilters.priceRange[1].toString());
    }
    if (newFilters.propertyType?.length) {
      params.set('propertyType', newFilters.propertyType[0]);
    }
    if (newFilters.city) params.set('city', newFilters.city);
    if (newFilters.county) params.set('county', newFilters.county);
    if (newFilters.beds && newFilters.beds !== "Any") {
      const bedNumber = newFilters.beds.replace('+', '');
      params.set('minBedroom', bedNumber);
    }
    if (newFilters.baths && newFilters.baths !== "Any") {
      const bathNumber = newFilters.baths.replace('+', '');
      params.set('minBathroom', bathNumber);
    }
    if (newFilters.sortBy) params.set('sortBy', newFilters.sortBy);
    if (newFilters.status?.length) {
      params.set('status', newFilters.status[0]);
    }
    
    const newUrl = `/properties${params.toString() ? '?' + params.toString() : ''}`;
    console.log('Generated URL:', newUrl);
    router.replace(newUrl, { scroll: false });
  }
  
  // Legacy filter change handler for backward compatibility
  const handleLegacyFilterChange = (newLegacyFilters: any) => {
    setLegacyFilters(newLegacyFilters)
    setCurrentPage(1)
    
    // Convert to new format
    const newFilters: PropertyFilters = {
      propertyType: newLegacyFilters.propertyType ? [newLegacyFilters.propertyType] : [],
      priceRange: newLegacyFilters.minPrice || newLegacyFilters.maxPrice ? 
        [newLegacyFilters.minPrice || 0, newLegacyFilters.maxPrice || 5000000] : undefined,
      city: newLegacyFilters.city,
      county: newLegacyFilters.county,
      beds: newLegacyFilters.minBedroom ? `${newLegacyFilters.minBedroom}+` : undefined,
      baths: newLegacyFilters.minBathroom ? `${newLegacyFilters.minBathroom}+` : undefined,
      areaRange: newLegacyFilters.min_sqft || newLegacyFilters.max_sqft ?
        [newLegacyFilters.min_sqft || 0, newLegacyFilters.max_sqft || 10000] : undefined,
      yearBuiltRange: newLegacyFilters.yearBuilt ? 
        [newLegacyFilters.yearBuilt, new Date().getFullYear()] : undefined,
                sortBy: newLegacyFilters.sortBy as PropertyFilters['sortBy'],
          features: filters.features || []
    }
    
    setFilters(newFilters)
  }

  return (
    <main className="bg-slate-50 dark:bg-slate-900 min-h-screen pt-16 md:pt-20 theme-transition">
      <PropertyListingHeader 
        currentPage={currentPage} 
        totalProperties={totalItems}
        propertyType={legacyFilters.propertyType}
        sortBy={legacyFilters.sortBy}
        onSortChange={(newSort) => {
          console.log('🔥 onSortChange called with:', newSort);
          console.log('🔥 Current filters before update:', filters);
          const updatedFilters = { ...filters, sortBy: newSort };
          console.log('🔥 Updated filters:', updatedFilters);
          handleFilterChange(updatedFilters);
        }}
        onBuyClick={(type: string | undefined) => handleFilterChange({ ...filters, propertyType: type ? [type] : [] })}
      />
      
      {/* Advanced Search Component */}
      <div className="bg-white dark:bg-slate-900 border-b border-neutral-200/50 dark:border-slate-700/50 theme-transition">
        <div className="container mx-auto px-4 md:px-6 py-6">
          <AdvancedSearch
            onSearch={handleFilterChange}
            initialFilters={filters}
            showMap={false}
          />
        </div>
      </div>

      {/* Semantic Search Section - HIDDEN 
      <section className="container mx-auto px-4 md:px-6 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              🧠 AI-Powered Property Search
            </h3>
            <p className="text-gray-600 text-sm">
              Search using natural language: "luxury waterfront home with pool" or "affordable family home near schools"
            </p>
          </div>
          
          <div className="flex gap-3 max-w-2xl mx-auto">
            <div className="flex-1">
              <Input
                placeholder="luxury beachfront condo with pool and ocean view"
                value={semanticQuery}
                onChange={(e) => setSemanticQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSemanticSearch()}
                className="h-12 text-base"
              />
            </div>
            <Button 
              onClick={handleSemanticSearch}
              disabled={semanticLoading || !semanticQuery.trim()}
              className="h-12 px-6"
            >
              {semanticLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Search
            </Button>
            {showSemanticResults && (
              <Button 
                onClick={clearSemanticSearch}
                variant="outline"
                className="h-12 px-4"
              >
                Clear
              </Button>
            )}
          </div>

          {trestleError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              ⚠️ {trestleError}
            </div>
          )}

          {showSemanticResults && semanticResults.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">
                🎯 Found {semanticResults.length} AI-matched properties
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {semanticResults.slice(0, 6).map((property: Property, index: number) => (
                  <PropertyCard 
                    key={property.listing_key || property.id || `semantic-${index}`} 
                    property={property} 
                  />
                ))}
              </div>
            </div>
          )}

          {showSemanticResults && semanticResults.length === 0 && !semanticLoading && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-center">
              🔍 No properties found matching "{semanticQuery}". Try a different search term.
            </div>
          )}
        </div>
      </section>
      */}

      <section className="container mx-auto px-4 md:px-6 py-8">
        {/* Properties Grid Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Properties
            {totalItems > 0 && (
              <span className="ml-2 text-lg font-normal text-gray-600">
                ({totalItems.toLocaleString()} found)
              </span>
            )}
          </h2>
          <div className="flex gap-2">
            <Button onClick={refresh} variant="outline" size="sm" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              🔄 Refresh Data
            </Button>
          </div>
        </div>

        {/* Properties Grid - Full Width */}
        <div className="w-full">
          {isLoading ? <PropertyGridSkeleton /> : (
            <>
              {properties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-10">
                  {properties.map((property: Property, index: number) => (
                    <PropertyCard 
                      key={property.listing_key || property.id || `property-${index}`} 
                      property={property} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-500 text-lg mb-4">
                    🏠 No properties found with current filters
                  </div>
                  <Button onClick={refresh} variant="outline">
                    Try refreshing or adjust your filters
                  </Button>
                </div>
              )}
            </>
          )}
            
          
          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, index) => {
                    const page = index + 1
                    
                    if (
                      page === 1 || 
                      page === totalPages || 
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={`page-${page}`}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={page === currentPage}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <PaginationItem key={`ellipsis-${page}`}>
                          <span className="px-4">...</span>
                        </PaginationItem>
                      )
                    }
                    return null
                  }).filter(Boolean)}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

// Main component wrapper with Suspense
export default function PropertiesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PropertiesPageContent />
    </Suspense>
  )
}
import { PropertyFilters } from "../types/filters";

/**
 * Search Performance Optimization Utilities
 * 
 * Provides faceted search, caching, debouncing, and performance optimizations
 * for property filtering and search functionality.
 */

// Cache configuration
export interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  enabled: boolean;
}

export interface SearchCache {
  key: string;
  data: any;
  timestamp: number;
  hits: number;
}

export interface FacetCount {
  value: string;
  count: number;
  selected?: boolean;
}

export interface Facet {
  field: string;
  label: string;
  type: 'checkbox' | 'range' | 'select';
  values: FacetCount[];
  min?: number;
  max?: number;
}

export interface SearchResult {
  properties: any[];
  totalCount: number;
  facets: Facet[];
  searchTime: number;
  fromCache: boolean;
}

export interface OptimizedSearchParams {
  filters: PropertyFilters;
  page: number;
  limit: number;
  facetFields?: string[];
  useCache?: boolean;
  debounceMs?: number;
}

class SearchOptimizer {
  private cache: Map<string, SearchCache> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private config: CacheConfig;

  constructor(config: CacheConfig = { maxSize: 1000, ttl: 300000, enabled: true }) {
    this.config = config;
    this.setupCacheCleanup();
  }

  /**
   * Generate cache key from search parameters
   */
  private generateCacheKey(params: OptimizedSearchParams): string {
    const { filters, page, limit, facetFields } = params;
    
    // Create stable key from filters
    const filterKey = JSON.stringify(filters, Object.keys(filters).sort());
    const facetKey = facetFields ? facetFields.sort().join(',') : '';
    
    return `search:${btoa(filterKey)}:${page}:${limit}:${facetKey}`;
  }

  /**
   * Check if cache entry is valid
   */
  private isCacheValid(entry: SearchCache): boolean {
    return Date.now() - entry.timestamp < this.config.ttl;
  }

  /**
   * Clean up expired cache entries
   */
  private setupCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > this.config.ttl) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Clean every minute
  }

  /**
   * Store result in cache
   */
  private setCacheEntry(key: string, data: any): void {
    if (!this.config.enabled) return;

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]?.[0];
      
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      key,
      data,
      timestamp: Date.now(),
      hits: 0
    });
  }

  /**
   * Get result from cache
   */
  private getCacheEntry(key: string): any | null {
    if (!this.config.enabled) return null;

    const entry = this.cache.get(key);
    if (entry && this.isCacheValid(entry)) {
      entry.hits++;
      return entry.data;
    }

    // Remove invalid entry
    if (entry) {
      this.cache.delete(key);
    }

    return null;
  }

  /**
   * Debounced search to prevent excessive API calls
   */
  public debouncedSearch<T>(
    searchFn: () => Promise<T>,
    key: string,
    debounceMs: number = 300
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // Clear existing timer
      const existingTimer = this.debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer
      const timer = setTimeout(async () => {
        try {
          const result = await searchFn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.debounceTimers.delete(key);
        }
      }, debounceMs);

      this.debounceTimers.set(key, timer);
    });
  }

  /**
   * Optimized search with caching and request deduplication
   */
  public async optimizedSearch(
    params: OptimizedSearchParams,
    searchFunction: (params: OptimizedSearchParams) => Promise<SearchResult>
  ): Promise<SearchResult> {
    const cacheKey = this.generateCacheKey(params);
    const { debounceMs = 300, useCache = true } = params;

    // Check cache first
    if (useCache) {
      const cachedResult = this.getCacheEntry(cacheKey);
      if (cachedResult) {
        return { ...cachedResult, fromCache: true };
      }
    }

    // Check if request is already pending (request deduplication)
    const pendingRequest = this.pendingRequests.get(cacheKey);
    if (pendingRequest) {
      return pendingRequest;
    }

    // Create new request
    const request = this.debouncedSearch(
      async () => {
        const startTime = Date.now();
        const result = await searchFunction(params);
        const endTime = Date.now();
        
        const optimizedResult = {
          ...result,
          searchTime: endTime - startTime,
          fromCache: false
        };

        // Cache the result
        if (useCache) {
          this.setCacheEntry(cacheKey, optimizedResult);
        }

        return optimizedResult;
      },
      cacheKey,
      debounceMs
    );

    this.pendingRequests.set(cacheKey, request);

    try {
      const result = await request;
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    size: number;
    maxSize: number;
    hitRatio: number;
    totalHits: number;
    oldestEntry: number;
  } {
    let totalHits = 0;
    let oldestTimestamp = Date.now();

    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRatio: this.cache.size > 0 ? totalHits / this.cache.size : 0,
      totalHits,
      oldestEntry: Date.now() - oldestTimestamp
    };
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

// Global instance
export const searchOptimizer = new SearchOptimizer();

/**
 * Faceted Search Utilities
 */

export function generateFacetQuery(filters: PropertyFilters): Record<string, any> {
  const facetQuery: Record<string, any> = {};

  // Property type facet
  if (filters.propertyType && filters.propertyType.length > 0) {
    facetQuery.property_type = { terms: { field: "property_type" } };
  }

  // Status facet
  if (filters.status && filters.status.length > 0) {
    facetQuery.status = { terms: { field: "status" } };
  }

  // Price range facet
  facetQuery.price_ranges = {
    range: {
      field: "list_price",
      ranges: [
        { to: 200000, key: "under_200k" },
        { from: 200000, to: 500000, key: "200k_500k" },
        { from: 500000, to: 1000000, key: "500k_1m" },
        { from: 1000000, to: 2000000, key: "1m_2m" },
        { from: 2000000, key: "over_2m" }
      ]
    }
  };

  // Bedroom facet
  facetQuery.bedrooms = {
    terms: { field: "bedrooms", size: 10 }
  };

  // Bathroom facet
  facetQuery.bathrooms = {
    terms: { field: "bathrooms", size: 10 }
  };

  // City facet
  facetQuery.cities = {
    terms: { field: "city", size: 20 }
  };

  // Features facet
  facetQuery.features = {
    terms: { field: "features", size: 20 }
  };

  return facetQuery;
}

export function processFacetResponse(facetResponse: any): Facet[] {
  const facets: Facet[] = [];

  // Process property type facet
  if (facetResponse.property_type?.buckets) {
    facets.push({
      field: 'propertyType',
      label: 'Property Type',
      type: 'checkbox',
      values: facetResponse.property_type.buckets.map((bucket: any) => ({
        value: bucket.key,
        count: bucket.doc_count
      }))
    });
  }

  // Process status facet
  if (facetResponse.status?.buckets) {
    facets.push({
      field: 'status',
      label: 'Status',
      type: 'checkbox',
      values: facetResponse.status.buckets.map((bucket: any) => ({
        value: bucket.key,
        count: bucket.doc_count
      }))
    });
  }

  // Process price ranges facet
  if (facetResponse.price_ranges?.buckets) {
    facets.push({
      field: 'priceRange',
      label: 'Price Range',
      type: 'checkbox',
      values: facetResponse.price_ranges.buckets.map((bucket: any) => ({
        value: bucket.key,
        count: bucket.doc_count
      }))
    });
  }

  // Process bedrooms facet
  if (facetResponse.bedrooms?.buckets) {
    facets.push({
      field: 'beds',
      label: 'Bedrooms',
      type: 'checkbox',
      values: facetResponse.bedrooms.buckets.map((bucket: any) => ({
        value: bucket.key.toString(),
        count: bucket.doc_count
      }))
    });
  }

  // Process bathrooms facet
  if (facetResponse.bathrooms?.buckets) {
    facets.push({
      field: 'baths',
      label: 'Bathrooms',
      type: 'checkbox',
      values: facetResponse.bathrooms.buckets.map((bucket: any) => ({
        value: bucket.key.toString(),
        count: bucket.doc_count
      }))
    });
  }

  // Process cities facet
  if (facetResponse.cities?.buckets) {
    facets.push({
      field: 'city',
      label: 'City',
      type: 'checkbox',
      values: facetResponse.cities.buckets.map((bucket: any) => ({
        value: bucket.key,
        count: bucket.doc_count
      }))
    });
  }

  // Process features facet
  if (facetResponse.features?.buckets) {
    facets.push({
      field: 'features',
      label: 'Features',
      type: 'checkbox',
      values: facetResponse.features.buckets.map((bucket: any) => ({
        value: bucket.key,
        count: bucket.doc_count
      }))
    });
  }

  return facets;
}

/**
 * Performance monitoring utilities
 */

export interface PerformanceMetrics {
  searchLatency: number[];
  cacheHitRate: number;
  facetCalculationTime: number[];
  totalQueries: number;
  averageLatency: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    searchLatency: [],
    cacheHitRate: 0,
    facetCalculationTime: [],
    totalQueries: 0,
    averageLatency: 0
  };

  public recordSearchLatency(latency: number): void {
    this.metrics.searchLatency.push(latency);
    this.metrics.totalQueries++;
    
    // Keep only last 100 measurements
    if (this.metrics.searchLatency.length > 100) {
      this.metrics.searchLatency.shift();
    }

    // Update average
    this.metrics.averageLatency = this.metrics.searchLatency.reduce((a, b) => a + b, 0) / this.metrics.searchLatency.length;
  }

  public recordFacetTime(time: number): void {
    this.metrics.facetCalculationTime.push(time);
    
    // Keep only last 50 measurements
    if (this.metrics.facetCalculationTime.length > 50) {
      this.metrics.facetCalculationTime.shift();
    }
  }

  public updateCacheHitRate(rate: number): void {
    this.metrics.cacheHitRate = rate;
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getP95Latency(): number {
    if (this.metrics.searchLatency.length === 0) return 0;
    
    const sorted = [...this.metrics.searchLatency].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index] || 0;
  }

  public isPerformanceGood(): boolean {
    const p95 = this.getP95Latency();
    return p95 < 1000 && this.metrics.cacheHitRate > 0.3; // 1s P95, 30% cache hit rate
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Search query optimization
 */

export function optimizeSearchQuery(filters: PropertyFilters): Record<string, any> {
  const query: Record<string, any> = {
    bool: {
      must: [],
      filter: [],
      should: [],
      must_not: []
    }
  };

  // Exact match filters (use filter context for caching)
  if (filters.propertyType && filters.propertyType.length > 0) {
    query.bool.filter.push({
      terms: { property_type: filters.propertyType }
    });
  }

  if (filters.status && filters.status.length > 0) {
    query.bool.filter.push({
      terms: { status: filters.status }
    });
  }

  if (filters.city) {
    query.bool.filter.push({
      term: { "city.keyword": filters.city }
    });
  }

  if (filters.county) {
    query.bool.filter.push({
      term: { "county.keyword": filters.county }
    });
  }

  // Range filters
  if (filters.priceRange) {
    query.bool.filter.push({
      range: {
        list_price: {
          gte: filters.priceRange[0],
          lte: filters.priceRange[1] === Number.MAX_SAFE_INTEGER ? undefined : filters.priceRange[1]
        }
      }
    });
  }

  if (filters.areaRange) {
    query.bool.filter.push({
      range: {
        living_area_sqft: {
          gte: filters.areaRange[0],
          lte: filters.areaRange[1] === Number.MAX_SAFE_INTEGER ? undefined : filters.areaRange[1]
        }
      }
    });
  }

  if (filters.lotSizeRange) {
    query.bool.filter.push({
      range: {
        lot_size_sqft: {
          gte: filters.lotSizeRange[0],
          lte: filters.lotSizeRange[1] === Number.MAX_SAFE_INTEGER ? undefined : filters.lotSizeRange[1]
        }
      }
    });
  }

  if (filters.yearBuiltRange) {
    query.bool.filter.push({
      range: {
        year_built: {
          gte: filters.yearBuiltRange[0],
          lte: filters.yearBuiltRange[1]
        }
      }
    });
  }

  // Bedroom/bathroom filters
  if (filters.beds && filters.beds !== "Any") {
    const minBeds = parseInt(filters.beds.replace('+', ''));
    query.bool.filter.push({
      range: { bedrooms: { gte: minBeds } }
    });
  }

  if (filters.baths && filters.baths !== "Any") {
    const minBaths = parseInt(filters.baths.replace('+', ''));
    query.bool.filter.push({
      range: { bathrooms: { gte: minBaths } }
    });
  }

  // Feature filters
  if (filters.features && filters.features.length > 0) {
    filters.features.forEach(feature => {
      query.bool.filter.push({
        term: { features: feature }
      });
    });
  }

  // Boolean feature filters
  if (filters.hasPool) {
    query.bool.filter.push({ term: { has_pool: true } });
  }

  if (filters.hasGarage) {
    query.bool.filter.push({ term: { has_garage: true } });
  }

  if (filters.petFriendly) {
    query.bool.filter.push({ term: { pet_friendly: true } });
  }

  return query;
}

/**
 * Generate sort configuration
 */

export function getSortConfig(sortBy: string = 'recommended'): any[] {
  switch (sortBy) {
    case 'price-asc':
      return [{ list_price: { order: 'asc' } }];
    
    case 'price-desc':
      return [{ list_price: { order: 'desc' } }];
    
    case 'date-desc':
      return [{ created_at: { order: 'desc' } }];
    
    case 'area-desc':
      return [{ living_area_sqft: { order: 'desc' } }];
    
    case 'popular':
      return [{ view_count: { order: 'desc' } }, { created_at: { order: 'desc' } }];
    
    case 'recommended':
    default:
      return [
        { _score: { order: 'desc' } },
        { days_on_market: { order: 'asc' } },
        { created_at: { order: 'desc' } }
      ];
  }
}
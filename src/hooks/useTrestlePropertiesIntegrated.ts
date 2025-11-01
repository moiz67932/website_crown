import { useState, useEffect } from 'react';
import axios from 'axios';
import { Property } from '../interfaces';
import { TrestleProperty } from '../lib/trestle-api';

export interface TrestlePropertyFilters {
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  propertyType?: string;
  hasPool?: boolean;
  isWaterfront?: boolean;
  hasView?: boolean;
  keywords?: string[];
}



export interface UseTrestlePropertiesResult {
  properties: Property[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  searchSemantic: (query: string) => Promise<Property[]>;
}

// Convert API response property to your app's Property interface
// Note: This function now expects properties that come from the /api/properties endpoint
function convertTrestleToProperty(apiProperty: any): Property {
  const base: any = {
    id: apiProperty.id || apiProperty.listing_key,
    listing_key: apiProperty.listing_key || apiProperty.id,
  image: apiProperty.image,
    property_type: apiProperty.property_type || "Unknown",
  // Avoid forcing generic placeholder; allow downstream UI logic to build a better display name.
  address: apiProperty.address || apiProperty.cleaned_address || "",
    location: apiProperty.location || apiProperty.city || "Unknown",
    county: apiProperty.county || apiProperty.state || "",
    list_price: apiProperty.list_price || 0,
    bedrooms: apiProperty.bedrooms || 0,
    bathrooms: apiProperty.bathrooms || 0,
    living_area_sqft: apiProperty.living_area_sqft || "-",
    lot_size_sqft: apiProperty.lot_size_sqft || "-",
    status: apiProperty.status || "UNKNOWN",
    statusColor: apiProperty.statusColor || "bg-gray-100 text-gray-800",
    publicRemarks: apiProperty.publicRemarks || "",
    favorite: false,
    _id: apiProperty._id || apiProperty.listing_key || apiProperty.id,
  images: apiProperty.images || undefined,
  main_photo_url: apiProperty.main_photo_url ?? undefined,
  main_image_url: apiProperty.main_image_url || undefined,
    city: apiProperty.city || "",
    state: apiProperty.state || "",
    zip_code: apiProperty.zip_code || "",
    latitude: apiProperty.latitude || 0,
    longitude: apiProperty.longitude || 0,
    createdAt: apiProperty.createdAt || new Date().toISOString(),
    updatedAt: apiProperty.updatedAt || new Date().toISOString()
  };
  if (apiProperty.display_name) base.display_name = apiProperty.display_name;
  return base as Property;
}

export function useTrestlePropertiesIntegrated(
  filters: TrestlePropertyFilters = {},
  limit: number = 20,
  page: number = 1
): UseTrestlePropertiesResult {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  // Enhanced fetchProperties function that ensures vector database storage
  const fetchProperties = async (newOffset: number = 0, append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🏠 Fetching Trestle properties with filters:', filters);

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: newOffset.toString()
      });

      // Convert filters to Trestle API format
      if (filters.city) params.set('city', filters.city);
      if (filters.state) params.set('state', filters.state);
      if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
      if (filters.minBedrooms) params.set('minBedrooms', filters.minBedrooms.toString());
      if (filters.maxBedrooms) params.set('maxBedrooms', filters.maxBedrooms.toString());
      if (filters.minBathrooms) params.set('minBathrooms', filters.minBathrooms.toString());
      if (filters.maxBathrooms) params.set('maxBathrooms', filters.maxBathrooms.toString());
      if (filters.propertyType) params.set('propertyType', filters.propertyType);
      if (filters.hasPool !== undefined) params.set('hasPool', filters.hasPool.toString());
      if (filters.isWaterfront !== undefined) params.set('isWaterfront', filters.isWaterfront.toString());
      if (filters.hasView !== undefined) params.set('hasView', filters.hasView.toString());
      if (filters.keywords && filters.keywords.length > 0) {
        params.set('keywords', filters.keywords.join(','));
      }

      const response = await axios.get(`/api/properties?${params.toString()}`);
      
      if (response.data.success) {
        const apiProperties = response.data.data;
        console.log(`✅ Received ${apiProperties.length} properties from API`);

        // Convert API properties to your app's Property format
        const convertedProperties = apiProperties.map(convertTrestleToProperty);
        
        // Trigger vector database indexing in the background
        if (apiProperties.length > 0 && newOffset === 0) {
          triggerVectorIndexing(apiProperties);
        }

        if (append) {
          setProperties(prev => [...prev, ...convertedProperties]);
        } else {
          setProperties(convertedProperties);
        }
        
        setTotal(response.data.pagination.total);
        setHasMore(response.data.pagination.hasMore);
        setOffset(newOffset);

        console.log(`📊 Total properties available: ${response.data.pagination.total}`);
      } else {
        setError(response.data.error || 'Failed to fetch properties');
      }
    } catch (err: any) {
      console.error('❌ Error fetching Trestle properties:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  // Trigger vector database indexing (fire and forget)
  const triggerVectorIndexing = async (apiProperties: any[]) => {
    try {
      // Check current status first to avoid redundant POSTs
      const statusResp = await axios.get('/api/admin/vector-index');
      const stats = statusResp.data?.data?.stats;
      if (stats && stats.totalProperties > 0 && stats.totalProperties === apiProperties.length) {
        return; // assume already indexed same page-size set
      }
      console.log('🔍 Triggering vector database indexing...');
      await axios.post('/api/admin/vector-index', { properties: apiProperties });
      console.log('✅ Vector indexing triggered (or skipped server-side)');
    } catch (error) {
      console.warn('⚠️ Vector indexing failed (non-critical):', error);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchProperties(offset + limit, true);
    }
  };

  const refresh = () => {
    setOffset(0);
    fetchProperties(0, false);
  };

  const searchSemantic = async (query: string): Promise<Property[]> => {
    try {
      console.log('🔍 Performing semantic search for:', query);
      
      const response = await axios.post('/api/properties/search/semantic', {
        query,
        limit: 20,
        filters
      });

      if (response.data.success) {
        const searchResults = response.data.data;
        console.log(`✅ Semantic search returned ${searchResults.length} results`);
        
        // Convert to Property format
        return searchResults.map(convertTrestleToProperty);
      } else {
        throw new Error(response.data.error || 'Semantic search failed');
      }
    } catch (err: any) {
      console.error('❌ Semantic search error:', err);
      throw new Error(err.response?.data?.message || err.message || 'Semantic search failed');
    }
  };

  // Fetch properties when filters or page change
  useEffect(() => {
    console.log('🔄 Filters or page changed, refetching properties...');
    const newOffset = (page - 1) * limit;
    fetchProperties(newOffset, false);
  }, [JSON.stringify(filters), limit, page]);

  return {
    properties,
    loading,
    error,
    total,
    hasMore,
    loadMore,
    refresh,
    searchSemantic
  };
}

// Hook for getting a single property from Trestle
export function useTrestleProperty(listingKey: string) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!listingKey) return;

    const fetchProperty = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(`/api/properties/${listingKey}`);
        
        if (response.data.success) {
          const apiProperty = response.data.data;
          setProperty(convertTrestleToProperty(apiProperty));
        } else {
          setError(response.data.error || 'Property not found');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch property');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [listingKey]);

  return { property, loading, error };
}

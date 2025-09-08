import { useState, useEffect } from 'react';
import axios from 'axios';

export interface PropertyFilters {
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

export interface Property {
  ListingKey: string;
  ListPrice?: number;
  UnparsedAddress?: string;
  cleanedAddress?: string;
  StandardStatus?: string;
  PropertyType?: string;
  PropertySubType?: string;
  BedroomsTotal?: number;
  BathroomsTotalInteger?: number;
  LivingArea?: number;
  LotSizeSquareFeet?: number;
  YearBuilt?: number;
  City?: string;
  StateOrProvince?: string;
  PostalCode?: string;
  Latitude?: number;
  Longitude?: number;
  PhotosCount?: number;
  PublicRemarks?: string;
  ListAgentFullName?: string;
  ListOfficeName?: string;
  PoolPrivateYN?: boolean;
  WaterfrontYN?: boolean;
  ViewYN?: boolean;
  DaysOnMarket?: number;
  pricePerSqFt?: number;
  isLuxury?: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface UsePropertiesResult {
  properties: Property[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  searchSemantic: (query: string) => Promise<Property[]>;
}

export function useTrestleProperties(
  filters: PropertyFilters = {},
  limit: number = 20
): UsePropertiesResult {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const fetchProperties = async (newOffset: number = 0, append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: newOffset.toString()
      });

      // Add filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            params.set(key, value.join(','));
          } else {
            params.set(key, value.toString());
          }
        }
      });

      const response = await axios.get(`/api/properties?${params.toString()}`);
      
      if (response.data.success) {
        const newProperties = response.data.data;
        
        if (append) {
          setProperties(prev => [...prev, ...newProperties]);
        } else {
          setProperties(newProperties);
        }
        
        setTotal(response.data.pagination.total);
        setHasMore(response.data.pagination.hasMore);
        setOffset(newOffset);
      } else {
        setError(response.data.error || 'Failed to fetch properties');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch properties');
    } finally {
      setLoading(false);
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
      const response = await axios.post('/api/properties/search/semantic', {
        query,
        limit: 20,
        filters
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Semantic search failed');
      }
    } catch (err: any) {
      console.error('Semantic search error:', err);
      throw new Error(err.response?.data?.message || err.message || 'Semantic search failed');
    }
  };

  // Fetch properties when filters change
  useEffect(() => {
    fetchProperties(0, false);
  }, [JSON.stringify(filters), limit]);

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

// Hook for getting a single property
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
          setProperty(response.data.data);
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

// Hook for admin sync operations
export function useTrestleSync() {
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSyncStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/sync');
      
      if (response.data.success) {
        setSyncStatus(response.data.data);
      } else {
        setError(response.data.error || 'Failed to get sync status');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to get sync status');
    } finally {
      setLoading(false);
    }
  };

  const triggerSync = async (syncType: 'recent' | 'all' | 'full' = 'recent') => {
    try {
      setLoading(true);
      const response = await axios.post('/api/admin/sync', {
        action: 'trigger',
        syncType
      });
      
      if (response.data.success) {
        await fetchSyncStatus(); // Refresh status
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Sync failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Sync failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const startScheduledSync = async () => {
    try {
      const response = await axios.post('/api/admin/sync', {
        action: 'start'
      });
      
      if (response.data.success) {
        await fetchSyncStatus();
      } else {
        throw new Error(response.data.error || 'Failed to start sync');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to start sync');
      throw err;
    }
  };

  const stopScheduledSync = async () => {
    try {
      const response = await axios.post('/api/admin/sync', {
        action: 'stop'
      });
      
      if (response.data.success) {
        await fetchSyncStatus();
      } else {
        throw new Error(response.data.error || 'Failed to stop sync');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to stop sync');
      throw err;
    }
  };

  useEffect(() => {
    fetchSyncStatus();
  }, []);

  return {
    syncStatus,
    loading,
    error,
    triggerSync,
    startScheduledSync,
    stopScheduledSync,
    refresh: fetchSyncStatus
  };
}

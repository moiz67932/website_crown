'use client';

import React, { useState } from 'react';
import { useTrestleProperties, useTrestleSync } from '@/hooks/useTrestleProperties';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Loader2, Search, Home, DollarSign, MapPin, Bed, Bath, Calendar } from 'lucide-react';

export function PropertyDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [semanticResults, setSemanticResults] = useState<any[]>([]);
  const [semanticLoading, setSemanticLoading] = useState(false);
  
  const { 
    properties, 
    loading, 
    error, 
    total, 
    hasMore, 
    loadMore, 
    refresh,
    searchSemantic 
  } = useTrestleProperties({}, 12);

  const { syncStatus, triggerSync } = useTrestleSync();

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setSemanticLoading(true);
      const results = await searchSemantic(searchQuery);
      setSemanticResults(results);
    } catch (error) {
      console.error('Semantic search error:', error);
    } finally {
      setSemanticLoading(false);
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'Price on request';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const PropertyCard = ({ property, similarity }: { property: any; similarity?: number }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold line-clamp-1">
            {property.cleanedAddress || property.UnparsedAddress || 'Address not available'}
          </CardTitle>
          {similarity && (
            <Badge variant="secondary" className="text-xs">
              {Math.round(similarity * 100)}% match
            </Badge>
          )}
        </div>
        <CardDescription className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {property.City}, {property.StateOrProvince}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-green-600">
              {formatPrice(property.ListPrice)}
            </span>
            {property.isLuxury && (
              <Badge variant="outline" className="text-xs">Luxury</Badge>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Bed className="h-3 w-3" />
              {property.BedroomsTotal || '?'} beds
            </div>
            <div className="flex items-center gap-1">
              <Bath className="h-3 w-3" />
              {property.BathroomsTotalInteger || '?'} baths
            </div>
            <div className="flex items-center gap-1">
              <Home className="h-3 w-3" />
              {property.LivingArea ? `${property.LivingArea.toLocaleString()} sqft` : 'N/A'}
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {property.PropertyType && (
              <Badge variant="outline" className="text-xs">{property.PropertyType}</Badge>
            )}
            {property.PoolPrivateYN && (
              <Badge variant="outline" className="text-xs">Pool</Badge>
            )}
            {property.WaterfrontYN && (
              <Badge variant="outline" className="text-xs">Waterfront</Badge>
            )}
            {property.ViewYN && (
              <Badge variant="outline" className="text-xs">View</Badge>
            )}
          </div>

          {property.DaysOnMarket && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              {property.DaysOnMarket} days on market
            </div>
          )}

          {property.pricePerSqFt && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <DollarSign className="h-3 w-3" />
              ${property.pricePerSqFt}/sqft
            </div>
          )}

          {property.PublicRemarks && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {property.PublicRemarks}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Trestle Properties Dashboard</h1>
          <p className="text-gray-600">
            Real-time property data from CoreLogic Trestle API
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={refresh}
            disabled={loading}
            variant="outline"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Refresh
          </Button>
          
          <Button
            onClick={() => triggerSync('recent')}
            disabled={loading}
          >
            Sync Data
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {syncStatus?.syncStatus?.isScheduled ? (
                <Badge variant="outline" className="text-green-600">Running</Badge>
              ) : (
                <Badge variant="outline" className="text-gray-600">Stopped</Badge>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">API Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {syncStatus?.apiHealth?.isHealthy ? (
                <Badge className="bg-green-100 text-green-800">Healthy</Badge>
              ) : (
                <Badge variant="destructive">Unhealthy</Badge>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Update Interval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {syncStatus?.syncStatus?.intervalMinutes || 15} minutes
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Semantic Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Semantic Property Search
          </CardTitle>
          <CardDescription>
            Search properties using natural language (e.g., "luxury waterfront home with pool")
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="luxury waterfront home with pool"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSemanticSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleSemanticSearch}
              disabled={semanticLoading}
            >
              {semanticLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Search
            </Button>
          </div>
          
          {semanticResults.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-3">Semantic Search Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {semanticResults.slice(0, 6).map((result, index) => (
                  <PropertyCard 
                    key={result.ListingKey || index} 
                    property={result} 
                    similarity={result._similarity}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Properties Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Latest Properties</h2>
        
        {loading && properties.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property, index) => (
                <PropertyCard key={property.ListingKey || index} property={property} />
              ))}
            </div>
            
            {hasMore && (
              <div className="mt-8 text-center">
                <Button 
                  onClick={loadMore}
                  disabled={loading}
                  variant="outline"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Load More Properties
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

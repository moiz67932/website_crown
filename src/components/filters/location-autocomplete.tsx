"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
// Using basic dropdown instead of Popover/Command components
import { 
  MapPin, Search, Navigation, Clock, Star, X, Building, 
  Home, TreePine, Target
} from "lucide-react"

export interface LocationSuggestion {
  id: string;
  display: string;
  type: 'city' | 'county' | 'zipcode' | 'neighborhood' | 'address' | 'landmark';
  city?: string;
  county?: string;
  state?: string;
  zipCode?: string;
  coordinates?: [number, number]; // [lat, lng]
  propertyCount?: number;
}

interface LocationAutocompleteProps {
  value?: string;
  onSelect: (location: LocationSuggestion | null) => void;
  onLocationQuery?: (query: string) => Promise<LocationSuggestion[]>;
  placeholder?: string;
  showRecentSearches?: boolean;
  showPopularLocations?: boolean;
  maxSuggestions?: number;
  className?: string;
  allowCustomInput?: boolean;
}

// Mock data for demonstration - replace with actual API calls
const POPULAR_LOCATIONS: LocationSuggestion[] = [
  {
    id: 'la-1',
    display: 'Los Angeles, CA',
    type: 'city',
    city: 'Los Angeles',
    state: 'CA',
    coordinates: [34.0522, -118.2437],
    propertyCount: 15420
  },
  {
    id: 'sf-1',
    display: 'San Francisco, CA',
    type: 'city',
    city: 'San Francisco',
    state: 'CA',
    coordinates: [37.7749, -122.4194],
    propertyCount: 8930
  },
  {
    id: 'sd-1',
    display: 'San Diego, CA',
    type: 'city',
    city: 'San Diego',
    state: 'CA',
    coordinates: [32.7157, -117.1611],
    propertyCount: 12100
  },
  {
    id: 'oc-1',
    display: 'Orange County, CA',
    type: 'county',
    county: 'Orange County',
    state: 'CA',
    coordinates: [33.7175, -117.8311],
    propertyCount: 18750
  }
];

const LOCATION_TYPE_ICONS = {
  city: Building,
  county: TreePine,
  zipcode: MapPin,
  neighborhood: Home,
  address: Navigation,
  landmark: Target
};

const LOCATION_TYPE_LABELS = {
  city: 'City',
  county: 'County',
  zipcode: 'ZIP Code',
  neighborhood: 'Neighborhood',
  address: 'Address',
  landmark: 'Landmark'
};

export default function LocationAutocomplete({
  value = "",
  onSelect,
  onLocationQuery,
  placeholder = "Enter city, ZIP code, or address...",
  showRecentSearches = true,
  showPopularLocations = true,
  maxSuggestions = 10,
  className = "",
  allowCustomInput = true
}: LocationAutocompleteProps) {

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Funktion zum Highlighten von übereinstimmendem Text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-semibold text-orange-800">
          {part}
        </span>
      ) : part
    );
  };

  // Load recent searches from localStorage
  useEffect(() => {
    if (showRecentSearches && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('recent-location-searches');
        if (saved) {
          setRecentSearches(JSON.parse(saved).slice(0, 5));
        }
      } catch (error) {
        console.error('Failed to load recent searches:', error);
      }
    }
  }, [showRecentSearches]);

  // Save location to recent searches
  const saveToRecentSearches = useCallback((location: LocationSuggestion) => {
    if (typeof window === 'undefined') return;
    
    try {
      const existing = JSON.parse(localStorage.getItem('recent-location-searches') || '[]');
      const filtered = existing.filter((item: LocationSuggestion) => item.id !== location.id);
      const updated = [location, ...filtered].slice(0, 5);
      localStorage.setItem('recent-location-searches', JSON.stringify(updated));
      setRecentSearches(updated);
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  }, []);

  // Mock location search function - replace with actual API
  const searchLocations = useCallback(async (query: string): Promise<LocationSuggestion[]> => {
    if (onLocationQuery) {
      return onLocationQuery(query);
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock search results
    const mockResults: LocationSuggestion[] = [
      {
        id: 'search-1',
        display: `${query}, CA`,
        type: 'city',
        city: query,
        state: 'CA',
        coordinates: [34.0522, -118.2437],
        propertyCount: Math.floor(Math.random() * 10000)
      },
      {
        id: 'search-2',
        display: `${query} County, CA`,
        type: 'county',
        county: `${query} County`,
        state: 'CA',
        coordinates: [33.7175, -117.8311],
        propertyCount: Math.floor(Math.random() * 15000)
      }
    ];

    // Filter popular locations that match the query (case insensitive)
    const filteredPopular = POPULAR_LOCATIONS.filter(location =>
      location.display.toLowerCase().includes(query.toLowerCase()) ||
      (location.city && location.city.toLowerCase().includes(query.toLowerCase())) ||
      (location.county && location.county.toLowerCase().includes(query.toLowerCase()))
    );

    return [...filteredPopular, ...mockResults].slice(0, maxSuggestions);
  }, [onLocationQuery, maxSuggestions]);

  // Debounced search
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchLocations(value.trim());
        setSuggestions(results);
      } catch (error) {
        console.error('Location search failed:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, [searchLocations]);

  // Handle location selection
  const handleLocationSelect = useCallback((location: LocationSuggestion | null) => {
    if (location) {
      setSelectedLocation(location);
      setInputValue(location.display);
      saveToRecentSearches(location);
      onSelect(location);
    } else {
      setSelectedLocation(null);
      setInputValue("");
      onSelect(null);
    }
    setOpen(false);
  }, [onSelect, saveToRecentSearches]);

  // Handle custom input
  const handleCustomInput = useCallback(() => {
    if (allowCustomInput && inputValue.trim()) {
      const customLocation: LocationSuggestion = {
        id: `custom-${Date.now()}`,
        display: inputValue.trim(),
        type: 'address' // Default to address for custom input
      };
      handleLocationSelect(customLocation);
    }
  }, [allowCustomInput, inputValue, handleLocationSelect]);

  // Clear selection
  const handleClear = useCallback(() => {
    handleLocationSelect(null);
  }, [handleLocationSelect]);

  // Get current location (if supported)
  const handleCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          // In a real app, you'd reverse geocode these coordinates
          const currentLocation: LocationSuggestion = {
            id: `current-${Date.now()}`,
            display: "Current Location",
            type: 'address',
            coordinates: [latitude, longitude]
          };
          handleLocationSelect(currentLocation);
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  }, [handleLocationSelect]);

  // Display sections
  const showRecentSection = showRecentSearches && recentSearches.length > 0 && !inputValue.trim();
  const showPopularSection = showPopularLocations && !inputValue.trim();
  const showSuggestionsSection = suggestions.length > 0 && inputValue.trim();

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 z-10" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && allowCustomInput) {
              handleCustomInput();
            }
          }}
          className="pl-10 pr-24"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
          {navigator.geolocation && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCurrentLocation}
              className="h-6 w-6 p-0"
              title="Use current location"
            >
              <Navigation className="h-3 w-3" />
            </Button>
          )}
          {selectedLocation && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0"
              title="Clear selection"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-[300px] overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-sm text-slate-500">
              Searching locations...
            </div>
          )}

          {/* Recent Searches */}
          {showRecentSection && (
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-slate-600">
                <Clock className="h-3 w-3" />
                Recent Searches
              </div>
              {recentSearches.map((location) => {
                const Icon = LOCATION_TYPE_ICONS[location.type];
                return (
                  <div
                    key={location.id}
                    onClick={() => handleLocationSelect(location)}
                    className="flex items-center justify-between px-2 py-2 hover:bg-slate-50 cursor-pointer rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-slate-400" />
                      <div>
                        <div className="font-medium text-sm">{highlightText(location.display, inputValue)}</div>
                        <div className="text-xs text-slate-500">
                          {LOCATION_TYPE_LABELS[location.type]}
                        </div>
                      </div>
                    </div>
                    {location.propertyCount && (
                      <Badge variant="secondary" className="text-xs">
                        {location.propertyCount.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Popular Locations */}
          {showPopularSection && (
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-slate-600">
                <Star className="h-3 w-3" />
                Popular Locations
              </div>
              {POPULAR_LOCATIONS.map((location) => {
                const Icon = LOCATION_TYPE_ICONS[location.type];
                return (
                  <div
                    key={location.id}
                    onClick={() => handleLocationSelect(location)}
                    className="flex items-center justify-between px-2 py-2 hover:bg-slate-50 cursor-pointer rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-slate-400" />
                      <div>
                        <div className="font-medium text-sm">{highlightText(location.display, inputValue)}</div>
                        <div className="text-xs text-slate-500">
                          {LOCATION_TYPE_LABELS[location.type]}
                        </div>
                      </div>
                    </div>
                    {location.propertyCount && (
                      <Badge variant="secondary" className="text-xs">
                        {location.propertyCount.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Search Results */}
          {showSuggestionsSection && (
            <div className="p-2">
              <div className="px-2 py-1 text-xs font-medium text-slate-600">Suggestions</div>
              {suggestions.map((location) => {
                const Icon = LOCATION_TYPE_ICONS[location.type];
                return (
                  <div
                    key={location.id}
                    onClick={() => handleLocationSelect(location)}
                    className="flex items-center justify-between px-2 py-2 hover:bg-slate-50 cursor-pointer rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-slate-400" />
                      <div>
                        <div className="font-medium text-sm">{highlightText(location.display, inputValue)}</div>
                        <div className="text-xs text-slate-500">
                          {LOCATION_TYPE_LABELS[location.type]}
                        </div>
                      </div>
                    </div>
                    {location.propertyCount && (
                      <Badge variant="secondary" className="text-xs">
                        {location.propertyCount.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* No results */}
          {!isLoading && inputValue.trim() && suggestions.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-slate-500 mb-2">
                No locations found for "{inputValue}"
              </p>
              {allowCustomInput && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCustomInput}
                >
                  Search for "{inputValue}"
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Selected location indicator */}
      {selectedLocation && (
        <div className="mt-2">
          <Badge variant="outline" className="flex items-center gap-1 w-fit">
            <MapPin className="h-3 w-3" />
            {selectedLocation.display}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-4 w-4 p-0 ml-1"
            >
              <X className="h-2 w-2" />
            </Button>
          </Badge>
        </div>
      )}
    </div>
  );
}
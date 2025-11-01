import { PropertyFilters } from "../types/filters";

/**
 * URL Filter Utilities for SEO-friendly property search URLs
 * 
 * Examples:
 * /properties/houses-for-sale-los-angeles-ca?price=100k-500k&beds=3+&pool=true
 * /properties/condos-under-300k-san-francisco?beds=2+&baths=2+&year=2020+
 * /properties/luxury-homes-orange-county?price=1m+&features=pool,garage,view
 */

// URL path component mappings
const URL_MAPPINGS = {
  propertyTypes: {
    'houses': ['house', 'single_family'],
    'condos': ['condo', 'condominium'],
    'townhomes': ['townhouse', 'townhome'],
    'apartments': ['apartment'],
    'luxury-homes': ['house', 'single_family'], // with price filter
    'new-construction': ['house', 'condo', 'townhouse'], // with year filter
    'investment-properties': ['house', 'condo', 'multi_family'],
    'land': ['land', 'lot'],
    'commercial': ['commercial']
  },
  
  status: {
    'for-sale': ['for_sale'],
    'for-rent': ['for_rent'],
    'sold': ['sold'],
    'pending': ['pending', 'under_contract'],
    'new-listings': ['for_sale'] // with date filter
  },
  
  priceRanges: {
    'under-100k': [0, 100000],
    'under-200k': [0, 200000],
    'under-300k': [0, 300000],
    'under-500k': [0, 500000],
    'under-1m': [0, 1000000],
    '100k-300k': [100000, 300000],
    '200k-500k': [200000, 500000],
    '300k-600k': [300000, 600000],
    '500k-1m': [500000, 1000000],
    '1m-2m': [1000000, 2000000],
    '2m-5m': [2000000, 5000000],
    'luxury': [1000000, 10000000], // luxury threshold
    'over-1m': [1000000, Number.MAX_SAFE_INTEGER],
    'over-2m': [2000000, Number.MAX_SAFE_INTEGER]
  },
  
  locations: {
    // California cities
    'los-angeles': { city: 'Los Angeles', state: 'CA' },
    'san-francisco': { city: 'San Francisco', state: 'CA' },
    'san-diego': { city: 'San Diego', state: 'CA' },
    'orange-county': { county: 'Orange County', state: 'CA' },
    'riverside-county': { county: 'Riverside County', state: 'CA' },
    'ventura-county': { county: 'Ventura County', state: 'CA' },
    'santa-barbara': { city: 'Santa Barbara', state: 'CA' },
    'sacramento': { city: 'Sacramento', state: 'CA' },
    'san-jose': { city: 'San Jose', state: 'CA' },
    'fresno': { city: 'Fresno', state: 'CA' }
  }
};

// Query parameter mappings
const QUERY_PARAM_MAPPINGS = {
  // Price formats: 100k, 500k, 1m, 2.5m, 100k-500k, under-500k, over-1m
  price: (value: string): [number, number] | undefined => {
    const cleanValue = value.toLowerCase().replace(/[$,\s]/g, '');
    
    // Range formats
    if (cleanValue.includes('-')) {
      const [min, max] = cleanValue.split('-');
      return [parsePrice(min), parsePrice(max)];
    }
    
    // Under/Over formats
    if (cleanValue.startsWith('under-') || cleanValue.startsWith('below-')) {
      const amount = cleanValue.replace(/^(under-|below-)/, '');
      return [0, parsePrice(amount)];
    }
    
    if (cleanValue.startsWith('over-') || cleanValue.startsWith('above-')) {
      const amount = cleanValue.replace(/^(over-|above-)/, '');
      return [parsePrice(amount), Number.MAX_SAFE_INTEGER];
    }
    
    // Single value - treat as minimum
    return [parsePrice(cleanValue), Number.MAX_SAFE_INTEGER];
  },
  
  // Beds/Baths: 1, 2, 3, 4, 5, 1+, 2+, 3+, 4+, 5+
  beds: (value: string): string => {
    const cleanValue = value.toLowerCase();
    if (cleanValue.includes('+') || cleanValue.includes('plus')) {
      return cleanValue.replace(/plus/g, '+').replace(/\s/g, '');
    }
    return cleanValue + '+';
  },
  
  baths: (value: string): string => {
    const cleanValue = value.toLowerCase();
    if (cleanValue.includes('+') || cleanValue.includes('plus')) {
      return cleanValue.replace(/plus/g, '+').replace(/\s/g, '');
    }
    return cleanValue + '+';
  },
  
  // Square footage: 1000sqft, 2000-3000sqft, over-2000sqft
  sqft: (value: string): [number, number] | undefined => {
    const cleanValue = value.toLowerCase().replace(/[sqft,\s]/g, '');
    
    if (cleanValue.includes('-')) {
      const [min, max] = cleanValue.split('-');
      return [parseInt(min), parseInt(max)];
    }
    
    if (cleanValue.startsWith('under-') || cleanValue.startsWith('below-')) {
      const amount = cleanValue.replace(/^(under-|below-)/, '');
      return [0, parseInt(amount)];
    }
    
    if (cleanValue.startsWith('over-') || cleanValue.startsWith('above-')) {
      const amount = cleanValue.replace(/^(over-|above-)/, '');
      return [parseInt(amount), Number.MAX_SAFE_INTEGER];
    }
    
    return [parseInt(cleanValue), Number.MAX_SAFE_INTEGER];
  },
  
  // Year built: 2020, 2020+, 2015-2020, new (last 2 years)
  year: (value: string): [number, number] | undefined => {
    const cleanValue = value.toLowerCase();
    const currentYear = new Date().getFullYear();
    
    if (cleanValue === 'new') {
      return [currentYear - 2, currentYear];
    }
    
    if (cleanValue.includes('-')) {
      const [min, max] = cleanValue.split('-');
      return [parseInt(min), parseInt(max)];
    }
    
    if (cleanValue.includes('+')) {
      const year = parseInt(cleanValue.replace('+', ''));
      return [year, currentYear];
    }
    
    const year = parseInt(cleanValue);
    return [year, currentYear];
  },
  
  // Features: pool,garage,fireplace or pool=true&garage=true
  features: (value: string): string[] => {
    return value.split(',').map(f => f.trim().toLowerCase());
  }
};

// Helper function to parse price strings
function parsePrice(priceStr: string): number {
  const cleanStr = priceStr.toLowerCase().replace(/[$,\s]/g, '');
  
  if (cleanStr.includes('k')) {
    return parseFloat(cleanStr.replace('k', '')) * 1000;
  }
  
  if (cleanStr.includes('m')) {
    return parseFloat(cleanStr.replace('m', '')) * 1000000;
  }
  
  return parseFloat(cleanStr) || 0;
}

// Helper function to format price for URLs
function formatPriceForUrl(price: number): string {
  if (price >= 1000000) {
    const millions = price / 1000000;
    return millions % 1 === 0 ? `${millions}m` : `${millions.toFixed(1)}m`;
  }
  
  if (price >= 1000) {
    const thousands = price / 1000;
    return thousands % 1 === 0 ? `${thousands}k` : `${thousands.toFixed(0)}k`;
  }
  
  return price.toString();
}

/**
 * Generate SEO-friendly URL path from filters
 */
export function generateSEOPath(filters: PropertyFilters): string {
  const pathSegments: string[] = ['properties'];
  
  // Property type
  if (filters.propertyType?.length) {
    const primaryType = filters.propertyType[0];
    const typeKey = Object.keys(URL_MAPPINGS.propertyTypes).find(key =>
      URL_MAPPINGS.propertyTypes[key as keyof typeof URL_MAPPINGS.propertyTypes].includes(primaryType)
    );
    if (typeKey) {
      pathSegments.push(typeKey);
    }
  }
  
  // Status
  if (filters.status?.length) {
    const primaryStatus = filters.status[0];
    const statusKey = Object.keys(URL_MAPPINGS.status).find(key =>
      URL_MAPPINGS.status[key as keyof typeof URL_MAPPINGS.status].includes(primaryStatus)
    );
    if (statusKey) {
      pathSegments.push(statusKey);
    }
  }
  
  // Price range
  if (filters.priceRange) {
    const [min, max] = filters.priceRange;
    const rangeKey = Object.keys(URL_MAPPINGS.priceRanges).find(key => {
      const [rangeMin, rangeMax] = URL_MAPPINGS.priceRanges[key as keyof typeof URL_MAPPINGS.priceRanges];
      return rangeMin === min && rangeMax === max;
    });
    
    if (rangeKey) {
      pathSegments.push(rangeKey);
    } else if (max === Number.MAX_SAFE_INTEGER) {
      pathSegments.push(`over-${formatPriceForUrl(min)}`);
    } else if (min === 0) {
      pathSegments.push(`under-${formatPriceForUrl(max)}`);
    } else {
      pathSegments.push(`${formatPriceForUrl(min)}-${formatPriceForUrl(max)}`);
    }
  }
  
  // Location
  if (filters.city) {
    const citySlug = filters.city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    pathSegments.push(citySlug);
  } else if (filters.county) {
    const countySlug = filters.county.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    pathSegments.push(countySlug);
  }
  
  return pathSegments.join('/');
}

/**
 * Generate query parameters from filters
 */
export function generateQueryParams(filters: PropertyFilters): URLSearchParams {
  const params = new URLSearchParams();
  
  // Only add parameters that aren't already in the path
  
  // Beds
  if (filters.beds && filters.beds !== "Any") {
    params.set('beds', filters.beds);
  }
  
  // Baths
  if (filters.baths && filters.baths !== "Any") {
    params.set('baths', filters.baths);
  }
  
  // Square footage
  if (filters.areaRange) {
    const [min, max] = filters.areaRange;
    if (max === Number.MAX_SAFE_INTEGER) {
      params.set('sqft', `over-${min}`);
    } else if (min === 0) {
      params.set('sqft', `under-${max}`);
    } else {
      params.set('sqft', `${min}-${max}`);
    }
  }
  
  // Lot size
  if (filters.lotSizeRange) {
    const [min, max] = filters.lotSizeRange;
    if (max === Number.MAX_SAFE_INTEGER) {
      params.set('lot', `over-${min}`);
    } else if (min === 0) {
      params.set('lot', `under-${max}`);
    } else {
      params.set('lot', `${min}-${max}`);
    }
  }
  
  // Year built
  if (filters.yearBuiltRange) {
    const [min, max] = filters.yearBuiltRange;
    const currentYear = new Date().getFullYear();
    
    if (min === currentYear - 2 && max === currentYear) {
      params.set('year', 'new');
    } else if (max === currentYear) {
      params.set('year', `${min}+`);
    } else {
      params.set('year', `${min}-${max}`);
    }
  }
  
  // Features
  if (filters.features?.length) {
    params.set('features', filters.features.join(','));
  }
  
  // Sorting
  if (filters.sortBy && filters.sortBy !== 'recommended') {
    params.set('sort', filters.sortBy);
  }
  
  // Individual feature flags
  if (filters.hasPool) params.set('pool', 'true');
  if (filters.hasGarage) params.set('garage', 'true');
  if (filters.hasFireplace) params.set('fireplace', 'true');
  if (filters.petFriendly) params.set('pets', 'true');
  if (filters.wheelchairAccessible) params.set('accessible', 'true');
  
  return params;
}

/**
 * Parse URL path and query parameters into filters
 */
export function parseURLToFilters(pathname: string, searchParams: URLSearchParams): PropertyFilters {
  const filters: PropertyFilters = {};
  const pathSegments = pathname.split('/').filter(Boolean);
  
  // Skip 'properties' segment
  if (pathSegments[0] === 'properties') {
    pathSegments.shift();
  }
  
  // Parse path segments
  for (const segment of pathSegments) {
    // Check property types
    if (URL_MAPPINGS.propertyTypes[segment as keyof typeof URL_MAPPINGS.propertyTypes]) {
      filters.propertyType = URL_MAPPINGS.propertyTypes[segment as keyof typeof URL_MAPPINGS.propertyTypes];
      continue;
    }
    
    // Check status
    if (URL_MAPPINGS.status[segment as keyof typeof URL_MAPPINGS.status]) {
      filters.status = URL_MAPPINGS.status[segment as keyof typeof URL_MAPPINGS.status];
      continue;
    }
    
    // Check price ranges
    if (URL_MAPPINGS.priceRanges[segment as keyof typeof URL_MAPPINGS.priceRanges]) {
      filters.priceRange = URL_MAPPINGS.priceRanges[segment as keyof typeof URL_MAPPINGS.priceRanges] as [number, number];
      continue;
    }
    
    // Check locations
    if (URL_MAPPINGS.locations[segment as keyof typeof URL_MAPPINGS.locations]) {
      const location = URL_MAPPINGS.locations[segment as keyof typeof URL_MAPPINGS.locations];
      if ('city' in location) filters.city = location.city;
      if ('county' in location) filters.county = location.county;
      continue;
    }
    
    // Check price patterns (over-1m, under-500k, 100k-500k)
    if (segment.match(/^(over-|under-|above-|below-)\d+[km]?$/)) {
      const priceRange = QUERY_PARAM_MAPPINGS.price(segment);
      if (priceRange) filters.priceRange = priceRange;
      continue;
    }
    
    if (segment.match(/^\d+[km]?-\d+[km]?$/)) {
      const priceRange = QUERY_PARAM_MAPPINGS.price(segment);
      if (priceRange) filters.priceRange = priceRange;
      continue;
    }
    
    // Default to treating as location if it looks like a city name
    if (segment.match(/^[a-z-]+$/)) {
      const cityName = segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      filters.city = cityName;
    }
  }
  
  // Parse query parameters
  for (const [key, value] of searchParams.entries()) {
    switch (key) {
      case 'price':
        const priceRange = QUERY_PARAM_MAPPINGS.price(value);
        if (priceRange) filters.priceRange = priceRange;
        break;
        
      case 'beds':
        filters.beds = QUERY_PARAM_MAPPINGS.beds(value);
        break;
        
      case 'baths':
        filters.baths = QUERY_PARAM_MAPPINGS.baths(value);
        break;
        
      case 'sqft':
        const areaRange = QUERY_PARAM_MAPPINGS.sqft(value);
        if (areaRange) filters.areaRange = areaRange;
        break;
        
      case 'lot':
        const lotRange = QUERY_PARAM_MAPPINGS.sqft(value);
        if (lotRange) filters.lotSizeRange = lotRange;
        break;
        
      case 'year':
        const yearRange = QUERY_PARAM_MAPPINGS.year(value);
        if (yearRange) filters.yearBuiltRange = yearRange;
        break;
        
      case 'features':
        filters.features = QUERY_PARAM_MAPPINGS.features(value);
        break;
        
      case 'sort':
        filters.sortBy = value as PropertyFilters['sortBy'];
        break;
        
      // Individual features
      case 'pool':
        if (value === 'true') filters.hasPool = true;
        break;
      case 'garage':
        if (value === 'true') filters.hasGarage = true;
        break;
      case 'fireplace':
        if (value === 'true') filters.hasFireplace = true;
        break;
      case 'pets':
        if (value === 'true') filters.petFriendly = true;
        break;
      case 'accessible':
        if (value === 'true') filters.wheelchairAccessible = true;
        break;
        
      // Location fallbacks
      case 'city':
        if (!filters.city) filters.city = value;
        break;
      case 'county':
        if (!filters.county) filters.county = value;
        break;
      case 'zip':
        filters.zipCode = value;
        break;
    }
  }
  
  return filters;
}

/**
 * Generate complete SEO-friendly URL from filters
 */
export function generateSEOURL(filters: PropertyFilters, baseUrl = ''): string {
  const path = generateSEOPath(filters);
  const params = generateQueryParams(filters);
  const queryString = params.toString();
  
  const url = `${baseUrl}/${path}`;
  return queryString ? `${url}?${queryString}` : url;
}

/**
 * Generate page title from filters for SEO
 */
export function generatePageTitle(filters: PropertyFilters, defaultTitle = 'Property Search'): string {
  const parts: string[] = [];
  
  // Property type
  if (filters.propertyType?.length) {
    const types = filters.propertyType.map(type => 
      type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    );
    parts.push(types.join(' & '));
  }
  
  // Status
  if (filters.status?.length) {
    parts.push(filters.status.includes('for_sale') ? 'For Sale' : 'For Rent');
  }
  
  // Location
  if (filters.city) {
    parts.push(`in ${filters.city}`);
  } else if (filters.county) {
    parts.push(`in ${filters.county}`);
  }
  
  // Price range
  if (filters.priceRange) {
    const [min, max] = filters.priceRange;
    if (max === Number.MAX_SAFE_INTEGER) {
      parts.push(`Over ${formatPriceForUrl(min).toUpperCase()}`);
    } else if (min === 0) {
      parts.push(`Under ${formatPriceForUrl(max).toUpperCase()}`);
    } else {
      parts.push(`${formatPriceForUrl(min).toUpperCase()} - ${formatPriceForUrl(max).toUpperCase()}`);
    }
  }
  
  // Beds/Baths
  const specs: string[] = [];
  if (filters.beds && filters.beds !== "Any") {
    specs.push(`${filters.beds.replace('+', '+')} Bed`);
  }
  if (filters.baths && filters.baths !== "Any") {
    specs.push(`${filters.baths.replace('+', '+')} Bath`);
  }
  if (specs.length > 0) {
    parts.push(specs.join(', '));
  }
  
  return parts.length > 0 ? parts.join(' ') + ' | Property Search' : defaultTitle;
}

/**
 * Generate meta description from filters for SEO
 */
export function generateMetaDescription(filters: PropertyFilters, propertyCount?: number): string {
  const parts: string[] = [];
  
  if (propertyCount !== undefined) {
    parts.push(`Browse ${propertyCount.toLocaleString()} properties`);
  } else {
    parts.push('Find your perfect property');
  }
  
  // Property type
  if (filters.propertyType?.length) {
    const types = filters.propertyType.map(type => 
      type.replace('_', ' ').toLowerCase()
    );
    parts.push(`including ${types.join(' and ')}`);
  }
  
  // Location
  if (filters.city) {
    parts.push(`in ${filters.city}`);
  } else if (filters.county) {
    parts.push(`in ${filters.county}`);
  }
  
  // Price range
  if (filters.priceRange) {
    const [min, max] = filters.priceRange;
    if (max === Number.MAX_SAFE_INTEGER) {
      parts.push(`starting at ${formatPriceForUrl(min).toUpperCase()}`);
    } else if (min === 0) {
      parts.push(`under ${formatPriceForUrl(max).toUpperCase()}`);
    } else {
      parts.push(`from ${formatPriceForUrl(min).toUpperCase()} to ${formatPriceForUrl(max).toUpperCase()}`);
    }
  }
  
  parts.push('Search by price, location, features and more. Updated daily.');
  
  return parts.join(' ');
}
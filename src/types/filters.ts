// Enhanced filter types for comprehensive property search

export interface PropertyFilters {
  // Search query
  searchQuery?: string;
  
  // Basic filters
  propertyType?: string[]; // e.g., ["Residential", "Land", "Commercial"]
  propertyCategory?: string[]; // e.g., ["house", "condo", "townhouse", "manufactured"]
  status?: string[];
  
  // Price filters
  priceRange?: [number, number];
  
  // Property details
  beds?: string;
  baths?: string;
  
  // Area filters
  areaRange?: [number, number]; // Living area in sq ft
  lotSizeRange?: [number, number]; // Lot size in sq ft
  
  // Year filters
  yearBuiltRange?: [number, number];
  
  // Location filters
  city?: string;
  county?: string;
  zipCode?: string;
  neighborhood?: string[];
  
  // Feature filters
  features?: string[];
  
  // Advanced filters
  hasPool?: boolean;
  hasGarage?: boolean;
  garageSpaces?: number;
  hasFireplace?: boolean;
  hasBasement?: boolean;
  hasBalcony?: boolean;
  hasGarden?: boolean;
  hasGym?: boolean;
  hasSecurity?: boolean;
  hasAirConditioning?: boolean;
  hasHeating?: string; // central, forced air, etc.
  
  // Utility filters
  internetIncluded?: boolean;
  utilitiesIncluded?: string[];
  
  // Accessibility
  wheelchairAccessible?: boolean;
  
  // Parking
  parkingType?: string[]; // garage, driveway, street, etc.
  parkingSpaces?: number;
  
  // Building specific (for condos/apartments)
  hasElevator?: boolean;
  hasConcierge?: boolean;
  hasRooftopAccess?: boolean;
  petFriendly?: boolean;
  
  // Investment properties
  monthlyRent?: [number, number];
  capRate?: [number, number];
  cashFlow?: [number, number];
  
  // Sorting
  sortBy?: "recommended" | "price-asc" | "price-desc" | "date-desc" | "area-desc" | "newest" | "popular";
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: PropertyFilters;
  userId: string;
  alertsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
  icon?: string;
}

export interface FilterCategory {
  id: string;
  name: string;
  options: FilterOption[];
  type: 'checkbox' | 'select' | 'range' | 'toggle';
  multiple?: boolean;
}

// Feature categories for better organization
export const PROPERTY_FEATURES = {
  ESSENTIAL: [
    { label: 'Swimming Pool', value: 'pool', icon: 'Waves' },
    { label: 'Garage', value: 'garage', icon: 'Car' },
    { label: 'Garden/Yard', value: 'garden', icon: 'Trees' },
    { label: 'Fireplace', value: 'fireplace', icon: 'Flame' },
    { label: 'Basement', value: 'basement', icon: 'Home' },
    { label: 'Balcony/Patio', value: 'balcony', icon: 'Building' },
  ],
  AMENITIES: [
    { label: 'Fitness Center/Gym', value: 'gym', icon: 'Dumbbell' },
    { label: 'Security System', value: 'security', icon: 'Shield' },
    { label: 'High-Speed Internet', value: 'internet', icon: 'Wifi' },
    { label: 'Modern Kitchen', value: 'modern_kitchen', icon: 'Utensils' },
    { label: 'Air Conditioning', value: 'ac', icon: 'Wind' },
    { label: 'Central Heating', value: 'heating', icon: 'Thermometer' },
  ],
  BUILDING: [
    { label: 'Elevator', value: 'elevator', icon: 'ArrowUp' },
    { label: 'Concierge', value: 'concierge', icon: 'User' },
    { label: 'Rooftop Access', value: 'rooftop', icon: 'Building2' },
    { label: 'Pet Friendly', value: 'pet_friendly', icon: 'Heart' },
    { label: 'Wheelchair Accessible', value: 'wheelchair', icon: 'Accessibility' },
  ]
};

export const PROPERTY_TYPES = [
  { label: 'House', value: 'house', icon: 'Home' },
  { label: 'Condo', value: 'condo', icon: 'Building' },
  { label: 'Townhouse', value: 'townhouse', icon: 'Building2' },
  { label: 'Apartment', value: 'apartment', icon: 'Building' },
  { label: 'Single Family', value: 'single_family', icon: 'Home' },
  { label: 'Multi Family', value: 'multi_family', icon: 'Building2' },
  { label: 'Land/Lot', value: 'land', icon: 'Trees' },
  { label: 'Commercial', value: 'commercial', icon: 'Building' }
];

export const PROPERTY_STATUS = [
  { label: 'For Sale', value: 'for_sale', color: 'green' },
  { label: 'For Rent', value: 'for_rent', color: 'blue' },
  { label: 'Sold', value: 'sold', color: 'gray' },
  { label: 'Rented', value: 'rented', color: 'gray' },
  { label: 'Under Contract', value: 'under_contract', color: 'orange' },
  { label: 'Pending', value: 'pending', color: 'yellow' },
  { label: 'Off Market', value: 'off_market', color: 'red' },
  { label: 'Coming Soon', value: 'coming_soon', color: 'purple' },
];

export const SORT_OPTIONS = [
  { label: 'Recommended', value: 'recommended' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Newest Listed', value: 'date-desc' },
  { label: 'Largest First', value: 'area-desc' },
  { label: 'Most Popular', value: 'popular' },
];
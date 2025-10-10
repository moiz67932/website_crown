export interface Property {
  id: string;
  image: string;
  listing_key: string;
  // Human-friendly name to display on cards/headings (e.g., street address or SEO title)
  display_name?: string;
  property_type: string;
  address: string;
  location: string;
  list_price: number;
  bedrooms: number;
  bathrooms: number;
  living_area_sqft: number | string;
  lot_size_sqft: number | string;
  status: string;
  statusColor: string;
  publicRemarks: string;
  favorite: boolean;
  _id: string;
  // Normalized primary images for the property (new source of truth)
  images?: string[];
  // New unified main photo field from API
  main_photo_url?: string | null;
  // Legacy/alternate fields kept for compatibility during transition
  main_image_url?: string; // legacy
  main_image?: string;
  photo_url?: string;
  listing_photos?: string[];
  photosCount?: number;
  city: string;
  state: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  county: string;
  updatedAt: string;
}
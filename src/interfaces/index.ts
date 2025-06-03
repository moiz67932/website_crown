export interface Property {
  id: string;
  image: string;
  listing_key: string;
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
  images: string[];
  city: string;
  state: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
}
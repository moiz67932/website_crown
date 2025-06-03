export interface Property {
  id: string;
  image: string;
  listing_key: string;
  property_type: string;
  title: string;
  location: string;
  price: number;
  beds: string | number;
  baths: string | number;
  sqft: string | number;
  status: string;
  statusColor: string;
  publicRemarks: string;
}
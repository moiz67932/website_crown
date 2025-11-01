"use client"

import { useQuery } from "@tanstack/react-query"
import axiosInstance from '../../lib/axios'

interface FetchListPropertiesParams {
  skip?: number;
  limit?: number;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  county?: string;
  minBathroom?: number;
  minBedroom?: number;
  yearBuilt?: number;
  max_sqft?: number;
  min_sqft?: number;
  sortBy?: "recommended" | "price-asc" | "price-desc" | "date-desc" | "area-desc";
}

const fetchListProperties = async ({ skip = 0, limit = 10, county, propertyType, minPrice, maxPrice, city, minBathroom, minBedroom, yearBuilt, max_sqft, min_sqft, sortBy }: FetchListPropertiesParams) => {
  const queryParams = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString(),
    ...(propertyType && { property_type: propertyType }),
    ...(minPrice !== undefined && { min_price: minPrice.toString() }),
    ...(maxPrice !== undefined && { max_price: maxPrice.toString() }),
    ...(city && { city: city }),
    ...(minBathroom !== undefined && { min_bathrooms: minBathroom.toString() }),
    ...(minBedroom !== undefined && { min_bedrooms: minBedroom.toString() }),
    ...(yearBuilt !== undefined && { year_built: yearBuilt.toString() }),
    ...(max_sqft !== undefined && { max_sqft: max_sqft.toString() }),
    ...(min_sqft !== undefined && { min_sqft: min_sqft.toString() }),
    ...(county && { county: county }),
    ...(sortBy && { sort_by: sortBy }),
  });

  const fullUrl = `/api/listings?${queryParams.toString()}`;
  console.log('🔥 Making API call to:', fullUrl);
  console.log('🔥 Sort parameter being sent:', sortBy);
  console.log('🔥 Full query parameters:', Object.fromEntries(queryParams));

  try {
    const res = await axiosInstance.get(fullUrl, {
      headers: {
        accept: "application/json",
      },
    });
    console.log('🔥 API Response received, total items:', res.data?.total_items);
    return res.data;
  } catch (error) {
    console.error('🔥 API Error:', error);
    throw new Error("Failed to fetch list properties");
  }
};

interface UseListPropertiesParams {
  skip?: number;
  limit?: number;
  propertyType?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minBathroom?: number;
  minBedroom?: number;
  yearBuilt?: number;
  max_sqft?: number;
  min_sqft?: number;
  county?: string;
  sortBy?: "recommended" | "price-asc" | "price-desc" | "date-desc" | "area-desc";
}

const useListProperties = ({ skip, limit, propertyType, minPrice, maxPrice, city, minBathroom, minBedroom, yearBuilt, max_sqft, min_sqft, county, sortBy }: UseListPropertiesParams) => {
  return useQuery({
    queryKey: ["listProperties", skip, limit, propertyType, minPrice, maxPrice, city, minBathroom, minBedroom, yearBuilt, max_sqft, min_sqft, county, sortBy],
    queryFn: () => fetchListProperties({ skip, limit, propertyType, minPrice, maxPrice, city, minBathroom, minBedroom, yearBuilt, max_sqft, min_sqft, county, sortBy }),
  });
};

export default useListProperties;

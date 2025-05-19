"use client"

import { useQuery } from "@tanstack/react-query"
import axiosInstance from '@/lib/axios'

interface FetchListPropertiesParams {
  skip?: number;
  limit?: number;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
}

const fetchListProperties = async ({ skip = 0, limit = 10, propertyType, minPrice, maxPrice, city }: FetchListPropertiesParams) => {
  const queryParams = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString(),
    ...(propertyType && { property_type: propertyType }),
    ...(minPrice !== undefined && { min_price: minPrice.toString() }),
    ...(maxPrice !== undefined && { max_price: maxPrice.toString() }),
    ...(city && { city: city }),
  });

  try {
    const res = await axiosInstance.get(`/api/listings?${queryParams.toString()}`, {
      headers: {
        accept: "application/json",
      },
    });
    return res.data;
  } catch (error) {
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
}

const useListProperties = ({ skip, limit, propertyType, minPrice, maxPrice }: UseListPropertiesParams) => {
  return useQuery({
    queryKey: ["listProperties", skip, limit, propertyType, minPrice, maxPrice],
    queryFn: () => fetchListProperties({ skip, limit, propertyType, minPrice, maxPrice }),
  });
};

export default useListProperties;

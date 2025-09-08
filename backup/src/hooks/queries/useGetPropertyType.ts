"use client"

import { useQuery } from "@tanstack/react-query"
import axiosInstance from '@/lib/axios'

interface PropertyTypesResponse {
  property_type: any[];
  property_sub_type: any[];
}

const fetchPropertyTypes = async (): Promise<PropertyTypesResponse> => {
  try {
    const res = await axiosInstance.get('/api/listings/property-type', {
      headers: {
        accept: "application/json",
      },
    });
    const { property_type, property_sub_type } = res.data;
    return { property_type, property_sub_type };
  } catch (error) {
    throw new Error("Failed to fetch property types");
  }
};

const useGetPropertyTypes = () => {
  return useQuery<PropertyTypesResponse>({
    queryKey: ["propertyTypes"],
    queryFn: fetchPropertyTypes,
  });
};

export default useGetPropertyTypes;

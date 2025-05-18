"use client"
import axiosInstance from '@/lib/axios'
import { useQuery } from '@tanstack/react-query'

export interface PropertyDetail {
  _id: string
  listing_key: string
  listing_id: string
  list_price: number
  previous_list_price: number | null
  lease_amount: number | null
  address: string
  city: string
  county: string
  postal_code: string
  latitude: number
  longitude: number
  property_type: string
  property_sub_type: string
  bedrooms: number
  bathrooms: number
  living_area_sqft: number
  lot_size_sqft: number
  year_built: number
  zoning: string | null
  standard_status: string
  mls_status: string
  days_on_market: number
  listing_contract_date: string
  public_remarks: string
  subdivision_name: string
  main_image_url: string
  list_agent_full_name: string
  list_office_name: string
  list_agent_email: string
  list_agent_phone: string
  lease_considered: boolean
  lease_amount_frequency: string | null
  modification_timestamp: string
  on_market_timestamp: string
  agent_phone: string
  agent_email: string
  agent_office_email: string
  agent_office_phone: string
  ListAgentLastName: string
  ListAgentURL: string | null
  possible_use: string | null
  price_change_timestamp: string | null
  VirtualTourURLUnbranded: string | null
  view: string
  Utilities: string | null
  LotFeatures: string[] | null
  ShowingContactName: string | null
  current_price: number
  images: string[]
}

const fetchPropertyDetail = async (id: string): Promise<PropertyDetail> => {
  const response = await axiosInstance.get(`/api/listings/${id}`)
  return response.data
}

export const usePropertyDetail = (id: string) => {
  return useQuery({
    queryKey: ['propertyDetail', id],
    queryFn: () => fetchPropertyDetail(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

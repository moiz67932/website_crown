import axiosInstance from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

interface AutoCompleteResult {
  type: "county" | "city";
  value: string | { county: string; city: string };
}

const fetchAutoComplete = async (query: string): Promise<AutoCompleteResult[]> => {
  const response = await axiosInstance.get(`/api/autocomplete?query=${query}`);
  return response.data;
};

export const useAutoComplete = (query: string) => {
  return useQuery<AutoCompleteResult[]>({
    queryKey: ["autoComplete", query],
    queryFn: () => fetchAutoComplete(query),
  });
};
import { useQuery } from '@tanstack/react-query';

interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  status: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  yearBuilt: number;
  description: string;
  features: string[];
  images: string[];
  agent: {
    name: string;
    phone: string;
    email: string;
    image: string;
  };
  location: {
    lat: number;
    lng: number;
  };
}

async function fetchProperties(): Promise<Property[]> {
  const response = await fetch('/api/properties');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
}

// export function useGetListProperties() {
//   return useQuery<Property[], Error>(['properties'], fetchProperties);
// }

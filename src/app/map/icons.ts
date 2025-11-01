"use client"

import L from "leaflet"
import { formatPrice } from "@/lib/utils"

// Custom marker icons used across map components
export const createCustomIcon = (
  price: number,
  status: string,
  propertyType: string,
  isInSearchArea = false
) => {
  const bgColor = status === "For Sale" ? "bg-green-600" : "bg-blue-600"

  return L.divIcon({
    className: "custom-marker-icon",
    html: `
      <div class="${bgColor} ${
        isInSearchArea ? "ring-2 ring-yellow-400 ring-offset-2" : ""
      } text-white px-2 py-1 rounded-lg shadow-md text-xs font-semibold whitespace-nowrap flex items-center">
        ${formatPrice(price)}
      </div>
    `,
    iconSize: [80, 30],
    iconAnchor: [40, 15],
  })
}

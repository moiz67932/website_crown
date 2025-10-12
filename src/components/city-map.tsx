"use client"
import dynamic from "next/dynamic"

// Use a dynamic client-only inner component so SSR never imports react-leaflet
const CityMapInner = dynamic(() => import("./city-map-inner"), { ssr: false })

interface CityMapWrapperProps {
  bounds: [number, number, number, number]
  properties: any[]
}

export default function CityMapWrapper({ bounds, properties }: CityMapWrapperProps) {
  return (
    <div className="aspect-video bg-gray-200 rounded-xl shadow-medium overflow-hidden">
      <CityMapInner bounds={bounds} properties={properties} />
    </div>
  )
}
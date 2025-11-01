"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Bed, Bath, Maximize, MapPin, Heart } from "lucide-react"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { formatPrice } from "@/lib/utils"
import ReactMarkdown from "react-markdown"

// Define the property type based on useGetListProperties.ts API response
export interface Property {
  _id: string
  listing_key: string
  image?: string
  images?: string[]
  title: string
  status: string
  statusColor?: string
  list_price: number
  current_price?: number
  bedrooms: number
  bathrooms: number
  square_feet: number
  location: string
  address: string
  city?: string
  [key: string]: any
}

interface Data {
  faq_content: string
  amenities_content: string
  page_content: string
  meta_description: string
  title: string
}
interface PropertyListPanelProps {
  onPropertyClick?: () => void
  filteredPropertyIds?: string[]
  properties: Property[]
  onPropertyHover?: (id: string | null) => void
  data: any
  isLoading: boolean
}

export default function PropertyListPanel({
  onPropertyClick,
  filteredPropertyIds,
  onPropertyHover,
  properties,
  data,
  isLoading,
}: PropertyListPanelProps) {
  // Debug: Log property structure to see available image fields
  if (properties.length > 0) {
    console.log('Property sample for debugging images:', {
      images: properties[0].images,
      image: properties[0].image,
      main_image: properties[0].main_image,
      photo_url: properties[0].photo_url,
      listing_photos: properties[0].listing_photos,
      allKeys: Object.keys(properties[0]).filter(key => key.toLowerCase().includes('image') || key.toLowerCase().includes('photo'))
    });
  }
  
  const [favoriteProperties, setFavoriteProperties] = useState<string[]>([])
  const [hoveredProperty, setHoveredProperty] = useState<string | null>(null)
  const faqs = data?.faq_content ? JSON.parse(data.faq_content) : []
  const toggleFavorite = (e: React.MouseEvent, propertyId: string) => {
    e.preventDefault()
    e.stopPropagation()

    setFavoriteProperties((prev) =>
      prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId],
    )
  }

  const handlePropertyHover = (id: string | null) => {
    setHoveredProperty(id)
    if (onPropertyHover) {
      onPropertyHover(id)
    }
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <h2 className="font-semibold text-lg text-slate-900">Properties</h2>
        <p className="text-sm text-slate-500">
          Showing <span className="font-medium">{properties.length}</span> properties
          {filteredPropertyIds && filteredPropertyIds.length > 0 && " in selected area"}
        </p>
      </div>

      {properties.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No properties found</h3>
            <p className="text-sm text-slate-600">
              {filteredPropertyIds
                ? "There are no properties in your selected area. Try drawing a different area on the map."
                : "No properties match your current filters. Try adjusting your search criteria."}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="divide-y divide-slate-200">
            {properties.map((property) => (
              <Link
                href={`/properties/${property.address ? property.address.replaceAll(' ', '-').replace(/[^\w-]/g, '').toLowerCase() : 'property'}/${property.listing_key || property.id || 'unknown'}`}
                key={property.listing_key || property.id}
                className={`block p-4 hover:bg-slate-50 transition-colors ${
                  hoveredProperty === property.listing_key ? "bg-slate-50" : ""
                }`}
                onClick={onPropertyClick}
                onMouseEnter={() => handlePropertyHover(property.listing_key)}
                onMouseLeave={() => handlePropertyHover(null)}
              >
                <div className="flex gap-4">
                  <div className="relative h-24 w-40 flex-shrink-0">
                    <Image
                      src={
                        property.images?.[0] ||
                        (property as any).media_urls?.[0] ||
                        (property as any).main_photo_url ||
                        property.main_image_url ||
                        property.image ||
                        property.main_image ||
                        property.photo_url ||
                        property.listing_photos?.[0] ||
                        "/placeholder-image.jpg"
                      }
                      alt={property.address || 'Property'}
                      fill
                      className="object-cover rounded-md"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder-image.jpg' }}
                    />
                    <Badge
                      className={`absolute top-1 left-1 text-xs bg-green-600` }
                    >
                      {property.property_type}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-sm line-clamp-1">{property.address}</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 -mt-1 -mr-1"
                        onClick={(e) => toggleFavorite(e, property.listing_key)}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            favoriteProperties.includes(property.listing_key) ? "fill-rose-500 text-rose-500" : "text-slate-400"
                          }`}
                        />
                      </Button>
                    </div>
                    <div className="flex items-center text-slate-500 mt-1">
                      <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="text-xs line-clamp-1">{property.city}</span>
                    </div>
                    <p className="font-bold text-sm mt-1">{formatPrice(property.current_price ?? property.list_price)}</p>
                    <div className="flex gap-2 mt-2 text-xs text-slate-600">
                      <div className="flex items-center">
                        <Bed className="h-3 w-3 mr-1 text-slate-400" />
                        <span>{property.bedrooms}</span>
                      </div>
                      <div className="flex items-center">
                        <Bath className="h-3 w-3 mr-1 text-slate-400" />
                        <span>{property.bathrooms}</span>
                      </div>
                      <div className="flex items-center">
                        <Maximize className="h-3 w-3 mr-1 text-slate-400" />
                        <span>
                          {property.lot_size_sqft?.toLocaleString
                            ? property.lot_size_sqft.toLocaleString()
                            : property.living_area_sqft }{" "}
                          sq ft
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
           {/* SEO Content Section */}
           {data && (
            <div className="p-6 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              {data.title && (
                <h3 className="font-bold text-2xl text-slate-900 mb-3">{data.seo_title || data.title}</h3>
              )}
              
              {data.page_content && (
                <div className="prose prose-lg text-slate-700 mb-6">
                  <ReactMarkdown>
                    {data.page_content}
                  </ReactMarkdown>
                </div>
              )}
              
              {data.amenities_content && (
                <div className="mb-6">
                  <h4 className="font-semibold text-lg text-emerald-700 mb-2">Amenities</h4>
                  <div className="prose prose-base text-slate-700">
                    <ReactMarkdown>
                      {data.amenities_content}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
              
              {faqs && faqs.length > 0 && (
                <div>
                  <h4 className="font-semibold text-lg text-blue-700 mb-3">Frequently Asked Questions</h4>
                  <div className="space-y-4">
                    {faqs.map((faq: any, index: number) => (
                      <div key={index} className="bg-slate-100 rounded-lg p-4 shadow-sm">
                        <h5 className="font-semibold text-slate-800 mb-1">{faq.question}</h5>
                        <p className="text-slate-600">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 8px;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #e2e8f0 transparent;
        }
      `}</style>
    </div>
  )
}

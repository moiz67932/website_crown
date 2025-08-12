"use client"

import React from 'react'
import { useComparison } from '@/contexts/comparison-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Scale, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'

export default function ComparisonBar() {
  const { comparisonProperties, removeFromComparison, clearComparison, getComparisonCount } = useComparison()

  if (comparisonProperties.length === 0) {
    return null
  }

  const getPropertyFallbackImage = (propertyType: string, price: number, listingKey?: string) => {
    const propertyImages = [
      "/luxury-modern-house-exterior.png",
      "/modern-beach-house.png", 
      "/modern-ocean-living.png",
      "/luxury-master-bedroom.png",
      "/california-coastal-sunset.png",
      "/san-diego-bay-sunset.png",
      "/los.jpg",
      "/san-fan.jpg"
    ]

    let imageIndex = 0
    const varietyFactor = listingKey ? parseInt(listingKey.slice(-1)) || 0 : 0
    
    if (propertyType?.toLowerCase().includes('lease') || propertyType?.toLowerCase().includes('rent')) {
      imageIndex = (1 + varietyFactor) % 4
    } else if (price > 800000) {
      imageIndex = varietyFactor % 2 === 0 ? 0 : 2
    } else if (price > 500000) {
      imageIndex = (2 + varietyFactor) % 6
    } else if (price > 300000) {
      imageIndex = (1 + varietyFactor) % 5
    } else {
      imageIndex = varietyFactor % 8
    }

    return propertyImages[imageIndex] || "/california-coastal-sunset.png"
  }

  const getImageSrc = (property: any) => {
    return property.images?.[0] || 
           property.image || 
           property.main_image_url || 
           property.main_image || 
           property.photo_url || 
           property.listing_photos?.[0] ||
           getPropertyFallbackImage(property.property_type, property.list_price, property.listing_key)
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-slate-700 p-4 max-w-4xl w-full mx-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
            Property Comparison ({getComparisonCount()}/4)
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearComparison}
          className="text-neutral-500 hover:text-neutral-700"
        >
          Clear All
        </Button>
      </div>

      <div className="flex items-center gap-3">
        {/* Property thumbnails */}
        <div className="flex gap-2 flex-1">
          {comparisonProperties.map((property) => (
            <div
              key={property.listing_key}
              className="relative group bg-neutral-100 dark:bg-slate-800 rounded-lg overflow-hidden flex-shrink-0"
            >
              <div className="w-16 h-16 relative">
                <Image
                  src={getImageSrc(property)}
                  alt={property.address}
                  fill
                  className="object-cover"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="absolute -top-1 -right-1 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeFromComparison(property.listing_key)}
              >
                <X className="h-3 w-3" />
              </Button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-center truncate">
                ${property.list_price.toLocaleString()}
              </div>
            </div>
          ))}
          
          {/* Empty slots */}
          {Array.from({ length: 4 - comparisonProperties.length }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="w-16 h-16 border-2 border-dashed border-neutral-300 dark:border-slate-600 rounded-lg flex items-center justify-center"
            >
              <span className="text-neutral-400 text-xs">+</span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Link href="/compare">
            <Button className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Compare Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

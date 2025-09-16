"use client"

import React from 'react'
import { PropertyCard } from '@/components/property-card'

// Minimal client wrapper that re-exports the PropertyCard as default for server import
export default function PropertyCardClient(props: any) {
  return <PropertyCard {...props} />
}

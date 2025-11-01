"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Property } from '../interfaces'
import { useToast } from '../hooks/use-toast'

interface ComparisonContextType {
  comparisonProperties: Property[]
  addToComparison: (property: Property) => void
  removeFromComparison: (propertyId: string) => void
  clearComparison: () => void
  isInComparison: (propertyId: string) => boolean
  getComparisonCount: () => number
  canAddMore: () => boolean
}

const ComparisonContext = createContext<ComparisonContextType | null>(null)

export function ComparisonProvider({ children }: { children: React.ReactNode }) {
  const [comparisonProperties, setComparisonProperties] = useState<Property[]>([])
  const { toast } = useToast()

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('comparison-properties')
    if (saved) {
      try {
        setComparisonProperties(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading comparison properties:', error)
      }
    }
  }, [])

  // Save to localStorage whenever properties change
  useEffect(() => {
    localStorage.setItem('comparison-properties', JSON.stringify(comparisonProperties))
  }, [comparisonProperties])

  const addToComparison = (property: Property) => {
    if (comparisonProperties.length >= 4) {
      toast({
        title: "Comparison Limit Reached",
        description: "You can only compare up to 4 properties at once.",
        variant: "destructive",
      })
      return
    }

    if (comparisonProperties.find(p => p.listing_key === property.listing_key)) {
      toast({
        title: "Property Already Added",
        description: "This property is already in your comparison list.",
        variant: "destructive",
      })
      return
    }

    setComparisonProperties(prev => [...prev, property])
    
    const count = comparisonProperties.length + 1
    toast({
      title: `Property Added (${count}/4)`,
      description: `${property.address} has been added to comparison.`,
      variant: "default",
    })
  }

  const removeFromComparison = (propertyId: string) => {
    const property = comparisonProperties.find(p => p.listing_key === propertyId)
    setComparisonProperties(prev => prev.filter(p => p.listing_key !== propertyId))
    
    if (property) {
      toast({
        title: "Property Removed",
        description: `${property.address} has been removed from comparison.`,
        variant: "default",
      })
    }
  }

  const clearComparison = () => {
    setComparisonProperties([])
    toast({
      title: "Comparison Cleared",
      description: "All properties have been removed from comparison.",
      variant: "default",
    })
  }

  const isInComparison = (propertyId: string) => {
    return comparisonProperties.some(p => p.listing_key === propertyId)
  }

  const getComparisonCount = () => comparisonProperties.length

  const canAddMore = () => comparisonProperties.length < 4

  return (
    <ComparisonContext.Provider
      value={{
        comparisonProperties,
        addToComparison,
        removeFromComparison,
        clearComparison,
        isInComparison,
        getComparisonCount,
        canAddMore,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  )
}

export function useComparison() {
  const context = useContext(ComparisonContext)
  if (!context) {
    throw new Error('useComparison must be used within a ComparisonProvider')
  }
  return context
}

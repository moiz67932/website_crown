"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './use-auth'

interface FavoriteProperty {
  id: string
  propertyId: string
  listingKey: string
  property: any
  notes?: string
  tags?: string[]
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

export function useFavoriteProperties() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [favoriteProperties, setFavoriteProperties] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  // Load saved properties on mount
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadFavoriteProperties()
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated, authLoading])

  const loadFavoriteProperties = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/user/saved-properties?favorites=true')
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          const favoriteKeys = new Set<string>(result.data.map((prop: FavoriteProperty) => prop.listingKey))
          setFavoriteProperties(favoriteKeys)
        }
      }
    } catch (error) {
      console.error('Error loading favorite properties:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const isFavorite = useCallback((listingKey: string): boolean => {
    return favoriteProperties.has(listingKey)
  }, [favoriteProperties])

  const toggleFavorite = async (listingKey: string, propertyData: any): Promise<boolean> => {
    if (!isAuthenticated) {
      alert('Please sign in to save favorite properties')
      return false
    }

    const wasAlreadyFavorite = favoriteProperties.has(listingKey)

    try {
      if (wasAlreadyFavorite) {
        // Remove from favorites
        const response = await fetch(`/api/user/saved-properties?listingKey=${encodeURIComponent(listingKey)}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Failed to remove from favorites')
        }

        setFavoriteProperties(prev => {
          const next = new Set(prev)
          next.delete(listingKey)
          return next
        })

        return false
      } else {
        // Add to favorites
        const response = await fetch('/api/user/saved-properties', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            property: propertyData,
            isFavorite: true,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to add to favorites')
        }

        setFavoriteProperties(prev => {
          const next = new Set(prev)
          next.add(listingKey)
          return next
        })

        return true
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      alert('Failed to update favorites. Please try again.')
      return wasAlreadyFavorite
    }
  }

  const addToFavorites = async (listingKey: string, propertyData: any): Promise<boolean> => {
    if (!isAuthenticated) {
      alert('Please sign in to save favorite properties')
      return false
    }

    if (favoriteProperties.has(listingKey)) {
      return true // Already favorited
    }

    try {
      const response = await fetch('/api/user/saved-properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property: propertyData,
          isFavorite: true,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add to favorites')
      }

      setFavoriteProperties(prev => {
        const next = new Set(prev)
        next.add(listingKey)
        return next
      })

      return true
    } catch (error) {
      console.error('Error adding to favorites:', error)
      alert('Failed to add to favorites. Please try again.')
      return false
    }
  }

  const removeFromFavorites = async (listingKey: string): Promise<boolean> => {
    if (!isAuthenticated) {
      return false
    }

    if (!favoriteProperties.has(listingKey)) {
      return true // Already not favorited
    }

    try {
      const response = await fetch(`/api/user/saved-properties?listingKey=${encodeURIComponent(listingKey)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove from favorites')
      }

      setFavoriteProperties(prev => {
        const next = new Set(prev)
        next.delete(listingKey)
        return next
      })

      return true
    } catch (error) {
      console.error('Error removing from favorites:', error)
      alert('Failed to remove from favorites. Please try again.')
      return false
    }
  }

  return {
    favoriteProperties: Array.from(favoriteProperties),
    isFavorite,
    toggleFavorite,
    addToFavorites,
    removeFromFavorites,
    isLoading,
    refreshFavorites: loadFavoriteProperties,
  }
}

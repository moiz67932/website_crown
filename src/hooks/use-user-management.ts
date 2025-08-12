"use client"

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

// Custom hook for user profile management
export function useUserProfile() {
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/user/profile')
      const data = await response.json()
      
      if (data.success) {
        setProfile(data.user)
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (updateData: any) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchProfile() // Refresh profile data
        toast({
          title: "Success",
          description: "Profile updated successfully",
        })
        return { success: true }
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
      return { success: false, message: 'Failed to update profile' }
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  return {
    profile,
    isLoading,
    updateProfile,
    refetch: fetchProfile
  }
}

// Custom hook for saved properties
export function useSavedProperties() {
  const [savedProperties, setSavedProperties] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchSavedProperties = async (onlyFavorites = false) => {
    try {
      setIsLoading(true)
      const url = onlyFavorites ? '/api/user/saved-properties?favorites=true' : '/api/user/saved-properties'
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setSavedProperties(data.data)
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching saved properties:', error)
      toast({
        title: "Error",
        description: "Failed to load saved properties",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveProperty = async (property: any, isFavorite = false, notes?: string, tags?: string) => {
    try {
      const response = await fetch('/api/user/saved-properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property,
          isFavorite,
          notes,
          tags
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchSavedProperties() // Refresh saved properties
        toast({
          title: "Success",
          description: "Property saved successfully",
        })
        return { success: true }
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Error saving property:', error)
      toast({
        title: "Error",
        description: "Failed to save property",
        variant: "destructive",
      })
      return { success: false, message: 'Failed to save property' }
    }
  }

  const removeProperty = async (listingKey: string) => {
    try {
      const response = await fetch(`/api/user/saved-properties?listingKey=${listingKey}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchSavedProperties() // Refresh saved properties
        toast({
          title: "Success",
          description: "Property removed successfully",
        })
        return { success: true }
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Error removing property:', error)
      toast({
        title: "Error",
        description: "Failed to remove property",
        variant: "destructive",
      })
      return { success: false, message: 'Failed to remove property' }
    }
  }

  const updatePropertyNotes = async (listingKey: string, notes: string) => {
    try {
      const response = await fetch(`/api/user/saved-properties/${listingKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_notes',
          notes
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchSavedProperties() // Refresh saved properties
        toast({
          title: "Success",
          description: "Notes updated successfully",
        })
        return { success: true }
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Error updating notes:', error)
      toast({
        title: "Error",
        description: "Failed to update notes",
        variant: "destructive",
      })
      return { success: false, message: 'Failed to update notes' }
    }
  }

  const toggleFavorite = async (listingKey: string, isFavorite: boolean) => {
    try {
      const response = await fetch(`/api/user/saved-properties/${listingKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'toggle_favorite',
          isFavorite
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchSavedProperties() // Refresh saved properties
        toast({
          title: "Success",
          description: isFavorite ? "Added to favorites" : "Removed from favorites",
        })
        return { success: true }
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      })
      return { success: false, message: 'Failed to update favorite status' }
    }
  }

  const checkIfSaved = async (listingKey: string) => {
    try {
      const response = await fetch(`/api/user/saved-properties/${listingKey}`)
      const data = await response.json()
      
      if (data.success) {
        return data.isSaved
      }
      return false
    } catch (error) {
      console.error('Error checking if property is saved:', error)
      return false
    }
  }

  useEffect(() => {
    fetchSavedProperties()
  }, [])

  return {
    savedProperties,
    isLoading,
    saveProperty,
    removeProperty,
    updatePropertyNotes,
    toggleFavorite,
    checkIfSaved,
    refetch: fetchSavedProperties
  }
}

// Custom hook for saved searches
export function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchSavedSearches = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/user/saved-searches')
      const data = await response.json()
      
      if (data.success) {
        setSavedSearches(data.data)
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching saved searches:', error)
      toast({
        title: "Error",
        description: "Failed to load saved searches",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveSearch = async (name: string, searchCriteria: any, alertFrequency = 'daily') => {
    try {
      const response = await fetch('/api/user/saved-searches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          searchCriteria,
          alertFrequency
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchSavedSearches() // Refresh saved searches
        toast({
          title: "Success",
          description: "Search saved successfully",
        })
        return { success: true, searchId: data.searchId }
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Error saving search:', error)
      toast({
        title: "Error",
        description: "Failed to save search",
        variant: "destructive",
      })
      return { success: false, message: 'Failed to save search' }
    }
  }

  const updateSearch = async (searchId: number, name: string, searchCriteria: any, alertFrequency: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/user/saved-searches/${searchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          searchCriteria,
          alertFrequency,
          isActive
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchSavedSearches() // Refresh saved searches
        toast({
          title: "Success",
          description: "Search updated successfully",
        })
        return { success: true }
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Error updating search:', error)
      toast({
        title: "Error",
        description: "Failed to update search",
        variant: "destructive",
      })
      return { success: false, message: 'Failed to update search' }
    }
  }

  const deleteSearch = async (searchId: number) => {
    try {
      const response = await fetch(`/api/user/saved-searches/${searchId}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchSavedSearches() // Refresh saved searches
        toast({
          title: "Success",
          description: "Search deleted successfully",
        })
        return { success: true }
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Error deleting search:', error)
      toast({
        title: "Error",
        description: "Failed to delete search",
        variant: "destructive",
      })
      return { success: false, message: 'Failed to delete search' }
    }
  }

  useEffect(() => {
    fetchSavedSearches()
  }, [])

  return {
    savedSearches,
    isLoading,
    saveSearch,
    updateSearch,
    deleteSearch,
    refetch: fetchSavedSearches
  }
}

// Custom hook for search history
export function useSearchHistory() {
  const [searchHistory, setSearchHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchSearchHistory = async (limit = 50) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/user/search-history?limit=${limit}`)
      const data = await response.json()
      
      if (data.success) {
        setSearchHistory(data.data)
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching search history:', error)
      toast({
        title: "Error",
        description: "Failed to load search history",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addSearchHistory = async (searchQuery: string, searchFilters?: any, resultsCount = 0) => {
    try {
      const response = await fetch('/api/user/search-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchQuery,
          searchFilters,
          resultsCount
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchSearchHistory() // Refresh search history
        return { success: true }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Error adding search history:', error)
      return { success: false, message: 'Failed to add search history' }
    }
  }

  const clearSearchHistory = async () => {
    try {
      const response = await fetch('/api/user/search-history', {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchSearchHistory() // Refresh search history
        toast({
          title: "Success",
          description: "Search history cleared successfully",
        })
        return { success: true }
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Error clearing search history:', error)
      toast({
        title: "Error",
        description: "Failed to clear search history",
        variant: "destructive",
      })
      return { success: false, message: 'Failed to clear search history' }
    }
  }

  useEffect(() => {
    fetchSearchHistory()
  }, [])

  return {
    searchHistory,
    isLoading,
    addSearchHistory,
    clearSearchHistory,
    refetch: fetchSearchHistory
  }
}

// Custom hook for viewed properties
export function useViewedProperties() {
  const [viewedProperties, setViewedProperties] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchViewedProperties = async (limit = 50) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/user/viewed-properties?limit=${limit}`)
      const data = await response.json()
      
      if (data.success) {
        setViewedProperties(data.data)
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching viewed properties:', error)
      toast({
        title: "Error",
        description: "Failed to load viewed properties",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addViewedProperty = async (property: any, viewDuration = 0) => {
    try {
      const response = await fetch('/api/user/viewed-properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property,
          viewDuration
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        return { success: true }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Error adding viewed property:', error)
      return { success: false, message: 'Failed to add viewed property' }
    }
  }

  const clearViewedProperties = async () => {
    try {
      const response = await fetch('/api/user/viewed-properties', {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchViewedProperties() // Refresh viewed properties
        toast({
          title: "Success",
          description: "Viewed properties cleared successfully",
        })
        return { success: true }
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Error clearing viewed properties:', error)
      toast({
        title: "Error",
        description: "Failed to clear viewed properties",
        variant: "destructive",
      })
      return { success: false, message: 'Failed to clear viewed properties' }
    }
  }

  useEffect(() => {
    fetchViewedProperties()
  }, [])

  return {
    viewedProperties,
    isLoading,
    addViewedProperty,
    clearViewedProperties,
    refetch: fetchViewedProperties
  }
}

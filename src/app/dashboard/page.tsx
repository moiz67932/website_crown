"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { 
  useUserProfile,
  useSavedProperties,
  useSavedSearches,
  useSearchHistory,
  useViewedProperties
} from '@/hooks/use-user-management'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  User, 
  Heart, 
  Search, 
  Eye, 
  Bell, 
  Settings,
  Home,
  Star,
  Calendar,
  MapPin,
  DollarSign,
  TrendingUp,
  Filter,
  History,
  Bookmark,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

function calculateAge(dateOfBirth: string) {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const { profile, isLoading: profileLoading } = useUserProfile()
  const { savedProperties, isLoading: savedLoading } = useSavedProperties()
  const { savedSearches, isLoading: searchesLoading } = useSavedSearches()
  const { searchHistory, isLoading: historyLoading } = useSearchHistory()
  const { viewedProperties, isLoading: viewedLoading } = useViewedProperties()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [authLoading, isAuthenticated, router])

  if (authLoading || profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user || !profile) {
    return null
  }

  const favoriteProperties = savedProperties?.filter(property => property.isFavorite) || []
  const activeSearches = savedSearches?.filter(search => search.isActive) || []

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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Welcome back, {profile.firstName}!
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Here's what's happening with your property search
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saved Properties</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{savedProperties?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {favoriteProperties.length} favorites
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saved Searches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{savedSearches?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {activeSearches.length} active alerts
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recently Viewed</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{viewedProperties?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              properties viewed
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Search History</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{searchHistory?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              total searches
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="searches">Searches</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Favorites */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Recent Favorites
                </CardTitle>
                <CardDescription>
                  Your most recently favorited properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                {favoriteProperties.length > 0 ? (
                  <div className="space-y-4">
                    {favoriteProperties.slice(0, 3).map((saved) => (
                      <div key={saved.id} className="flex items-center space-x-4">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                          <Image
                            src={getImageSrc(saved.property)}
                            alt={saved.property.address}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {saved.property.address}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${saved.property.list_price?.toLocaleString()}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                    <Link href="#properties">
                      <Button variant="outline" className="w-full mt-4">
                        View All Favorites
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Heart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No favorites yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Searches */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-500" />
                  Active Search Alerts
                </CardTitle>
                <CardDescription>
                  Your saved searches with notifications enabled
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeSearches.length > 0 ? (
                  <div className="space-y-4">
                    {activeSearches.slice(0, 3).map((search) => (
                      <div key={search.id} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {search.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {search.alertFrequency} alerts
                          </p>
                        </div>
                        <Badge variant="outline">
                          {search.resultsCount} results
                        </Badge>
                      </div>
                    ))}
                    <Link href="#searches">
                      <Button variant="outline" className="w-full mt-4">
                        Manage All Searches
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No active searches</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your latest property viewing and search activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {viewedProperties.length > 0 ? (
                <div className="space-y-4">
                  {viewedProperties.slice(0, 5).map((viewed) => (
                    <div key={viewed.id} className="flex items-center space-x-4">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                        <Image
                          src={getImageSrc(viewed.property)}
                          alt={viewed.property.address}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          Viewed {viewed.property.address}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(viewed.viewedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {Math.floor(viewed.viewDuration / 1000)}s
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Eye className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* All Saved Properties */}
            <Card>
              <CardHeader>
                <CardTitle>Saved Properties ({savedProperties?.length || 0})</CardTitle>
                <CardDescription>
                  All your saved and bookmarked properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                {savedLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="w-16 h-16 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : savedProperties.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {savedProperties.map((saved) => (
                      <div key={saved.id} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                          <Image
                            src={getImageSrc(saved.property)}
                            alt={saved.property.address}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {saved.property.address}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${saved.property.list_price?.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {saved.isFavorite && (
                              <Badge variant="destructive" className="text-xs">
                                <Heart className="h-3 w-3 mr-1" />
                                Favorite
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {new Date(saved.createdAt).toLocaleDateString()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Home className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No saved properties</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recently Viewed */}
            <Card>
              <CardHeader>
                <CardTitle>Recently Viewed ({viewedProperties?.length || 0})</CardTitle>
                <CardDescription>
                  Properties you've recently viewed
                </CardDescription>
              </CardHeader>
              <CardContent>
                {viewedLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="w-16 h-16 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : viewedProperties.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {viewedProperties.slice(0, 10).map((viewed) => (
                      <div key={viewed.id} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                          <Image
                            src={getImageSrc(viewed.property)}
                            alt={viewed.property.address}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {viewed.property.address}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${viewed.property.list_price?.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {new Date(viewed.viewedAt).toLocaleDateString()}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {Math.floor(viewed.viewDuration / 1000)}s view
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Eye className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No viewed properties</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Searches Tab */}
        <TabsContent value="searches" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Saved Searches ({savedSearches?.length || 0})</CardTitle>
              <CardDescription>
                Manage your saved searches and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {searchesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <Skeleton className="h-5 w-1/3 mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-2" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  ))}
                </div>
              ) : savedSearches.length > 0 ? (
                <div className="space-y-4">
                  {savedSearches.map((search) => (
                    <div key={search.id} className="p-4 border rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{search.name}</h3>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={search.isActive ? "default" : "secondary"}>
                              {search.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">
                              {search.alertFrequency} alerts
                            </Badge>
                            <Badge variant="outline">
                              {search.resultsCount} results
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Created {new Date(search.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No saved searches</p>
                  <Button className="mt-4">Create Your First Search</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search History ({searchHistory?.length || 0})</CardTitle>
              <CardDescription>
                Your recent search queries and filters
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-3 border rounded-lg">
                      <Skeleton className="h-4 w-1/2 mb-2" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  ))}
                </div>
              ) : searchHistory.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {searchHistory.map((history) => (
                    <div key={history.id} className="p-3 border rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{history.searchQuery}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {history.resultsCount} results
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(history.searchTimestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No search history</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Manage your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {profile.firstName} {profile.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {calculateAge(profile.dateOfBirth)} years old
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <p className="text-sm text-muted-foreground">
                    {profile.phone || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Member Since</label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(profile.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {profile.bio && (
                <div>
                  <label className="text-sm font-medium">Bio</label>
                  <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Link href="/profile">
                  <Button className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Edit Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

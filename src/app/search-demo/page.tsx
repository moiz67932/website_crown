"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import SearchBar from '@/components/home/search-bar'
import LocationAutocomplete from '@/components/filters/location-autocomplete'
import EnhancedSearchInput from '@/components/search/enhanced-search-input'
import { Search, CheckCircle, Zap, MapPin } from 'lucide-react'

interface SearchSuggestion {
  id: string
  text: string
  type: 'location' | 'property' | 'recent' | 'quick'
  metadata?: {
    city?: string
    county?: string
    propertyCount?: number
    price?: string
  }
}

export default function SearchDemoPage() {
  const [searchResults, setSearchResults] = useState<string[]>([])
  const [selectedLocation, setSelectedLocation] = useState<any>(null)

  // Mock suggestions für Enhanced Search
  const mockSuggestions: SearchSuggestion[] = [
    {
      id: '1',
      text: 'Orange County, CA',
      type: 'location',
      metadata: { county: 'Orange County', propertyCount: 1250 }
    },
    {
      id: '2', 
      text: 'Orange, CA',
      type: 'location',
      metadata: { city: 'Orange', county: 'Orange County', propertyCount: 450 }
    },
    {
      id: '3',
      text: 'Orangevale, CA',
      type: 'location',
      metadata: { city: 'Orangevale', county: 'Sacramento County', propertyCount: 89 }
    }
  ]

  const handleSearch = (query: string, type?: string) => {
    console.log('Suche ausgeführt:', { query, type })
    setSearchResults(prev => [...prev, `Gesucht nach: "${query}" (${type || 'allgemein'})`])
  }

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    console.log('Vorschlag ausgewählt:', suggestion)
    setSearchResults(prev => [...prev, `Vorschlag ausgewählt: "${suggestion.text}" (${suggestion.type})`])
  }

  const features = [
    {
      icon: <Search className="h-5 w-5 text-blue-600" />,
      title: "Case-Insensitive Suche",
      description: "Suche funktioniert unabhängig von Groß-/Kleinschreibung",
      example: '"orange" findet "Orange", "ORANGE", und "Orange County"'
    },
    {
      icon: <Zap className="h-5 w-5 text-yellow-600" />,
      title: "Fuzzy Search",
      description: "Intelligente Suche findet auch ähnliche Begriffe",
      example: '"orng" findet "Orange" und ähnliche Orte'
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      title: "Text Highlighting",
      description: "Suchbegriffe werden in Vorschlägen hervorgehoben",
      example: 'Passende Textteile werden farbig markiert'
    },
    {
      icon: <MapPin className="h-5 w-5 text-red-600" />,
      title: "Smart Suggestions",
      description: "Intelligente Vorschläge basierend auf Ihrer Eingabe",
      example: 'Automatische Vervollständigung mit relevanten Orten'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Verbesserte Suchfunktionalität Demo
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Testen Sie unsere erweiterten Suchfeatures: Case-insensitive Suche, Fuzzy Search, 
            Text-Highlighting und intelligente Vorschläge für eine bessere Benutzererfahrung.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {features.map((feature, index) => (
            <Card key={index} className="text-center">
              <CardHeader className="pb-3">
                <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  {feature.icon}
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-2">{feature.description}</p>
                <Badge variant="outline" className="text-xs">
                  {feature.example}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search Components Demo */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Original Search Bar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Verbesserte Haupt-Suchleiste
              </CardTitle>
              <CardDescription>
                Die Haupt-Suchleiste mit verbesserter Autocomplete-Funktionalität
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SearchBar />
              <div className="mt-4 text-sm text-slate-600">
                <p className="font-medium mb-2">Probieren Sie aus:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Tippen Sie "orange" (klein geschrieben)</li>
                  <li>Probieren Sie "los angeles"</li>
                  <li>Testen Sie unvollständige Eingaben wie "san fr"</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Search Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Erweiterte Suchkomponente
              </CardTitle>
              <CardDescription>
                Neue Suchkomponente mit Schnellsuche und verbesserter UX
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedSearchInput
                onSearch={handleSearch}
                onSuggestionSelect={handleSuggestionSelect}
                suggestions={mockSuggestions}
                placeholder="Suche nach 'orange' für Demo..."
              />
              <div className="mt-4 text-sm text-slate-600">
                <p className="font-medium mb-2">Features:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Schnellsuche-Vorschläge</li>
                  <li>Letzte Suchen</li>
                  <li>Live-Highlighting</li>
                  <li>Intelligente Vervollständigung</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Location Autocomplete Demo */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Orts-Autocomplete mit Highlighting
            </CardTitle>
            <CardDescription>
              Verbesserte Standort-Suche mit Text-Highlighting und case-insensitive Matching
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
              <LocationAutocomplete
                onSelect={setSelectedLocation}
                placeholder="Tippen Sie 'orange' oder 'los' für Demo..."
              />
              {selectedLocation && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">
                    Ausgewählt: {selectedLocation.display}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Such-Aktivitäten</CardTitle>
              <CardDescription>
                Live-Log Ihrer Suchaktivitäten in dieser Demo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <div key={index} className="text-sm p-2 bg-slate-50 rounded border-l-4 border-orange-400">
                    {result}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Technical Details */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Technische Implementierung</CardTitle>
            <CardDescription>
              Übersicht über die implementierten Verbesserungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Backend-Verbesserungen:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Neue <code>/api/autocomplete</code> Route mit Fuzzy Search</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Case-insensitive String-Matching</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Score-basiertes Ranking der Suchergebnisse</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Optimierte Performance mit Caching</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Frontend-Verbesserungen:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Text-Highlighting in Suchvorschlägen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Verbesserte Loading States und UX</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Debounced Search für bessere Performance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Intelligente Schnellsuche-Vorschläge</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Search, MapPin, X, Loader2, Clock, Zap } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { highlightMatches } from '@/utils/search-utils'

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

interface EnhancedSearchInputProps {
  placeholder?: string
  onSearch: (query: string, type?: string) => void
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void
  suggestions?: SearchSuggestion[]
  isLoading?: boolean
  showRecentSearches?: boolean
  className?: string
}

export default function EnhancedSearchInput({
  placeholder = "Suche nach Ort, Eigenschaft oder Kriterium...",
  onSearch,
  onSuggestionSelect,
  suggestions = [],
  isLoading = false,
  showRecentSearches = true,
  className = ""
}: EnhancedSearchInputProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<SearchSuggestion[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Quick search suggestions
  const quickSearches: SearchSuggestion[] = [
    { id: 'q1', text: 'Häuser unter 500.000€', type: 'quick', metadata: { price: '<500000' } },
    { id: 'q2', text: 'Neubau mit 3+ Schlafzimmern', type: 'quick' },
    { id: 'q3', text: 'Wohnungen zur Miete', type: 'quick' },
    { id: 'q4', text: 'Häuser mit Garten', type: 'quick' },
    { id: 'q5', text: 'Luxusimmobilien', type: 'quick' },
  ]

  // Load recent searches from localStorage
  useEffect(() => {
    if (showRecentSearches && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('enhanced-recent-searches')
        if (saved) {
          setRecentSearches(JSON.parse(saved).slice(0, 5))
        }
      } catch (error) {
        console.error('Failed to load recent searches:', error)
      }
    }
  }, [showRecentSearches])

  // Save to recent searches
  const saveToRecentSearches = useCallback((suggestion: SearchSuggestion) => {
    if (typeof window === 'undefined') return

    try {
      const existing = JSON.parse(localStorage.getItem('enhanced-recent-searches') || '[]')
      const filtered = existing.filter((item: SearchSuggestion) => item.id !== suggestion.id)
      const updated = [suggestion, ...filtered].slice(0, 5)
      localStorage.setItem('enhanced-recent-searches', JSON.stringify(updated))
      setRecentSearches(updated)
    } catch (error) {
      console.error('Failed to save recent search:', error)
    }
  }, [])

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (value: string) => {
    setQuery(value)
    setIsOpen(true)
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text)
    setIsOpen(false)
    saveToRecentSearches(suggestion)
    onSuggestionSelect?.(suggestion)
    onSearch(suggestion.text, suggestion.type)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      const searchSuggestion: SearchSuggestion = {
        id: `search-${Date.now()}`,
        text: query.trim(),
        type: 'property'
      }
      saveToRecentSearches(searchSuggestion)
      onSearch(query.trim())
      setIsOpen(false)
    }
  }

  const clearQuery = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  // Filter suggestions based on query
  const filteredSuggestions = suggestions.filter(s =>
    s.text.toLowerCase().includes(query.toLowerCase())
  )

  const showQuickSearches = query.length === 0
  const showRecentSection = showRecentSearches && recentSearches.length > 0 && query.length === 0
  const showSuggestionsSection = filteredSuggestions.length > 0 && query.length > 0

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 z-10" />
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className="pl-11 pr-20 text-base h-12 border-2 border-slate-200 focus:border-orange-400 rounded-xl"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
            )}
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearQuery}
                className="h-7 w-7 p-0 hover:bg-slate-100 rounded-full"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              className="h-8 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl max-h-96 overflow-y-auto">
          {/* Quick Searches */}
          {showQuickSearches && (
            <div className="p-3">
              <div className="flex items-center gap-2 px-2 py-2 text-sm font-medium text-slate-600">
                <Zap className="h-4 w-4" />
                Schnellsuche
              </div>
              <div className="space-y-1">
                {quickSearches.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-orange-50 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                        <Search className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm text-slate-900">
                          {suggestion.text}
                        </div>
                        <div className="text-xs text-slate-500">
                          Beliebte Suche
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Searches */}
          {showRecentSection && (
            <div className="p-3 border-t border-slate-100">
              <div className="flex items-center gap-2 px-2 py-2 text-sm font-medium text-slate-600">
                <Clock className="h-4 w-4" />
                Letzte Suchen
              </div>
              <div className="space-y-1">
                {recentSearches.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                        <MapPin className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm text-slate-900">
                          {suggestion.text}
                        </div>
                        <div className="text-xs text-slate-500">
                          {suggestion.type === 'location' ? 'Ort' : 'Eigenschaft'}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Suggestions */}
          {showSuggestionsSection && (
            <div className="p-3 border-t border-slate-100">
              <div className="px-2 py-2 text-sm font-medium text-slate-600">
                Vorschläge
              </div>
              <div className="space-y-1">
                {filteredSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                          <MapPin className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm text-slate-900">
                            {highlightMatches(suggestion.text, query)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {suggestion.metadata?.city && suggestion.metadata.county && 
                              `${suggestion.metadata.city}, ${suggestion.metadata.county}`
                            }
                          </div>
                        </div>
                      </div>
                      {suggestion.metadata?.propertyCount && (
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.metadata.propertyCount.toLocaleString()}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {!isLoading && query.length > 0 && filteredSuggestions.length === 0 && !showQuickSearches && (
            <div className="p-6 text-center">
              <div className="text-slate-500 text-sm mb-2">
                Keine Vorschläge für "{query}" gefunden
              </div>
              <div className="text-slate-400 text-xs">
                Versuchen Sie einen anderen Suchbegriff oder eine Stadt
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

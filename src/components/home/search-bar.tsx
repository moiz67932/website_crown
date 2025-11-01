"use client"

import { FormEvent, useState, useRef, useEffect } from "react"
import { Search, MapPin, Home, DollarSign, Map, Loader2 } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { useRouter } from "next/navigation"
import { useAutoComplete } from "@/hooks/queries/useAutoComplete"

export default function SearchBar() {
  const [searchType, setSearchType] = useState("buy")
  const [location, setLocation] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchLocationType, setSearchLocationType] = useState("city") // New state for search location type
  const router = useRouter()
  const [searchMethod, setSearchMethod] = useState("properties") // Default to List view
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState('All')

  // Funktion zum Highlighten von übereinstimmendem Text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-semibold text-orange-800">
          {part}
        </span>
      ) : part
    );
  }

  const searchTypeOptions = [
    { value: "buy", label: "For Sale" },
    { value: "rent", label: "For Rent" },
    { value: "all", label: "All Properties" },
  ]

  // Add search method options
  const searchMethodOptions = [
    { value: "properties", label: "List", icon: <Home className="w-4 h-4 mr-1" /> },
    { value: "map", label: "Map", icon: <Map className="w-4 h-4 mr-1" /> },
  ]

  // Tab options for autocomplete
  const tabOptions = [
    { label: 'All', value: 'All' },
    { label: 'Places', value: 'city' },
    { label: 'Counties', value: 'county' },
    // { label: 'Neighborhoods', value: 'neighborhood' },
    // { label: 'Schools', value: 'school' },
    // { label: 'Buildings', value: 'building' },
    // { label: 'Agents', value: 'agent' },
  ]

  // Use the useAutoComplete hook
  const { data: autoCompleteResults, isLoading: isAutoCompleteLoading } = useAutoComplete(location)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault()
    setIsSearching(true)

    try {
      // Build query parameters
      const params = new URLSearchParams()

      if (location) {
        params.append("location", location)
        params.append("search", location) // Add search parameter for the new filter system
      }
      if (searchType && searchType !== "all") {
        params.append("searchType", searchType)
        // Map searchType to status for new filter system
        if (searchType === "buy") {
          params.append("status", "for_sale")
        } else if (searchType === "rent") {
          params.append("status", "for_rent")
        }
      }
      if (searchLocationType) {
        params.append("searchLocationType", searchLocationType)
        // Map location type to appropriate filter
        if (searchLocationType === "city") {
          params.append("city", location)
        } else if (searchLocationType === "county") {
          params.append("county", location)
        }
      }
      
      console.log('Homepage search method:', searchMethod);
      console.log('Homepage search params:', params.toString());
      
      // Navigate immediately without timeout
      if (searchMethod === "properties") {
        const url = `/properties?${params.toString()}`;
        console.log('Navigating to properties:', url);
        router.push(url);
      } else if (searchMethod === "map") {
        const url = `/map?${params.toString()}`;
        console.log('Navigating to map:', url);
        router.push(url);
      } else {
        console.error('Unknown search method:', searchMethod);
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }


  const handleAutoCompleteClick = (value: string, type: string, county?: string) => {
    setLocation(value)
    setSearchLocationType(type) // Set the search location type
    
    const params = new URLSearchParams()
    params.append("location", value)
    params.append("search", value) // Add search parameter for new filter system
    
    if (searchType && searchType !== "all") {
      params.append("searchType", searchType)
      // Map searchType to status for new filter system
      if (searchType === "buy") {
        params.append("status", "for_sale")
      } else if (searchType === "rent") {
        params.append("status", "for_rent")
      }
    }
    
    params.append("searchLocationType", type)
    
    // Map location type to appropriate filter
    if (type === "city") {
      params.append("city", value)
    } else if (type === "county") {
      if (county) {
        params.append("county", county)
      } else {
        params.append("county", value)
      }
    }
    
    console.log('Autocomplete search method:', searchMethod);
    console.log('Autocomplete search params:', params.toString());
    
    if (searchMethod === "properties") {
      const url = `/properties?${params.toString()}`;
      console.log('Autocomplete navigating to properties:', url);
      router.push(url);
    } else if (searchMethod === "map") {
      const url = `/map?${params.toString()}`;
      console.log('Autocomplete navigating to map:', url);
      router.push(url);
    } else {
      console.error('Unknown autocomplete search method:', searchMethod);
    }
  }

  return (
    <div>
      <div className="justify-center flex items-center pl-2 pb-5 pr-2">
        {searchMethodOptions.map(option => (
          <button
            key={option.value}
            type="button"
            className={`cursor-pointer flex items-center px-4 py-2 rounded-full text-base font-semibold transition-all duration-200 focus:outline-none border-2
              ${searchMethod === option.value
                ? "bg-gradient-to-r from-orange-400 to-yellow-400 text-white shadow-lg border-orange-300 transform scale-105"
                : "bg-white text-slate-700 hover:bg-orange-50 hover:text-orange-600 border-orange-200 hover:border-orange-300 hover:shadow-md"
              }`}
            onClick={() => {
              console.log('Clicked on:', option.label, 'with value:', option.value);
              console.log('Previous search method:', searchMethod);
              setSearchMethod(option.value);
              console.log('New search method set to:', option.value);
              
              // Navigate immediately based on the button clicked
              if (option.value === "properties") {
                console.log('Navigating to properties page immediately');
                router.push('/properties');
              } else if (option.value === "map") {
                console.log('Navigating to map page immediately');
                router.push('/map');
              }
            }}
            aria-pressed={searchMethod === option.value}
            style={{ marginRight: 8, marginLeft: 0, letterSpacing: 0.5 }}
          >
            <span className={`${searchMethod === option.value ? "text-white" : "text-orange-500"} mr-1 transition-colors`}>
              {option.icon}
            </span>
            <span className={`${searchMethod === option.value ? "font-bold text-white drop-shadow" : "font-semibold text-orange-600"} transition-colors`}>
              {option.label}
            </span>
          </button>
        ))}
      </div>
    <form
      onSubmit={handleSearch}
      className="flex items-center bg-white rounded-full text-left text-slate-900 border border-slate-200 shadow-sm px-4 py-2 w-full max-w-4xl"
    >
      {/* Search Type Dropdown */}
      <div className="relative flex items-center pr-2 border-r border-slate-200" ref={dropdownRef}>
        <button
          type="button"
          className="appearance-none bg-transparent font-semibold text-lg md:text-xl focus:outline-none cursor-pointer flex items-center min-w-[120px] px-1 py-1 rounded-full"
          onClick={() => setDropdownOpen(v => !v)}
          tabIndex={0}
          style={{ minWidth: '120px' }}
        >
          {searchTypeOptions.find(opt => opt.value === searchType)?.label}
          <svg className="w-5 h-5 ml-2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </button>
        {dropdownOpen && (
          <div className="absolute left-0 top-12 z-10 w-56 bg-white rounded-2xl shadow-lg border border-slate-100 py-2 animate-fade-in">
            {searchTypeOptions.map((opt, idx) => (
              <div key={opt.value}>
                <button
                  type="button"
                  className={`w-full text-left px-5 py-3 text-lg rounded-2xl font-normal hover:bg-slate-50 flex items-center justify-between ${searchType === opt.value ? 'font-semibold' : ''}`}
                  onClick={() => { setSearchType(opt.value); setDropdownOpen(false) }}
                >
                  {opt.label}
                  {searchType === opt.value && (
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                  )}
                </button>
                {idx < searchTypeOptions.length - 1 && (
                  <div className="border-t border-slate-100 mx-4" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
     
      {/* Location Input and Autocomplete */}
      <div className="flex items-center flex-1 px-3 relative">
        <MapPin className="h-5 w-5 text-slate-400 mr-2" />
        <Input
          type="text"
          value={location}
          onChange={e => setLocation(e.target.value)}
          // onKeyPress={handleKeyPress}
          placeholder="Place, City, County"
          className="bg-transparent border-0 focus:ring-0 focus:border-0 text-base md:text-lg w-full px-0"
          style={{ boxShadow: 'none' }}
        />
        {(autoCompleteResults || isAutoCompleteLoading) && location && (
          <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-lg z-10 max-h-[300px] overflow-y-auto">
            {/* Loading State */}
            {isAutoCompleteLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-orange-500 mr-2" />
                <span className="text-slate-600">Suche nach Orten...</span>
              </div>
            )}
            
            {/* Results */}
            {!isAutoCompleteLoading && autoCompleteResults && (
              <>
                {/* Tabs */}
                <div className="sticky top-0 bg-white flex border-b border-slate-100 z-20">
                  {tabOptions.map(tab => (
                    <button
                      key={tab.value}
                      className={`px-5 py-3 text-base font-semibold focus:outline-none transition-colors border-b-2 ${activeTab === tab.value ? 'border-orange-400 text-black' : 'border-transparent text-slate-500 hover:text-black'}`}
                      onClick={() => setActiveTab(tab.value)}
                      style={{ background: 'none' }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
            {/* Grouped Results */}
            <div className="py-2">
              {/* PLACES (city) */}
              {(activeTab === 'All' || activeTab === 'city') && (
                <>
                  <div className="px-6 pt-4 pb-2 text-slate-500 font-bold text-lg tracking-wide">PLACES</div>
                  {autoCompleteResults.filter(r => r.type === 'city').map((result, index) => {
                    const displayText = typeof result.value === 'string' 
                      ? result.value 
                      : (result.value as any).city + (result.value && (result.value as any).county ? ', ' + (result.value as any).county : '');
                    
                    return (
                      <div
                        key={index}
                        className="px-6 py-3 text-lg cursor-pointer hover:bg-slate-100 transition-colors"
                        onClick={() => handleAutoCompleteClick(typeof result.value === 'string' ? result.value : (result.value as any).city, 'city', typeof result.value === 'string' ? '' : (result.value as any).county)}
                      >
                        <div className="font-medium text-black">{highlightText(displayText, location)}</div>
                        <div className="text-slate-400 text-base leading-tight">Stadt</div>
                      </div>
                    );
                  })}
                </>
              )}
              {/* COUNTIES */}
              {(activeTab === 'All' || activeTab === 'county') && (
                <>
                  <div className="px-6 pt-4 pb-2 text-slate-500 font-bold text-lg tracking-wide">COUNTIES</div>
                  {autoCompleteResults.filter(r => r.type === 'county').map((result, index) => {
                    const displayText = typeof result.value === 'string' ? result.value : (result.value as any).county;
                    
                    return (
                      <div
                        key={index}
                        className="px-6 py-3 text-lg cursor-pointer hover:bg-slate-100 transition-colors"
                        onClick={() => handleAutoCompleteClick(typeof result.value === 'string' ? result.value : (result.value as any).county, 'county')}
                      >
                        <div className="font-medium text-black">{highlightText(displayText, location)}</div>
                        <div className="text-slate-400 text-base leading-tight">Landkreis</div>
                      </div>
                    );
                  })}
                </>
              )}
              
              {/* No Results */}
              {!isAutoCompleteLoading && autoCompleteResults && autoCompleteResults.length === 0 && (
                <div className="px-6 py-8 text-center">
                  <div className="text-slate-500 text-lg mb-2">Keine Ergebnisse gefunden</div>
                  <div className="text-slate-400 text-base">
                    Versuchen Sie es mit einem anderen Suchbegriff wie "Los Angeles" oder "Orange County"
                  </div>
                </div>
              )}
            </div>
              </>
            )}
          </div>
        )}
      </div>
      <button
        type="submit"
        className="flex items-center justify-center rounded-full bg-white border-0 p-2 ml-2 focus:outline-none cursor-pointer"
        disabled={isSearching}
        style={{ background: 'none' }}
      >
        <svg className="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
      </button>
    </form>
     {/* Search Method Selection */}
     
    </div>
  )
}

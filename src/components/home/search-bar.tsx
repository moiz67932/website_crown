"use client"

import { FormEvent, useState, useRef, useEffect } from "react"
import { Search, MapPin, Home, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useAutoComplete } from "@/hooks/queries/useAutoComplete"

export default function SearchBar() {
  const [searchType, setSearchType] = useState("buy")
  const [location, setLocation] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchLocationType, setSearchLocationType] = useState("city") // New state for search location type
  const router = useRouter()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState('All')

  const searchTypeOptions = [
    { value: "buy", label: "For Sale" },
    { value: "rent", label: "For Rent" },
    { value: "all", label: "All Properties" },
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
  const { data: autoCompleteResults } = useAutoComplete(location)

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

    // Build query parameters
    const params = new URLSearchParams()

    if (location) {
      params.append("location", location)
    }
    if (searchType) {
      params.append("searchType", searchType)
    }
    if (searchLocationType) {
      params.append("searchLocationType", searchLocationType)
    }

    // Simulate a network request
    setTimeout(() => {
      setIsSearching(false)
      // Redirect to map page with search parameters
      router.push(`/properties?${params.toString()}`)
    }, 1000)
  }

  // const handleKeyPress = (e: React.KeyboardEvent) => {
  //   if (e.key === 'Enter') {
  //     handleSearch(e as unknown as FormEvent)
  //   }
  // }

  const handleAutoCompleteClick = (value: string, type: string) => {
    setLocation(value)
    setSearchLocationType(type) // Set the search location type
    const params = new URLSearchParams()
    params.append("location", value)
    if (searchType) {
      params.append("searchType", searchType)
    }
    params.append("searchLocationType", type)
    router.push(`/properties?${params.toString()}`)
  }

  return (
    <form
      onSubmit={handleSearch}
      className="flex items-center bg-white rounded-full border border-slate-200 shadow-sm px-4 py-2 w-full max-w-4xl"
    >
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
        {autoCompleteResults && location && (
          <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-lg z-10 max-h-[300px] overflow-y-auto">
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
                  {autoCompleteResults.filter(r => r.type === 'city').map((result, index) => (
                    <div
                      key={index}
                      className="px-6 py-3 text-lg cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleAutoCompleteClick(typeof result.value === 'string' ? result.value : (result.value as any).city, 'city')}
                    >
                      <div className="font-medium text-black">{typeof result.value === 'string' ? result.value : (result.value as any).city + (result.value && (result.value as any).county ? ', ' + (result.value as any).county : '')}</div>
                      <div className="text-slate-400 text-base leading-tight">City</div>
                    </div>
                  ))}
                </>
              )}
              {/* COUNTIES */}
              {(activeTab === 'All' || activeTab === 'county') && (
                <>
                  <div className="px-6 pt-4 pb-2 text-slate-500 font-bold text-lg tracking-wide">COUNTIES</div>
                  {autoCompleteResults.filter(r => r.type === 'county').map((result, index) => (
                    <div
                      key={index}
                      className="px-6 py-3 text-lg cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleAutoCompleteClick(typeof result.value === 'string' ? result.value : (result.value as any).county, 'county')}
                    >
                      <div className="font-medium text-black">{typeof result.value === 'string' ? result.value : (result.value as any).county}</div>
                      <div className="text-slate-400 text-base leading-tight">County</div>
                    </div>
                  ))}
                </>
              )}
            </div>
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
  )
}

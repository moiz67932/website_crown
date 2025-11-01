"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { MapPin, Clock, Phone, Mail, ExternalLink, AlertCircle } from "lucide-react"

// Removed duplicate global declaration for window.google to avoid TS conflict

export default function OfficeLocation() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize Google Maps
    const initMap = async () => {
      if (!mapRef.current) return

      // Check if API key is available
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey || apiKey === 'your-google-maps-api-key-here') {
        setMapError('Google Maps API key is missing. Please configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env.local file.')
        setIsLoading(false)
        return
      }

      // Check if Google Maps API is already loaded
      if (window.google && window.google.maps) {
        createMap()
        return
      }

      // Load Google Maps API
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      script.async = true
      script.defer = true
      
      script.onload = () => {
        try {
          createMap()
        } catch (error) {
          console.error('Error creating map:', error)
          setMapError('Error loading Google Maps. Please check your API key.')
          setIsLoading(false)
        }
      }

      script.onerror = () => {
        setMapError('Google Maps could not be loaded. Please check your internet connection and API key.')
        setIsLoading(false)
      }

      document.head.appendChild(script)

      // Cleanup function
      return () => {
        try {
          if (document.head.contains(script)) {
            document.head.removeChild(script)
          }
        } catch (error) {
          console.warn('Script cleanup error:', error)
        }
      }
    }

    const createMap = () => {
      try {
        if (!window.google || !window.google.maps || !mapRef.current) {
          setMapError('Google Maps API is not available.')
          setIsLoading(false)
          return
        }

        // Office coordinates (San Francisco - you can change these to your actual office location)
        const officeLocation = { lat: 37.7749, lng: -122.4194 }

        const map = new window.google.maps.Map(mapRef.current, {
          center: officeLocation,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        })

        // Add marker for office location
        new window.google.maps.Marker({
          position: officeLocation,
          map,
          title: "Crown Coastal Realty Office",
          animation: window.google.maps.Animation.DROP,
        })

        setIsLoading(false)
        setMapError(null)
      } catch (error) {
        console.error('Error creating map:', error)
        setMapError('Error creating the map.')
        setIsLoading(false)
      }
    }

    initMap()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visit Our Office</CardTitle>
        <CardDescription>Stop by our office to meet with our agents in person.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative">
          <div ref={mapRef} className="h-[250px] w-full rounded-md overflow-hidden bg-slate-100"></div>
          
          {/* Loading state */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-md">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-2"></div>
                <p className="text-sm text-slate-600">Loading map...</p>
              </div>
            </div>
          )}
          
          {/* Error state */}
          {mapError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 rounded-md border-2 border-dashed border-slate-300">
              <div className="text-center p-4">
                <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm text-slate-600 mb-2">{mapError}</p>
                <a
                  href="https://maps.google.com/?q=San+Francisco,+CA+94105"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  Open in Google Maps
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-start">
            <MapPin className="h-5 w-5 text-slate-500 mr-3 mt-0.5" />
            <div>
              <h3 className="font-medium">Address</h3>
              <p className="text-slate-600">
                CA DRE #02211952
                <br />
                United States
              </p>
              <a
                href="https://maps.google.com/?q=San+Francisco,+CA+94105"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-slate-700 hover:text-slate-900 mt-1"
              >
                Get directions
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          </div>

          <div className="flex items-start">
            <Clock className="h-5 w-5 text-slate-500 mr-3 mt-0.5" />
            <div>
              <h3 className="font-medium">Business Hours</h3>
              <p className="text-slate-600">
                Monday - Friday: 9:00 AM - 6:00 PM
                <br />
                Saturday: 10:00 AM - 4:00 PM
                <br />
                Sunday: Closed
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <Phone className="h-5 w-5 text-slate-500 mr-3 mt-0.5" />
            <div>
              <h3 className="font-medium">Phone</h3>
              <p className="text-slate-600">
                <a href="tel:+14155550123" className="hover:text-slate-900">
                1 858-305-4362
                </a>
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <Mail className="h-5 w-5 text-slate-500 mr-3 mt-0.5" />
            <div>
              <h3 className="font-medium">Email</h3>
              <p className="text-slate-600">
                <a href="mailto:reza@crowncoastal.com" className="hover:text-slate-900">
                reza@crowncoastal.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

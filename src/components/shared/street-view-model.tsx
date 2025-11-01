"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Loader2, X, ViewIcon as StreetView, Maximize2, Minimize2 } from "lucide-react"

interface StreetViewModalProps {
  isOpen: boolean
  onClose: () => void
  location: {
    lat: number
    lng: number
  }
  address: string
}

declare global {
  interface Window {
    google: any
  }
}

export default function StreetViewModal({ isOpen, onClose, location, address }: StreetViewModalProps) {
  const streetViewRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [streetViewAvailable, setStreetViewAvailable] = useState(true)
  const panoramaRef = useRef<Window['google']['maps']['StreetViewPanorama'] | null>(null)

  useEffect(() => {
    if (!isOpen || !streetViewRef.current) return

    // Load Google Maps API script if it's not already loaded
    if (!window.google || !window.google.maps) {
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=streetview`
      script.async = true
      script.defer = true
      script.onload = initStreetView
      document.head.appendChild(script)
      return () => {
        document.head.removeChild(script)
      }
    } else {
      initStreetView()
    }
  }, [isOpen, location])

  const initStreetView = () => {
    if (!streetViewRef.current || !window.google) return

    setIsLoading(true)

    const streetViewService = new window.google.maps.StreetViewService()
    const position = new window.google.maps.LatLng(location.lat, location.lng)

    // Check if Street View is available at this location
    streetViewService.getPanorama(
      {
        location: position,
        radius: 50, // Look for Street View panoramas within 50 meters
        preference: window.google.maps.StreetViewPreference.NEAREST,
      },
      (data: any, status: any) => {
        if (status === window.google.maps.StreetViewStatus.OK) {
          // Street View is available, initialize the panorama
          const panoramaOptions = {
            position: data.location.latLng,
            pov: {
              heading: 34,
              pitch: 0,
            },
            zoom: 1,
            addressControl: true,
            fullscreenControl: false,
            motionTracking: false,
            motionTrackingControl: false,
            showRoadLabels: true,
          }

          panoramaRef.current = new window.google.maps.StreetViewPanorama(streetViewRef.current, panoramaOptions)
          setStreetViewAvailable(true)
        } else {
          // Street View is not available
          setStreetViewAvailable(false)
        }
        setIsLoading(false)
      },
    )
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      streetViewRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
          <DialogTitle className="text-lg">Street View: {address}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="h-8 w-8">
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="relative">
          <div
            ref={streetViewRef}
            className="w-full h-[70vh] bg-slate-100"
            style={{ minHeight: "400px", maxHeight: "70vh" }}
          ></div>

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-slate-600" />
                <p className="text-slate-600">Loading Street View...</p>
              </div>
            </div>
          )}

          {!isLoading && !streetViewAvailable && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
              <div className="text-center p-6 max-w-md">
                <StreetView className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                <h3 className="text-lg font-semibold mb-2">Street View Not Available</h3>
                <p className="text-slate-600">
                  Unfortunately, Google Street View is not available for this location. This could be due to the
                  property being in a private area or Street View coverage not being available in this region.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

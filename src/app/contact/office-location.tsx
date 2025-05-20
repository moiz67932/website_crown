"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Clock, Phone, Mail, ExternalLink } from "lucide-react"

export default function OfficeLocation() {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize Google Maps
    const initMap = async () => {
      if (!mapRef.current) return

      // Check if Google Maps API is available
      if (!window.google || !window.google.maps) {
        const script = document.createElement("script")
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
        script.async = true
        script.defer = true
        document.head.appendChild(script)

        script.onload = () => createMap()

        return () => {
          document.head.removeChild(script)
        }
      } else {
        createMap()
      }
    }

    const createMap = () => {
      if (!window.google || !mapRef.current) return

      // Example coordinates (San Francisco)
      const officeLocation = { lat: 37.7749, lng: -122.4194 }

      const map = new window.google.maps.Map(mapRef.current, {
        center: officeLocation,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      })

      // Add marker for office location
      new window.google.maps.Marker({
        position: officeLocation,
        map,
        title: "Our Office",
      })
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
        <div ref={mapRef} className="h-[250px] w-full rounded-md overflow-hidden bg-slate-100"></div>

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

"use client"

import { useState } from "react"
import { Button } from "../../../../components/ui/button"
import { ViewIcon as StreetView } from "lucide-react"
import StreetViewModal from "../../../../components/shared/street-view-model"

interface StreetViewButtonProps {
  property: {
    latitude: number
    longitude: number
    address: string
  }
}

export default function StreetViewButton({ property }: StreetViewButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      <Button variant="outline" size="icon" onClick={() => setIsOpen(true)} title="View Street View">
        <StreetView className="h-5 w-5" />
      </Button>

      {/* <StreetViewModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        location={property.location}
        address={property.address}
      /> */}
    </>
  )
}

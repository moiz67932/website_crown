"use client"

import { Button } from "../../components/ui/button"
import { MapPin, Trash2 } from "lucide-react"

interface MapDrawingControlsProps {
  isDrawingEnabled: boolean
  toggleDrawing: () => void
  clearDrawnArea: () => void
  hasDrawnArea: boolean
  propertiesCount: number
}

export default function MapDrawingControls({
  isDrawingEnabled,
  toggleDrawing,
  clearDrawnArea,
  hasDrawnArea,
  propertiesCount,
}: MapDrawingControlsProps) {
  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <div className="bg-white rounded-md shadow-md p-3">
        <h3 className="text-sm font-semibold mb-2">Draw Search Area</h3>
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant={isDrawingEnabled ? "default" : "outline"}
            className={isDrawingEnabled ? "bg-slate-800" : ""}
            onClick={toggleDrawing}
          >
            <MapPin className="h-4 w-4 mr-2" />
            {isDrawingEnabled ? "Drawing Enabled" : "Enable Drawing"}
          </Button>

          <Button size="sm" variant="outline" onClick={clearDrawnArea} disabled={!hasDrawnArea}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Area
          </Button>
        </div>

        {hasDrawnArea && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <p className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">{propertiesCount}</span> properties found in selected area
            </p>
          </div>
        )}
      </div>

      {!hasDrawnArea && !isDrawingEnabled && (
        <div className="bg-white rounded-md shadow-md p-3">
          <p className="text-xs text-slate-600">
            Draw a custom area on the map to find properties in specific regions.
          </p>
        </div>
      )}

      {isDrawingEnabled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md shadow-md p-3">
          <p className="text-xs text-yellow-800">
            <span className="font-semibold">Drawing mode active.</span> Click on the map to start drawing a polygon.
            Double-click to complete.
          </p>
        </div>
      )}
    </div>
  )
}

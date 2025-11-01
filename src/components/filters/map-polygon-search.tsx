"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Separator } from "../ui/separator"
import { 
  Square, Circle, Trash2, Undo, Edit, 
  MapPin, Target, ZoomIn, ZoomOut, RotateCcw,
  Save, Download, Upload, Eye, EyeOff
} from "lucide-react"
// Using basic HTML inputs instead of Switch/Slider components

export interface MapPolygon {
  id: string;
  name: string;
  coordinates: [number, number][]; // [lat, lng] pairs
  type: 'polygon' | 'circle' | 'rectangle';
  center?: [number, number]; // for circles
  radius?: number; // for circles in meters
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  }; // for rectangles
  style?: {
    fillColor?: string;
    strokeColor?: string;
    fillOpacity?: number;
    strokeWeight?: number;
  };
  createdAt: string;
}

export interface MapPolygonSearchProps {
  // Map instance - would be Google Maps, Mapbox, etc.
  map: any;
  onPolygonChange: (polygons: MapPolygon[]) => void;
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  savedPolygons?: MapPolygon[];
  onSavePolygon?: (polygon: MapPolygon) => void;
  maxPolygons?: number;
  enableDrawing?: boolean;
  showPropertyCounts?: boolean;
}

const DRAWING_TOOLS = [
  { id: 'polygon', label: 'Polygon', icon: Square, description: 'Draw custom area' },
  { id: 'rectangle', label: 'Rectangle', icon: Square, description: 'Draw rectangular area' },
  { id: 'circle', label: 'Circle', icon: Circle, description: 'Draw circular area' }
];

const POLYGON_STYLES = [
  { name: 'Default', fillColor: '#3b82f6', strokeColor: '#1d4ed8', fillOpacity: 0.2 },
  { name: 'Green', fillColor: '#10b981', strokeColor: '#059669', fillOpacity: 0.2 },
  { name: 'Red', fillColor: '#ef4444', strokeColor: '#dc2626', fillOpacity: 0.2 },
  { name: 'Purple', fillColor: '#8b5cf6', strokeColor: '#7c3aed', fillOpacity: 0.2 },
  { name: 'Orange', fillColor: '#f59e0b', strokeColor: '#d97706', fillOpacity: 0.2 }
];

export default function MapPolygonSearch({
  map,
  onPolygonChange,
  onBoundsChange,
  savedPolygons = [],
  onSavePolygon,
  maxPolygons = 5,
  enableDrawing = true,
  showPropertyCounts = true
}: MapPolygonSearchProps) {
  
  const [activePolygons, setActivePolygons] = useState<MapPolygon[]>([]);
  const [drawingMode, setDrawingMode] = useState<string | null>(null);
  const [selectedPolygon, setSelectedPolygon] = useState<string | null>(null);
  const [showSavedAreas, setShowSavedAreas] = useState(true);
  const [polygonOpacity, setPolygonOpacity] = useState([0.2]);
  const [showPolygonLabels, setShowPolygonLabels] = useState(true);
  
  // Drawing state
  const drawingManagerRef = useRef<any>(null);
  const polygonRefs = useRef<Map<string, any>>(new Map());

  // Initialize drawing manager (Google Maps example)
  useEffect(() => {
    if (!map || !enableDrawing) return;

    // This would be the actual Google Maps Drawing Manager initialization
    // const drawingManager = new google.maps.drawing.DrawingManager({
    //   drawingMode: null,
    //   drawingControl: false,
    //   polygonOptions: {
    //     fillColor: '#3b82f6',
    //     fillOpacity: 0.2,
    //     strokeWeight: 2,
    //     strokeColor: '#1d4ed8',
    //     editable: true,
    //     draggable: true
    //   }
    // });
    
    // drawingManager.setMap(map);
    // drawingManagerRef.current = drawingManager;

    // Mock implementation for demo
    drawingManagerRef.current = {
      setDrawingMode: (mode: string | null) => console.log('Drawing mode:', mode),
      setMap: (map: any) => console.log('Set map:', map)
    };

    return () => {
      if (drawingManagerRef.current) {
        // drawingManagerRef.current.setMap(null);
      }
    };
  }, [map, enableDrawing]);

  // Handle drawing tool selection
  const handleDrawingModeChange = useCallback((mode: string | null) => {
    setDrawingMode(mode);
    if (drawingManagerRef.current) {
      // drawingManagerRef.current.setDrawingMode(mode);
    }
  }, []);

  // Mock function to create a polygon (replace with actual map implementation)
  const createPolygon = useCallback((type: 'polygon' | 'circle' | 'rectangle') => {
    // Mock coordinates for demo
    const mockCoordinates: [number, number][] = [
      [34.0522, -118.2437],
      [34.0622, -118.2337],
      [34.0722, -118.2437],
      [34.0622, -118.2537]
    ];

    const newPolygon: MapPolygon = {
      id: `polygon-${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${activePolygons.length + 1}`,
      coordinates: mockCoordinates,
      type,
      style: POLYGON_STYLES[0],
      createdAt: new Date().toISOString()
    };

    const updatedPolygons = [...activePolygons, newPolygon];
    setActivePolygons(updatedPolygons);
    onPolygonChange(updatedPolygons);
    setDrawingMode(null);
  }, [activePolygons, onPolygonChange]);

  // Remove polygon
  const removePolygon = useCallback((polygonId: string) => {
    const updatedPolygons = activePolygons.filter(p => p.id !== polygonId);
    setActivePolygons(updatedPolygons);
    onPolygonChange(updatedPolygons);
    
    // Remove from map
    const polygonRef = polygonRefs.current.get(polygonId);
    if (polygonRef) {
      // polygonRef.setMap(null);
      polygonRefs.current.delete(polygonId);
    }
  }, [activePolygons, onPolygonChange]);

  // Clear all polygons
  const clearAllPolygons = useCallback(() => {
    // Remove all from map
    polygonRefs.current.forEach(polygonRef => {
      // polygonRef.setMap(null);
    });
    polygonRefs.current.clear();
    
    setActivePolygons([]);
    onPolygonChange([]);
  }, [onPolygonChange]);

  // Load saved polygon
  const loadSavedPolygon = useCallback((savedPolygon: MapPolygon) => {
    if (activePolygons.length >= maxPolygons) return;
    
    // Use a more deterministic ID generation to avoid hydration issues
    const loadedPolygon = {
      ...savedPolygon,
      id: `loaded-${savedPolygon.id}-${activePolygons.length}` // New ID to avoid conflicts
    };
    
    const updatedPolygons = [...activePolygons, loadedPolygon];
    setActivePolygons(updatedPolygons);
    onPolygonChange(updatedPolygons);
  }, [activePolygons, maxPolygons, onPolygonChange]);

  // Update polygon style
  const updatePolygonStyle = useCallback((polygonId: string, style: Partial<MapPolygon['style']>) => {
    const updatedPolygons = activePolygons.map(polygon => 
      polygon.id === polygonId 
        ? { ...polygon, style: { ...polygon.style, ...style } }
        : polygon
    );
    setActivePolygons(updatedPolygons);
    onPolygonChange(updatedPolygons);
  }, [activePolygons, onPolygonChange]);

  // Calculate area (mock implementation)
  const calculateArea = useCallback((polygon: MapPolygon): string => {
    // This would use the actual map's geometry library
    // return google.maps.geometry.spherical.computeArea(polygon.getPath());
    return "2.5 sq mi"; // Mock value
  }, []);

  // Get property count in area (mock implementation)
  const getPropertyCount = useCallback((polygon: MapPolygon): number => {
    // This would query properties within the polygon
    // Use deterministic value based on polygon coordinates to avoid hydration issues
    const coordSum = polygon.coordinates.reduce((sum, coord) => sum + coord[0] + coord[1], 0);
    return Math.floor(coordSum % 500) + 50; // Mock value based on coordinates
  }, []);

  // Export polygons
  const exportPolygons = useCallback(() => {
    const dataStr = JSON.stringify(activePolygons, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `search-areas-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [activePolygons]);

  return (
    <div className="space-y-4">
      
      {/* Drawing Tools */}
      {enableDrawing && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Draw Search Areas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Drawing Mode Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {DRAWING_TOOLS.map((tool) => {
                const Icon = tool.icon;
                const isActive = drawingMode === tool.id;
                
                return (
                  <Button
                    key={tool.id}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (isActive) {
                        handleDrawingModeChange(null);
                      } else {
                        handleDrawingModeChange(tool.id);
                        // For demo, create polygon immediately
                        setTimeout(() => createPolygon(tool.id as any), 100);
                      }
                    }}
                    disabled={activePolygons.length >= maxPolygons}
                    className="h-auto p-3 flex flex-col items-center gap-1"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{tool.label}</span>
                  </Button>
                );
              })}
            </div>

            {/* Status */}
            <div className="text-sm text-slate-600 text-center">
              {drawingMode ? (
                `Click on the map to draw a ${drawingMode}`
              ) : (
                `${activePolygons.length}/${maxPolygons} areas created`
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllPolygons}
                disabled={activePolygons.length === 0}
                className="flex-1"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportPolygons}
                disabled={activePolygons.length === 0}
              >
                <Download className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Polygons */}
      {activePolygons.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Active Search Areas
              </div>
              <Badge variant="secondary">{activePolygons.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            
            {/* Display Options */}
            <div className="space-y-3 border-b pb-3">
              <div className="flex items-center justify-between">
                <label htmlFor="show-labels" className="text-sm">Show Labels</label>
                <input
                  id="show-labels"
                  type="checkbox"
                  checked={showPolygonLabels}
                  onChange={(e) => setShowPolygonLabels(e.target.checked)}
                  className="rounded"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm">Opacity</label>
                <input
                  type="range"
                  min={0.1}
                  max={0.8}
                  step={0.1}
                  value={polygonOpacity[0]}
                  onChange={(e) => setPolygonOpacity([parseFloat(e.target.value)])}
                  className="w-full"
                />
              </div>
            </div>

            {/* Polygon List */}
            {activePolygons.map((polygon, index) => (
              <div key={polygon.id} className="border rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: polygon.style?.fillColor || '#3b82f6' }}
                    />
                    <span className="font-medium text-sm">{polygon.name}</span>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPolygon(
                        selectedPolygon === polygon.id ? null : polygon.id
                      )}
                      className="h-6 w-6 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePolygon(polygon.id)}
                      className="h-6 w-6 p-0 text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Polygon Stats */}
                <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
                  <div>
                    <span className="font-medium">Area:</span>
                    <span className="ml-1">{calculateArea(polygon)}</span>
                  </div>
                  {showPropertyCounts && (
                    <div>
                      <span className="font-medium">Properties:</span>
                      <span className="ml-1">{getPropertyCount(polygon)}</span>
                    </div>
                  )}
                </div>

                {/* Style Editor */}
                {selectedPolygon === polygon.id && (
                  <div className="border-t pt-2 space-y-2">
                    <div className="grid grid-cols-5 gap-1">
                      {POLYGON_STYLES.map((style, styleIndex) => (
                        <button
                          key={styleIndex}
                          className="w-full h-6 rounded border-2 border-white hover:border-slate-300"
                          style={{ backgroundColor: style.fillColor }}
                          onClick={() => updatePolygonStyle(polygon.id, style)}
                        />
                      ))}
                    </div>
                    
                    {onSavePolygon && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSavePolygon(polygon)}
                        className="w-full"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Save Area
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Saved Areas */}
      {savedPolygons.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Saved Areas
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showSavedAreas}
                  onChange={(e) => setShowSavedAreas(e.target.checked)}
                  className="rounded"
                />
                <Badge variant="outline">{savedPolygons.length}</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          
          {showSavedAreas && (
            <CardContent className="space-y-2">
              {savedPolygons.slice(0, 5).map((savedPolygon) => (
                <div key={savedPolygon.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded"
                      style={{ backgroundColor: savedPolygon.style?.fillColor || '#3b82f6' }}
                    />
                    <span className="text-sm">{savedPolygon.name}</span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadSavedPolygon(savedPolygon)}
                    disabled={activePolygons.length >= maxPolygons}
                  >
                    Load
                  </Button>
                </div>
              ))}
              
              {savedPolygons.length > 5 && (
                <div className="text-center">
                  <Button variant="ghost" size="sm">
                    View All ({savedPolygons.length - 5} more)
                  </Button>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Map Controls */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Map Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm">
              <ZoomIn className="h-3 w-3 mr-1" />
              Zoom In
            </Button>
            <Button variant="outline" size="sm">
              <ZoomOut className="h-3 w-3 mr-1" />
              Zoom Out
            </Button>
            <Button variant="outline" size="sm">
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset View
            </Button>
            <Button variant="outline" size="sm">
              <Target className="h-3 w-3 mr-1" />
              My Location
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
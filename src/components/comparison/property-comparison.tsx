"use client"

import React, { useState, useRef, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Property } from '@/interfaces'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Separator } from '../ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  X, 
  Plus, 
  Home, 
  MapPin, 
  DollarSign, 
  Calculator,
  Star,
  Bed,
  Bath,
  Square,
  Car,
  Calendar,
  TrendingUp,
  Award,
  Shield,
  Wifi,
  Snowflake,
  Flame,
  Droplets,
  Building,
  Trees,
  School,
  ShoppingCart,
  Hospital,
  Train
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface ComparisonSlot {
  id: string
  property: Property | null
}

interface PropertyComparisonProps {
  initialProperties?: Property[]
  onPropertyRemove?: (propertyId: string) => void
  onPropertyAdd?: () => void
}

// Mortgage Calculator Component
const MortgageCalculator: React.FC<{ property: Property }> = ({ property }) => {
  const [downPayment, setDownPayment] = useState(20)
  const [interestRate, setInterestRate] = useState(6.5)
  const [loanTerm, setLoanTerm] = useState(30)

  const calculateMortgage = () => {
    const principal = property.list_price * (1 - downPayment / 100)
    const monthlyRate = interestRate / 100 / 12
    const numberOfPayments = loanTerm * 12
    
    const monthlyPayment = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
    
    return {
      monthlyPayment: monthlyPayment || 0,
      totalInterest: (monthlyPayment * numberOfPayments) - principal || 0,
      totalCost: monthlyPayment * numberOfPayments || 0
    }
  }

  const mortgage = calculateMortgage()

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-neutral-600">Down Payment %</label>
          <input 
            type="number" 
            value={downPayment}
            onChange={(e) => setDownPayment(Number(e.target.value))}
            className="w-full text-xs border rounded px-2 py-1"
            min="0" 
            max="100"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-600">Interest Rate %</label>
          <input 
            type="number" 
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="w-full text-xs border rounded px-2 py-1"
            step="0.1"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-600">Loan Term (years)</label>
          <input 
            type="number" 
            value={loanTerm}
            onChange={(e) => setLoanTerm(Number(e.target.value))}
            className="w-full text-xs border rounded px-2 py-1"
          />
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>Monthly Payment:</span>
          <span className="font-semibold">${mortgage.monthlyPayment.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between text-xs text-neutral-600">
          <span>Total Interest:</span>
          <span>${mortgage.totalInterest.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
        </div>
      </div>
    </div>
  )
}

// Neighborhood Score Component
const NeighborhoodScore: React.FC<{ property: Property }> = ({ property }) => {
  // Mock neighborhood data - in real app, this would come from an API
  const getNeighborhoodScore = (property: Property) => {
    const mockScores = {
      walkability: Math.floor(Math.random() * 40) + 60, // 60-100
      transitScore: Math.floor(Math.random() * 50) + 50, // 50-100  
      bikeScore: Math.floor(Math.random() * 40) + 40, // 40-80
      safetyScore: Math.floor(Math.random() * 30) + 70, // 70-100
      schoolRating: Math.floor(Math.random() * 4) + 7, // 7-10
      amenities: Math.floor(Math.random() * 30) + 70 // 70-100
    }
    return mockScores
  }

  const scores = getNeighborhoodScore(property)

  const ScoreBar: React.FC<{ score: number; maxScore?: number }> = ({ score, maxScore = 100 }) => (
    <div className="w-full bg-neutral-200 rounded-full h-2">
      <div 
        className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
        style={{ width: `${(score / maxScore) * 100}%` }}
      />
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Wifi className="h-3 w-3 text-blue-500" />
            <span className="text-xs">Walkability</span>
          </div>
          <span className="text-xs font-semibold">{scores.walkability}/100</span>
        </div>
        <ScoreBar score={scores.walkability} />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Train className="h-3 w-3 text-purple-500" />
            <span className="text-xs">Transit Score</span>
          </div>
          <span className="text-xs font-semibold">{scores.transitScore}/100</span>
        </div>
        <ScoreBar score={scores.transitScore} />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="h-3 w-3 text-green-500" />
            <span className="text-xs">Safety Score</span>
          </div>
          <span className="text-xs font-semibold">{scores.safetyScore}/100</span>
        </div>
        <ScoreBar score={scores.safetyScore} />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <School className="h-3 w-3 text-orange-500" />
            <span className="text-xs">School Rating</span>
          </div>
          <span className="text-xs font-semibold">{scores.schoolRating}/10</span>
        </div>
        <ScoreBar score={scores.schoolRating} maxScore={10} />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-3 w-3 text-pink-500" />
            <span className="text-xs">Amenities</span>
          </div>
          <span className="text-xs font-semibold">{scores.amenities}/100</span>
        </div>
        <ScoreBar score={scores.amenities} />
      </div>
    </div>
  )
}

// Sortable Item Component
function SortablePropertySlot({ 
  slot, 
  index, 
  onRemove 
}: { 
  slot: ComparisonSlot, 
  index: number, 
  onRemove: (slotId: string) => void 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slot.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getImageSrc = (property: Property) => {
    const getPropertyFallbackImage = (propertyType: string, price: number, listingKey?: string) => {
      const propertyImages = [
        "/luxury-modern-house-exterior.png",
        "/modern-beach-house.png", 
        "/modern-ocean-living.png",
        "/luxury-master-bedroom.png",
        "/california-coastal-sunset.png",
        "/san-diego-bay-sunset.png",
        "/los.jpg",
        "/san-fan.jpg"
      ]

      let imageIndex = 0
      const varietyFactor = listingKey ? parseInt(listingKey.slice(-1)) || 0 : 0
      
      if (propertyType?.toLowerCase().includes('lease') || propertyType?.toLowerCase().includes('rent')) {
        imageIndex = (1 + varietyFactor) % 4
      } else if (price > 800000) {
        imageIndex = varietyFactor % 2 === 0 ? 0 : 2
      } else if (price > 500000) {
        imageIndex = (2 + varietyFactor) % 6
      } else if (price > 300000) {
        imageIndex = (1 + varietyFactor) % 5
      } else {
        imageIndex = varietyFactor % 8
      }

      return propertyImages[imageIndex] || "/california-coastal-sunset.png"
    }

    return property.images?.[0] ||
      (property as any).media_urls?.[0] ||
      (property as any).main_photo_url ||
      property.main_image_url ||
      property.main_image ||
      property.photo_url ||
      property.listing_photos?.[0] ||
      getPropertyFallbackImage(property.property_type, property.list_price, property.listing_key)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="min-h-[300px] transition-all duration-200"
    >
      {slot.property ? (
        <Card className="h-full relative group hover:shadow-lg transition-all duration-300">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onRemove(slot.id)}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="relative h-40 rounded-t-lg overflow-hidden">
            <Image
              src={getImageSrc(slot.property)}
              alt={slot.property.address}
              fill
              className="object-cover"
            />
            <Badge className="absolute top-2 left-2">
              {slot.property.property_type === 'ResidentialLease' ? 'FOR RENT' : 'FOR SALE'}
            </Badge>
          </div>
          
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-2 line-clamp-2">
              {slot.property.address}
            </h3>
            <p className="text-xs text-neutral-600 mb-2">
              {slot.property.city}, {slot.property.county}
            </p>
            <p className="text-lg font-bold text-primary">
              ${slot.property.list_price.toLocaleString()}
            </p>
            <div className="flex justify-between text-xs text-neutral-600 mt-2">
              <span>{slot.property.bedrooms} beds</span>
              <span>{slot.property.bathrooms} baths</span>
              <span>{slot.property.living_area_sqft} sqft</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="h-full border-2 border-dashed border-neutral-300 bg-neutral-50 hover:border-primary hover:bg-primary/5 transition-all duration-300 cursor-pointer group">
          <CardContent className="h-full flex flex-col items-center justify-center p-4">
            <div className="text-neutral-400 group-hover:text-primary transition-colors">
              <Plus className="h-12 w-12 mb-2 mx-auto" />
              <p className="text-sm text-center">
                Drag property here or click to add
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function PropertyComparison({ 
  initialProperties = [], 
  onPropertyRemove,
  onPropertyAdd 
}: PropertyComparisonProps) {
  const [comparisonSlots, setComparisonSlots] = useState<ComparisonSlot[]>(() => {
    const slots: ComparisonSlot[] = []
    for (let i = 0; i < 4; i++) {
      slots.push({
        id: `slot-${i}`,
        property: initialProperties[i] || null
      })
    }
    return slots
  })

  const tableHeaderRef = useRef<HTMLDivElement>(null)
  const [isHeaderSticky, setIsHeaderSticky] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle scroll for sticky headers
  useEffect(() => {
    const handleScroll = () => {
      if (tableHeaderRef.current) {
        const rect = tableHeaderRef.current.getBoundingClientRect()
        setIsHeaderSticky(rect.top <= 0)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setComparisonSlots((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id)
        const newIndex = items.findIndex(item => item.id === over?.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const removeProperty = (slotId: string) => {
    setComparisonSlots(slots => 
      slots.map(slot => 
        slot.id === slotId 
          ? { ...slot, property: null }
          : slot
      )
    )
  }

  const addProperty = (slotId: string, property: Property) => {
    setComparisonSlots(slots => 
      slots.map(slot => 
        slot.id === slotId 
          ? { ...slot, property }
          : slot
      )
    )
  }

  const getPricePerSqft = (property: Property) => {
    const sqft = typeof property.living_area_sqft === 'number' 
      ? property.living_area_sqft 
      : parseInt(property.living_area_sqft?.toString() || '0')
    return sqft > 0 ? property.list_price / sqft : 0
  }

  const ComparisonRow: React.FC<{
    label: string
    icon: React.ReactNode
    values: (string | number | React.ReactNode)[]
    className?: string
  }> = ({ label, icon, values, className }) => (
    <div className={cn("border-b border-neutral-100 py-4", className)}>
      <div className="grid grid-cols-5 gap-4 items-center">
        <div className="flex items-center gap-2 font-medium text-neutral-700">
          {icon}
          <span className="text-sm">{label}</span>
        </div>
        {values.map((value, index) => (
          <div key={index} className="text-sm text-neutral-600 text-center">
            {value || '-'}
          </div>
        ))}
      </div>
    </div>
  )

  const SectionHeader: React.FC<{ title: string; icon: React.ReactNode }> = ({ title, icon }) => (
    <div className="flex items-center gap-2 py-3 text-lg font-semibold text-neutral-800 bg-neutral-50 px-4 rounded-lg mb-4">
      {icon}
      <span>{title}</span>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Property Comparison</h1>
        <p className="text-neutral-600">Compare up to 4 properties side by side</p>
      </div>

      {/* Drag & Drop Property Cards */}
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={comparisonSlots.map(slot => slot.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="grid grid-cols-4 gap-4 mb-8 p-4 rounded-xl bg-neutral-50">
            {comparisonSlots.map((slot, index) => (
              <SortablePropertySlot
                key={slot.id}
                slot={slot}
                index={index}
                onRemove={removeProperty}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Comparison Table */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        {/* Sticky Header */}
        <div 
          ref={tableHeaderRef}
          className={cn(
            "transition-all duration-200 z-10",
            isHeaderSticky ? "sticky top-0 shadow-md" : ""
          )}
        >
          <div className="grid grid-cols-5 gap-4 p-4 bg-white border-b">
            <div className="font-semibold text-neutral-700">Property Details</div>
            {comparisonSlots.map((slot, index) => (
              <div key={index} className="text-center">
                {slot.property ? (
                  <div className="text-sm">
                    <p className="font-medium line-clamp-1">{slot.property.address}</p>
                    <p className="text-xs text-neutral-500">{slot.property.city}</p>
                  </div>
                ) : (
                  <span className="text-neutral-400 text-sm">Empty Slot</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4">
          {/* Basic Information */}
          <SectionHeader title="Basic Information" icon={<Home className="h-5 w-5" />} />
          
          <ComparisonRow
            label="Price"
            icon={<DollarSign className="h-4 w-4 text-green-500" />}
            values={comparisonSlots.map(slot => 
              slot.property ? `$${slot.property.list_price.toLocaleString()}` : '-'
            )}
          />

          <ComparisonRow
            label="Price per sq ft"
            icon={<Calculator className="h-4 w-4 text-blue-500" />}
            values={comparisonSlots.map(slot => 
              slot.property ? `$${getPricePerSqft(slot.property).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '-'
            )}
          />

          <ComparisonRow
            label="Property Type"
            icon={<Building className="h-4 w-4 text-purple-500" />}
            values={comparisonSlots.map(slot => 
              slot.property ? slot.property.property_type : '-'
            )}
          />

          <ComparisonRow
            label="Status"
            icon={<Award className="h-4 w-4 text-orange-500" />}
            values={comparisonSlots.map(slot => 
              slot.property ? (
                <Badge variant={slot.property.property_type === 'ResidentialLease' ? 'destructive' : 'default'}>
                  {slot.property.property_type === 'ResidentialLease' ? 'FOR RENT' : 'FOR SALE'}
                </Badge>
              ) : '-'
            )}
          />

          {/* Features */}
          <SectionHeader title="Features" icon={<Star className="h-5 w-5" />} />
          
          <ComparisonRow
            label="Bedrooms"
            icon={<Bed className="h-4 w-4 text-indigo-500" />}
            values={comparisonSlots.map(slot => 
              slot.property ? slot.property.bedrooms : '-'
            )}
          />

          <ComparisonRow
            label="Bathrooms"
            icon={<Bath className="h-4 w-4 text-cyan-500" />}
            values={comparisonSlots.map(slot => 
              slot.property ? slot.property.bathrooms : '-'
            )}
          />

          <ComparisonRow
            label="Living Area"
            icon={<Square className="h-4 w-4 text-amber-500" />}
            values={comparisonSlots.map(slot => 
              slot.property ? `${slot.property.living_area_sqft} sq ft` : '-'
            )}
          />

          <ComparisonRow
            label="Lot Size"
            icon={<Trees className="h-4 w-4 text-green-600" />}
            values={comparisonSlots.map(slot => 
              slot.property ? `${slot.property.lot_size_sqft} sq ft` : '-'
            )}
          />

          {/* Location */}
          <SectionHeader title="Location" icon={<MapPin className="h-5 w-5" />} />
          
          <ComparisonRow
            label="Address"
            icon={<MapPin className="h-4 w-4 text-red-500" />}
            values={comparisonSlots.map(slot => 
              slot.property ? slot.property.address : '-'
            )}
          />

          <ComparisonRow
            label="City"
            icon={<Building className="h-4 w-4 text-blue-600" />}
            values={comparisonSlots.map(slot => 
              slot.property ? slot.property.city : '-'
            )}
          />

          <ComparisonRow
            label="County"
            icon={<MapPin className="h-4 w-4 text-gray-500" />}
            values={comparisonSlots.map(slot => 
              slot.property ? slot.property.county : '-'
            )}
          />

          <ComparisonRow
            label="ZIP Code"
            icon={<MapPin className="h-4 w-4 text-purple-600" />}
            values={comparisonSlots.map(slot => 
              slot.property ? slot.property.zip_code : '-'
            )}
          />

          {/* Financial Analysis */}
          <SectionHeader title="Financial Analysis" icon={<TrendingUp className="h-5 w-5" />} />
          
          <ComparisonRow
            label="Mortgage Calculator"
            icon={<Calculator className="h-4 w-4 text-green-600" />}
            values={comparisonSlots.map(slot => 
              slot.property ? <MortgageCalculator property={slot.property} /> : '-'
            )}
            className="py-6"
          />

          {/* Neighborhood Scores */}
          <SectionHeader title="Neighborhood Scores" icon={<Award className="h-5 w-5" />} />
          
          <ComparisonRow
            label="Neighborhood Analysis"
            icon={<Star className="h-4 w-4 text-yellow-500" />}
            values={comparisonSlots.map(slot => 
              slot.property ? <NeighborhoodScore property={slot.property} /> : '-'
            )}
            className="py-6"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mt-8">
        <Button onClick={onPropertyAdd} variant="outline" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Properties to Compare
        </Button>
        <Button 
          onClick={() => window.print()} 
          variant="default" 
          className="flex items-center gap-2"
        >
          <Droplets className="h-4 w-4" />
          Export Comparison
        </Button>
      </div>
    </div>
  )
}

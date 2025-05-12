import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { MapPin, Bed, Bath, Maximize, Calendar, Heart, Share2, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import PropertyGallery from "./property-gallery"
import PropertyMap from "./property-map"
import ContactForm from "./contact-form"
import SimilarProperties from "./similar-properties"

export const metadata: Metadata = {
  title: "Property Details | Real Estate",
  description: "View detailed information about this property",
}

// This would typically come from a database or API
const propertyData = {
  id: "123",
  title: "Modern Luxury Villa with Ocean View",
  address: "123 Coastal Drive, Malibu, CA 90265",
  price: 2750000,
  status: "For Sale",
  bedrooms: 4,
  bathrooms: 3.5,
  area: 3200,
  yearBuilt: 2019,
  description:
    "This stunning modern villa offers breathtaking ocean views from nearly every room. Featuring an open floor plan with floor-to-ceiling windows, a gourmet kitchen with top-of-the-line appliances, and a spacious primary suite with a luxurious bathroom. The outdoor space includes a heated infinity pool, outdoor kitchen, and multiple terraces perfect for entertaining.",
  features: [
    "Ocean View",
    "Infinity Pool",
    "Smart Home System",
    "Gourmet Kitchen",
    "Home Theater",
    "Wine Cellar",
    "Outdoor Kitchen",
    "EV Charging Station",
    "Solar Panels",
    "Security System",
  ],
  images: [
    "/luxury-modern-house-exterior.png",
    "/canyon-village-storage/image3.png",
    "/modern-ocean-living.png",
    "/luxury-master-bedroom.png",
    "/placeholder.svg?key=3iszn",
  ],
  agent: {
    name: "Sarah Johnson",
    phone: "(310) 555-1234",
    email: "sarah@realestate.com",
    image: "/professional-real-estate-agent.png",
  },
  location: {
    lat: 34.0259,
    lng: -118.7798,
  },
}

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  // In a real app, you would fetch the property data based on the ID
  // const { data: property } = await getPropertyById(params.id)

  const property = propertyData

  return (
    <main className="container mx-auto px-4 py-8 pt-16">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-muted-foreground mb-4">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/properties" className="hover:text-primary">
          Properties
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{property.title}</span>
      </div>

      {/* Property Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200">
              {property.status}
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">
              New Listing
            </Badge>
          </div>
          <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
          <div className="flex items-center text-muted-foreground mb-2">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{property.address}</span>
          </div>
          <div className="flex flex-wrap gap-4 mt-3">
            <div className="flex items-center">
              <Bed className="h-5 w-5 mr-2 text-muted-foreground" />
              <span>
                <strong>{property.bedrooms}</strong> Beds
              </span>
            </div>
            <div className="flex items-center">
              <Bath className="h-5 w-5 mr-2 text-muted-foreground" />
              <span>
                <strong>{property.bathrooms}</strong> Baths
              </span>
            </div>
            <div className="flex items-center">
              <Maximize className="h-5 w-5 mr-2 text-muted-foreground" />
              <span>
                <strong>{property.area.toLocaleString()}</strong> Sq Ft
              </span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
              <span>
                Built <strong>{property.yearBuilt}</strong>
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-3xl font-bold text-primary">${property.price.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">
            Est. ${Math.round(property.price / 360).toLocaleString()}/mo
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="icon">
              <Heart className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Property Gallery */}
      <PropertyGallery images={property.images} />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="details">
            <TabsList className="mb-6">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Property Description</h2>
                  <p className="text-muted-foreground leading-relaxed">{property.description}</p>

                  <h3 className="text-lg font-semibold mt-6 mb-3">Property Details</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Property Type</p>
                      <p className="font-medium">Single Family</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Year Built</p>
                      <p className="font-medium">{property.yearBuilt}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lot Size</p>
                      <p className="font-medium">0.5 Acres</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Heating</p>
                      <p className="font-medium">Central</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cooling</p>
                      <p className="font-medium">Central A/C</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Parking</p>
                      <p className="font-medium">2-Car Garage</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Property Features</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {property.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-primary mr-2"></div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="location">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Location</h2>
                  <PropertyMap location={property.location} address={property.address} />

                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">Nearby Amenities</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium">Schools</h4>
                        <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                          <li>Malibu Elementary School (0.8 miles)</li>
                          <li>Malibu Middle School (1.2 miles)</li>
                          <li>Malibu High School (1.5 miles)</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium">Transportation</h4>
                        <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                          <li>Pacific Coast Highway (0.3 miles)</li>
                          <li>Bus Stop (0.4 miles)</li>
                          <li>Santa Monica Airport (15 miles)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          {/* Agent Contact Card */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Image
                  src={property.agent.image || "/placeholder.svg"}
                  alt={property.agent.name}
                  width={60}
                  height={60}
                  className="rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold">{property.agent.name}</h3>
                  <p className="text-sm text-muted-foreground">Listing Agent</p>
                </div>
              </div>
              <Separator className="my-4" />
              <ContactForm agentEmail={property.agent.email} propertyId={property.id} />
            </CardContent>
          </Card>

          {/* Mortgage Calculator Card */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Mortgage Calculator</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Home Price</p>
                  <div className="font-medium">${property.price.toLocaleString()}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Down Payment (20%)</p>
                  <div className="font-medium">${(property.price * 0.2).toLocaleString()}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Loan Amount</p>
                  <div className="font-medium">${(property.price * 0.8).toLocaleString()}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Estimated Monthly Payment</p>
                  <div className="font-medium">${Math.round(property.price / 360).toLocaleString()}/month</div>
                </div>
                <Button className="w-full">Full Calculator</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Similar Properties */}
      <section className="mt-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Similar Properties</h2>
          <Link href="/properties" className="text-primary flex items-center hover:underline">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <SimilarProperties currentPropertyId={property.id} />
      </section>
    </main>
  )
}

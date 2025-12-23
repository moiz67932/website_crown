"use client"

import Link from "next/link"
import Script from "next/script"
import { MapPin, Bed, Bath, Maximize, Calendar, Heart, Share2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import PropertyGallery from "./property-gallery"
import PropertyMap from "./property-map"
import ContactForm from "../../../../components/contact-form"
import StreetViewButton from "./street-view-button"
import PropertyFAQ from "./property-faq"
import MortgageCalculatorModal from "./mortage-calculator-modal"

interface PropertyDetailClientPageProps {
  property: any;
  propertyId: string;
}

export default function PropertyDetailClientPage({ property, propertyId }: PropertyDetailClientPageProps) {
  const faqs = property?.faq_content ? JSON.parse(property.faq_content) : []

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property?.seo_title || property?.address || "Unknown Address",
    description: property?.meta_description || property?.public_remarks || "No description available",
    image: property?.images?.[0] || [],
    url: `/properties/property/${propertyId}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: property?.address?.split(",")[0]?.trim() || "",
      addressLocality: property?.city || "",
      addressRegion: property?.state || "",
      postalCode: property?.postal_code || "",
      addressCountry: "US",
    },
    numberOfRooms: property?.bedrooms,
    numberOfBathroomsTotal: property?.bathrooms,
    floorSize: {
      "@type": "QuantitativeValue",
      value: property?.living_area_sqft ?? property?.lot_size_sqft,
      unitCode: "FTK",
    },
    price: property?.list_price,
    priceCurrency: "USD",
    offers: {
      "@type": "Offer",
      price: property?.list_price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    yearBuilt: property?.year_built,
    amenityFeature: property?.LotFeatures?.map((feature: string) => ({
      "@type": "LocationFeatureSpecification",
      name: feature,
    })),
    geo: {
      "@type": "GeoCoordinates",
      latitude: property?.latitude,
      longitude: property?.longitude,
    },
  }

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Properties",
        item: "/properties",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: property?.address || "Unknown Address",
        item: `/properties/property/${propertyId}`,
      },
    ],
  }

  return (
    <>
      <Script id="property-structured-data" type="application/ld+json">
        {JSON.stringify(structuredData)}
      </Script>
      <Script id="breadcrumb-structured-data" type="application/ld+json">
        {JSON.stringify(breadcrumbData)}
      </Script>

      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol
            className="flex items-center text-sm text-muted-foreground"
            itemScope
            itemType="https://schema.org/BreadcrumbList"
          >
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link href="/" className="hover:text-primary" itemProp="item">
                <span itemProp="name">Home</span>
              </Link>
              <meta itemProp="position" content="1" />
            </li>
            <span className="mx-2">/</span>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link href="/properties" className="hover:text-primary" itemProp="item">
                <span itemProp="name">Properties</span>
              </Link>
              <meta itemProp="position" content="2" />
            </li>
            <span className="mx-2">/</span>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem" className="text-foreground">
              <span itemProp="name">{property?.title || property?.address || "Unknown Address"}</span>
              <meta itemProp="position" content="3" />
            </li>
          </ol>
        </nav>

        <article itemScope itemType="https://schema.org/RealEstateListing">
          <meta itemProp="name" content={property?.address || "Unknown Address"} />
          <meta itemProp="description" content={property?.public_remarks || "No description available"} />
          <meta itemProp="price" content={property?.list_price?.toString()} />
          <meta itemProp="priceCurrency" content="USD" />

          {/* Property Header */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200">
                  {property?.standard_status || "Active"}
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">
                  New Listing
                </Badge>
              </div>
              <h1 className="text-3xl font-bold mb-2" itemProp="name">
                {property?.address}
              </h1>
              <div className="flex items-center text-muted-foreground mb-2">
                <MapPin className="h-4 w-4 mr-1" />
                <span itemProp="address">{property?.city}{property?.state ? `, ${property?.state}` : ""}</span>
              </div>
              <div className="flex flex-wrap gap-4 mt-3">
                <div className="flex items-center">
                  <Bed className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>
                    <strong itemProp="numberOfRooms">{property?.bedrooms}</strong> Beds
                  </span>
                </div>
                <div className="flex items-center">
                  <Bath className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>
                    <strong itemProp="numberOfBathroomsTotal">{property?.bathrooms}</strong> Baths
                  </span>
                </div>
                <div className="flex items-center">
                  <Maximize className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>
                    <strong itemProp="floorSize">{property?.living_area_sqft ?? property?.lot_size_sqft}</strong> Sq Ft
                  </span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>
                    Built <strong itemProp="yearBuilt">{property?.year_built}</strong>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-3xl font-bold text-primary" itemProp="price">
                ${property?.list_price?.toLocaleString()}
              </div>
              {property?.list_price !== undefined && (
                <div className="text-sm text-muted-foreground">
                  Est. ${Math.round(property.list_price / 360).toLocaleString()}/mo
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="icon" aria-label="Add to favorites">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" aria-label="Share property">
                  <Share2 className="h-5 w-5" />
                </Button>
                {property && property.latitude && property.longitude && (
                  <StreetViewButton 
                    property={{
                      latitude: property.latitude,
                      longitude: property.longitude,
                      address: property.address
                    }} 
                  />
                )}
              </div>
            </div>
          </div>

          {/* Property Gallery */}
          <PropertyGallery images={property?.images || []} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2">
              <Tabs defaultValue="details">
                <TabsList className="mb-6">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                  <TabsTrigger value="location">Location</TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold mb-4">Property Description</h2>
                      <p className="text-muted-foreground leading-relaxed" itemProp="description">
                        {property?.public_remarks}
                      </p>

                      <h3 className="text-lg font-semibold mt-6 mb-3">Property Details</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Property Type</p>
                          <p className="font-medium" itemProp="propertyType">
                            {property?.property_type}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Year Built</p>
                          <p className="font-medium" itemProp="yearBuilt">
                            {property?.year_built}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Lot Size</p>
                          <p className="font-medium">{property?.lot_size_sqft} Sq Ft</p>
                        </div>
                      </div>
                      
                      {/* Property FAQ */}
                      {faqs && faqs.length > 0 && (
                        <PropertyFAQ
                          faqs={faqs}
                          propertyType={property.property_type}
                          propertyAddress={property.address}
                        />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Features Tab */}
                <TabsContent value="features" className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold mb-4 bg-gray-200 dark:bg-gray-800 p-2 rounded">Interior</h2>
                      <div className="grid grid-cols-2">
                        <div>
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold">Bedrooms & bathrooms</h3>
                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                              <li>Bedrooms: {property?.bedrooms}</li>
                              <li>Bathrooms: {property?.bathrooms}</li>
                              <li>Full bathrooms: {property?.bathrooms}</li>
                            </ul>
                          </div>
                          <div className="mb-6">  
                            <h3 className="text-lg font-semibold">Rooms</h3>
                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                              <li>Room types: {property?.interior_features || "N/A"}</li>
                            </ul>
                          </div>
                          <div className="mb-6">  
                            <h3 className="text-lg font-semibold">Heating</h3>
                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                              <li>{property?.heating || "N/A"}</li>
                            </ul>
                          </div>
                          <div className="mb-6">  
                            <h3 className="text-lg font-semibold">Cooling</h3>
                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                              <li>{property?.cooling || "N/A"}</li>
                            </ul>
                          </div>
                        </div>

                        <div>
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold">Appliances</h3>
                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                              <li>Included: Dishwasher, Range/Oven, Refrigerator</li>
                              <li>Laundry: {property?.laundry_features || "N/A"}</li>
                            </ul>
                          </div>
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold">Features</h3>
                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                              <li>Flooring: Tile, Wood</li>
                              <li>Has fireplace: Yes</li>
                              <li>Fireplace features: Living Room</li>
                            </ul>
                          </div>
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold">Interior area</h3>
                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                              <li>Total structure area: {property?.living_area_sqft || "N/A"}</li>
                              <li>Total interior livable area: {property?.living_area_sqft} sqft</li>
                            </ul>
                          </div>
                        </div>
                      </div> 

                      <h2 className="text-xl font-semibold mb-4 bg-gray-200 dark:bg-gray-800 p-2 rounded">Property</h2>
                      <div className="grid grid-cols-2">
                        <div>
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold">Parking</h3>
                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                              <li>Total spaces: {property?.parking_total || "N/A"}</li>
                              <li>Parking features: {property?.parking_features || "N/A"}</li>
                              <li>Garage spaces: {property?.garage_size || "N/A"}</li>
                            </ul>
                          </div>
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold">Features</h3>
                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                              <li>Levels: {property?.stories_total || "One"}</li>
                              <li>Pool features: None</li>
                              <li>Spa features: Community</li>
                              <li>Has view: Yes</li>
                              <li>View description: Tree Top</li>
                            </ul>
                          </div>
                        </div>

                        <div>
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold">Lot</h3>
                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                              <li>Size: {property?.lot_size_sqft} Sq ft</li>
                              <li>Features: {property?.lot_features || "N/A"}</li>
                            </ul>
                          </div>
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold">Details</h3>
                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                              <li>Parcel number: {property?.listing_key}</li>
                              <li>Zoning: {property?.zoning || "N/A"}</li>
                              <li>Special conditions: Standard</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <h2 className="text-xl font-semibold mb-4 bg-gray-200 dark:bg-gray-800 p-2 rounded">Construction</h2>
                      <div className="grid grid-cols-2">
                        <div>
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold">Type & style</h3>
                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                              <li>Home type: {property?.property_type}</li>
                              <li>Architectural style: Contemporary</li>
                              <li>Property subtype: {property?.property_sub_type}</li>
                              <li>Condition: {property?.property_condition || "Good"}</li>
                            </ul>
                          </div>
                        </div>

                        <div>
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold">Condition</h3>
                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                              <li>Year built: {property?.year_built}</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <h2 className="text-xl font-semibold mb-4 bg-gray-200 dark:bg-gray-800 p-2 rounded">Community & HOA</h2>
                      <div className="grid grid-cols-2">
                        <div>
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold">Community</h3>
                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                              <li>Security: {property?.security_features || "N/A"}</li>
                              <li>Subdivision: {property?.property_sub_type}</li>
                            </ul>
                          </div>
                        </div>

                        <div>
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold">HOA</h3>
                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                              <li>Has HOA: {property?.association_fee ? "Yes" : "No"}</li>
                              <li>Amenities included: Spa/Hot Tub, Fitness Center, Elevator(s), Controlled Access, Clubhouse</li>
                              <li>HOA fee: ${property?.association_fee || "N/A"} monthly</li>
                            </ul>
                          </div>
                          
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold">Location</h3>
                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                              <li>Region: {property?.county || property?.city}</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <h2 className="text-xl font-semibold mb-4 bg-gray-200 dark:bg-gray-800 p-2 rounded">Financial & Listing Details</h2>
                      <div className="mb-6">
                        <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                          <li>Price per square foot: ${property?.price_per_sq_ft || (property?.list_price && property?.living_area_sqft ? Math.round(property.list_price / property.living_area_sqft) : "N/A")}/sqft</li>
                          <li>Tax assessed value: ${property?.tax_annual_amount ? Math.round(property.tax_annual_amount * 10).toLocaleString() : "N/A"}</li>
                          <li>Annual tax amount: ${property?.tax_annual_amount?.toLocaleString() || "N/A"}</li>
                          <li>Date on market: {property?.on_market_timestamp || "N/A"}</li>
                          <li>Days on market: {property?.cumulative_days_on_market || "N/A"}</li>
                        </ul>
                      </div>

                      {/* Schools Section */}
                      {(property?.school_district_name || property?.elementary_school_name || property?.middle_school_name || property?.high_school_name) && (
                        <>
                          <h2 className="text-xl font-semibold mb-4 bg-gray-200 dark:bg-gray-800 p-2 rounded">Schools</h2>
                          <div className="mb-6">
                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                              {property?.school_district_name && <li>School District: {property.school_district_name}</li>}
                              {property?.elementary_school_name && <li>Elementary School: {property.elementary_school_name}</li>}
                              {property?.middle_school_name && <li>Middle School: {property.middle_school_name}</li>}
                              {property?.high_school_name && <li>High School: {property.high_school_name}</li>}
                            </ul>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Location Tab */}
                <TabsContent value="location">
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold mb-4">Location</h2>
                      <div itemProp="geo" itemScope itemType="https://schema.org/GeoCoordinates">
                        <meta itemProp="latitude" content={property?.latitude?.toString()} />
                        <meta itemProp="longitude" content={property?.longitude?.toString()} />
                        {property?.latitude && property?.longitude && (
                          <PropertyMap 
                            location={{
                              lat: property.latitude,
                              lng: property.longitude
                            }} 
                            address={property?.address ?? ''} 
                          />
                        )}
                      </div>
                      
                      {/* Walk Score */}
                      {property?.walk_score && (
                        <div className="mt-4">
                          <h3 className="text-lg font-semibold">Walk Score</h3>
                          <p className="text-muted-foreground">{property.walk_score}/100</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div>
              {/* Contact Form Card */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="font-semibold">Contact the Crown Coastal Team</h3>
                  </div>
                  <Separator className="my-4" />
                  <ContactForm propertyId={property?.listing_key ?? ''} proertyData={property} />
                </CardContent>
              </Card>

              {/* Mortgage Calculator Card */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Mortgage Calculator</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Home Price</p>
                      <div className="font-medium">${property?.list_price?.toLocaleString()}</div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Down Payment (20%)</p>
                      <div className="font-medium">${(property?.list_price * 0.2)?.toLocaleString()}</div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Loan Amount</p>
                      <div className="font-medium">${(property?.list_price * 0.8)?.toLocaleString()}</div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Estimated Monthly Payment</p>
                      <div className="font-medium">${Math.round(property?.list_price / 360)?.toLocaleString()}/month</div>
                    </div>
                    <MortgageCalculatorModal
                      propertyPrice={property?.list_price}
                      propertyTaxRate={0.0125}
                      insuranceRate={0.0035}
                      hoaFees={property?.association_fee || 0}
                      buttonText="Full Calculator"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Listing Agent Card */}
              <div className="mt-6 border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50/50 dark:bg-gray-900/50 p-4">
                <p className="text-sm text-muted-foreground mb-3">Listing Agent</p>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name: </span>
                    <span itemProp="agent">{property?.list_agent_full_name || "Crown Coastal Homes"}</span>
                  </div>
                  {property?.list_agent_phone && (
                    <div>
                      <span className="text-muted-foreground">Phone: </span>
                      <span>{property.list_agent_phone}</span>
                    </div>
                  )}
                  {property?.list_agent_email && (
                    <div>
                      <span className="text-muted-foreground">Email: </span>
                      <span>{property.list_agent_email}</span>
                    </div>
                  )}
                  {property?.list_agent_dre && (
                    <div>
                      <span className="text-muted-foreground">DRE#: </span>
                      <span>{property.list_agent_dre}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </article>
      </main>
    </>
  )
}

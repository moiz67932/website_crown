"use client"
import Image from "next/image"
import Link from "next/link"
import { Home, Building, MapPin, Bed, Bath, Maximize, ArrowRight, Star, Phone, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import SearchBar from "@/components/home/search-bar"
import useListProperties from "@/hooks/queries/useGetListProperties";
import Loading from "@/components/shared/loading"

interface Property {
  id: string;
  image: string;
  listing_key: string;

  title: string;
  location: string;
  price: number;
  beds: string | number;
  baths: string | number;
  sqft: string | number;
  status: string;
  statusColor: string;
  publicRemarks: string;
}

export default function HomePage() {
  const { data: featuredPropertiesRaw } = useListProperties({ skip: 0, limit: 3 });


  if (!featuredPropertiesRaw) {
    return <Loading />;
  }

  // Map API data to UI-friendly format
  const featuredProperties: Property[] = featuredPropertiesRaw.listings.map((item: any) => ({
    id: item.listing_id,
    listing_key: item.listing_key,
    image: item.main_image_url || "/placeholder.svg",
    title: item.address,
    location: item.city,
    price: item.list_price,
    beds: item.bedrooms ?? "-",
    baths: item.bathrooms ?? "-",
    sqft: item.living_area_sqft ?? "-",
    status: item.property_type,
    statusColor: "bg-blue-100 text-blue-800", // You can adjust color logic as needed
    publicRemarks: item.public_remarks,
  }));

  return (
    <main>
      {/* Hero Section with Professional Background */}
      <section className="relative bg-slate-50 pt-16 md:pt-20">

        <div className="container mx-auto px-4 py-10 md:py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-4 md:space-y-6">
              <Badge className="bg-slate-200 text-slate-800 hover:bg-slate-300 border-none px-3 py-1 text-xs md:text-sm">
                Premier Real Estate
              </Badge>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-slate-900">
                Find your dream home in California 
              </h1>
              <p className="text-base md:text-lg text-slate-600 max-w-lg">
                Explore our curated selection of premium properties in the most desirable locations.
              </p>

              <div className="pt-2 md:pt-4">
                <SearchBar />
              </div>

              <div className="flex flex-wrap gap-4 md:gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <div className="bg-slate-200 p-1.5 md:p-2 rounded-full">
                    <Home className="h-4 w-4 md:h-5 md:w-5 text-slate-700" />
                  </div>
                  <span className="text-sm md:text-base text-slate-700">10,000+ Properties</span>
                </div>
              
                <div className="flex items-center gap-2">
                  <div className="bg-slate-200 p-1.5 md:p-2 rounded-full">
                    <MapPin className="h-4 w-4 md:h-5 md:w-5 text-slate-700" />
                  </div>
                  <span className="text-sm md:text-base text-slate-700">100+ Cities</span>
                </div>
              </div>
            </div>

            <div className="relative mt-6 lg:mt-0 lg:block">
              <div className="relative">
                <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] w-full rounded-lg overflow-hidden shadow-lg">
                  <Image
                    src="/luxury-modern-house-exterior.png"
                    alt="Luxury Modern House"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rest of the page content remains the same */}
      {/* Featured Properties Section */}
      <section className="py-10 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2 text-slate-900">Featured Properties</h2>
              <p className="text-sm md:text-base text-slate-600 max-w-2xl">
                Discover our handpicked selection of premium properties in the most sought-after locations.
              </p>
            </div>
            <Link href="/properties" className="mt-4 md:mt-0">
              <Button variant="outline" className="gap-2 text-sm">
                View All Properties
                <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {featuredProperties.map((property) => (
              <Link href={`/properties/${property.listing_key}`} key={property.listing_key}>
                <Card className="overflow-hidden h-full hover:shadow-md transition-all group">
                  <div className="relative h-48 sm:h-56 md:h-64">
                  <img src={"http://34.133.70.161:8000/proxy-image?url=" + property.image} alt={property.title} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                  />
                    
                    <Badge className={`absolute top-2 left-2 md:top-3 md:left-3 text-xs ${property.statusColor}`}>
                      {property.status}
                    </Badge>
                    <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3 bg-white/90 backdrop-blur-sm rounded-md px-2 py-1 md:px-3 md:py-1 text-xs md:text-sm font-medium">
                      ${property.price?.toLocaleString?.() ?? property.price}
                    </div>
                  </div>
                  <CardContent className="p-3 md:p-5">
                    <h3 className="text-base md:text-xl font-semibold mb-1 md:mb-2 line-clamp-1 group-hover:text-slate-700 transition-colors">
                      {property.title}
                    </h3>
                    <div className="flex items-center text-slate-500 mb-2 md:mb-3">
                      <MapPin className="h-3 w-3 md:h-4 md:w-4 mr-1 flex-shrink-0" />
                      <span className="text-xs md:text-sm line-clamp-1">{property.location}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm">
                      <div className="flex items-center">
                        <Bed className="h-3 w-3 md:h-4 md:w-4 mr-1 text-slate-400" />
                        <span>{property.beds} Beds</span>
                      </div>
                      <div className="flex items-center">
                        <Bath className="h-3 w-3 md:h-4 md:w-4 mr-1 text-slate-400" />
                        <span>{property.baths} Baths</span>
                      </div>
                      <div className="flex items-center">
                        <Maximize className="h-3 w-3 md:h-4 md:w-4 mr-1 text-slate-400" />
                        <span>
                          {property.sqft !== "-" ? `${property.sqft.toLocaleString?.() ?? property.sqft} Sq Ft` : "- Sq Ft"}
                        </span>
                      </div>
                    </div>
                    {property.publicRemarks && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">{property.publicRemarks}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-10 md:py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-slate-900">Browse by Category</h2>
            <p className="text-sm md:text-base text-slate-600 max-w-2xl mx-auto">
              Find properties that match your specific needs and preferences.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {categories.map((category) => (
              <Link href={category.link} key={category.name}>
                <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-3 md:p-6 text-center h-full flex flex-col items-center justify-center group">
                  <div
                    className={`${category.bgColor} p-2 md:p-3 rounded-full mb-2 md:mb-4 transition-transform group-hover:scale-110`}
                  >
                    <div className="h-5 w-5 md:h-6 md:w-6">{category.icon}</div>
                  </div>
                  <h3 className="font-medium text-sm md:text-base text-slate-900">{category.name}</h3>
                  <p className="text-xs md:text-sm text-slate-500 mt-1">{category.count} Properties</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
x
      {/* Testimonials Section */}
      <section className="py-10 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-slate-900">What Our Clients Say</h2>
            <p className="text-sm md:text-base text-slate-600 max-w-2xl mx-auto">
              Hear from our satisfied clients about their experience with our services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="overflow-hidden border border-slate-200">
                <CardContent className="p-4 md:p-8 relative">
                  <div className="absolute top-2 right-2 md:top-4 md:right-4 text-slate-200">
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="md:w-[60px] md:h-[60px]"
                    >
                      <path
                        d="M11.3 6.2H16.7L13.2 12.8V17.8H18.8V12.8H16.7L20.2 6.2V2.4H11.3V6.2ZM2.8 6.2H8.2L4.7 12.8V17.8H10.3V12.8H8.2L11.7 6.2V2.4H2.8V6.2Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>

                  <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                    <div className="relative h-10 w-10 md:h-14 md:w-14 rounded-full overflow-hidden">
                      <Image
                        src={testimonial.avatar || "/placeholder.svg"}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base md:text-lg text-slate-900">{testimonial.name}</h3>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 md:h-4 md:w-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm md:text-base text-slate-600 italic">{testimonial.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 md:py-16 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">Ready to Find Your Dream Home?</h2>
              <p className="text-base md:text-xl text-slate-300 mb-6 md:mb-8">
                Let our expert agents guide you through the process and help you find the perfect property.
              </p>

              <div className="flex flex-wrap gap-3 md:gap-4">
                <Button className="bg-white text-slate-900 hover:bg-slate-100 text-sm md:text-base">
                  Browse Properties
                </Button>
                <Button className="bg-white text-slate-900 hover:bg-slate-100 text-sm md:text-base">
                  Contact an Agent
                </Button>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-4 md:p-8 relative">
              <h3 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">Get in Touch</h3>

              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="bg-slate-700 p-2 md:p-3 rounded-full">
                    <Phone className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-slate-400">Call Us</p>
                    <p className="font-medium text-sm md:text-base">1 858-305-4362</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 md:gap-4">
                  <div className="bg-slate-700 p-2 md:p-3 rounded-full">
                    <Mail className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-slate-400">Email Us</p>
                    <p className="font-medium text-sm md:text-base">reza@crowncoastal.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 md:gap-4">
                  <div className="bg-slate-700 p-2 md:p-3 rounded-full">
                    <MapPin className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-slate-400">Visit Us</p>
                    <p className="font-medium text-sm md:text-base">CA DRE #02211952</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}


const categories = [
  {
    name: "Houses",
    count: 1245,
    icon: <Home className="h-6 w-6 text-slate-700" />,
    bgColor: "bg-slate-100",
    link: "/properties?category=houses",
  },
  {
    name: "Apartments",
    count: 873,
    icon: <Building className="h-6 w-6 text-slate-700" />,
    bgColor: "bg-slate-100",
    link: "/properties?category=apartments",
  },
  {
    name: "Villas",
    count: 542,
    icon: <Home className="h-6 w-6 text-slate-700" />,
    bgColor: "bg-slate-100",
    link: "/properties?category=villas",
  },
  {
    name: "Commercial",
    count: 327,
    icon: <Building className="h-6 w-6 text-slate-700" />,
    bgColor: "bg-slate-100",
    link: "/properties?category=commercial",
  },
  {
    name: "Luxury",
    count: 157,
    icon: <Home className="h-6 w-6 text-slate-700" />,
    bgColor: "bg-slate-100",
    link: "/properties?category=luxury",
  },
  {
    name: "Land",
    count: 89,
    icon: <MapPin className="h-6 w-6 text-slate-700" />,
    bgColor: "bg-slate-100",
    link: "/properties?category=land",
  },
]

const testimonials = [
  {
    name: "Sarah Johnson",
    avatar: "/professional-real-estate-agent.png",
    text: "Working with this real estate agency was a dream. They helped me find the perfect home for my family in just two weeks!",
  },
  {
    name: "Michael Chen",
    avatar: "/professional-man-portrait.png",
    text: "The team went above and beyond to help me sell my property at a great price. Their market knowledge is exceptional.",
  },
  {
    name: "Emily Rodriguez",
    avatar: "/professional-woman-portrait.png",
    text: "I was impressed by their attention to detail and personalized service. They truly understood what I was looking for.",
  },
]

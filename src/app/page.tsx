"use client"
import Image from "next/image"
import Link from "next/link"
import { Home, Building, MapPin, Bed, Bath, Maximize, ArrowRight, Star, Phone, Mail, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import SearchBar from "@/components/home/search-bar"
import useListProperties from "@/hooks/queries/useGetListProperties";
import Loading from "@/components/shared/loading"
import { Property } from "@/interfaces"
import { PropertyCard } from "@/components/property-card"
import { Carousel } from "@/components/ui/carousel"



export default function HomePage() {
  const { data: featuredPropertiesRaw } = useListProperties({ skip: 0, limit: 6 });


  if (!featuredPropertiesRaw) {
    return <Loading />;
  }

  // Map API data to UI-friendly format
  const featuredProperties: Property[] = featuredPropertiesRaw.listings.map((item: any) => ({
    id: item.listing_id,
    listing_key: item.listing_key,
    image: item.images[0] || "/placeholder.svg",
    address: item.address,
    location: item.city,
    county: item.county,
    list_price: item.list_price,
    bedrooms: item.bedrooms ?? "-",
    bathrooms: item.bathrooms ?? "-",
    living_area_sqft: item.living_area_sqft ?? "-",
    lot_size_sqft: item.lot_size_sqft ?? "-",
    status: item.property_type !== "ResidentailLease" ? "FOR SALE" : "FOR RENT",
    property_type: item.property_type,
    statusColor: "bg-blue-100 text-blue-800", // You can adjust color logic as needed
    favorite: false,
    _id: item.listing_id,
    images: item.images,
    city: item.city,
    state: item.state,
    zip_code: item.zip_code,
    latitude: item.latitude,
  }));

  return (
    <main>
      {/* Hero Section with Background Image and Overlay */}
      <section className="relative h-[calc(100vh-5rem)] min-h-[600px] flex items-center justify-center text-center text-white overflow-hidden">
        {/* Background image */}
        <Image
          src="/california-coastal-sunset.png"
          alt="Luxury Modern House"
          fill
          className="object-cover object-center z-0"
          priority
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30 z-10" />
        {/* Centered Content Box */}
        <div className="relative z-20 w-full flex flex-col items-center">
          <div className="mx-auto w-full max-w-2xl rounded-xl bg-white/30 backdrop-blur-md px-6 py-10 md:py-14 flex flex-col items-center shadow-lg">
            <h1 className="text-3xl md:text-5xl font-bold text-center text-white leading-tight mb-2">
              Find Your California <br />
              <span className="block text-brand-goldenHour drop-shadow-md">Coastal Dream</span>
            </h1>
            <p className="text-base md:text-lg text-white text-center mb-8 mt-2 max-w-xl">
            Discover exquisite properties along the stunning California coastline. Your journey to luxury living starts here.
              </p>
            {/* Search Bar */}
            <div className="w-full max-w-xl mb-4">
              <SearchBar />
            </div>

          </div>
        </div>
      </section>



      {/* Featured Properties Section */}
      <section className="py-16 bg-[#F6EEE7]">
        <div className="container mx-auto px-4">
        <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Homes For You</h2>
            <div className="w-16 h-1 bg-yellow-400 mx-auto mb-4" />
            <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto">
            Based on homes you may be interested
            </p>
          </div>

          {/* Horizontal Scroll for Featured Properties */}
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
              {featuredProperties.map((property) => (
                <div
                  key={property.listing_key}
                  className="min-w-[320px] max-w-xs flex-shrink-0"
                >
                  <PropertyCard property={property} />
                </div>
              ))}
            </div>
            {/* Optional: Add left/right scroll buttons if desired */}
            
            {/* Scroll Buttons for Featured Properties */}
            <button
              type="button"
              aria-label="Scroll right"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full shadow p-2 z-20"
              onClick={() => {
                const container = document.querySelector('.hide-scrollbar');
                if (container) {
                  (container as HTMLElement).scrollBy({ left: 350, behavior: 'smooth' });
                }
              }}
            >
              <ChevronRightIcon />
            </button>
            <button
              type="button"
              aria-label="Scroll left"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white rounded-full shadow p-2 z-20"
              onClick={() => {
                const container = document.querySelector('.hide-scrollbar');
                if (container) {
                  (container as HTMLElement).scrollBy({ left: -350, behavior: 'smooth' });
                }
              }}
            >
              <ChevronLeftIcon />
            </button>
           
          </div>
          <div className="flex justify-center mt-4">
            <Link href="/properties">
              <button className="px-8 py-2 border-2 border-[#1CA7A6] text-[#1CA7A6] rounded-full font-semibold bg-white hover:bg-[#F6EEE7] transition-all shadow-sm">
                View All Properties
              </button>
            </Link>
          </div>
        </div>
      </section>


      {/* OUR PREMIUM SERVICES Section */}
      <section className="bg-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">OUR PREMIUM SERVICES</h2>
            <div className="w-16 h-1 bg-yellow-400 mx-auto mb-4" />
            <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto">
              Crown Coastal Concierge offers exclusive services tailored to discerning clients seeking premium coastal properties.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-slate-50 rounded-lg shadow-sm p-6 flex flex-col h-full">
              <div className="bg-slate-200 h-32 rounded-md flex items-center justify-center mb-6">
              <img src="/service.jpeg" alt="Concierge Home Buying"  className="w-full h-full object-cover" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Concierge Home Buying</h3>
              <p className="text-slate-600 text-sm mb-4">White-glove service throughout your entire home buying journey, from property selection to closing.</p>
              <ul className="text-slate-700 text-sm mb-4 space-y-1 list-disc list-inside">
                <li>Personalized property selection</li>
                <li>Private viewings</li>
                <li>Negotiation expertise</li>
                <li>Transaction management</li>
                <li>Post-purchase support</li>
              </ul>
              <a href="#" className="text-yellow-500 font-medium text-sm mt-auto hover:underline">Learn More &gt;</a>
            </div>
            {/* Card 2 */}
            <div className="bg-slate-50 rounded-lg shadow-sm p-6 flex flex-col h-full">
              <div className="bg-slate-200 h-32 rounded-md flex items-center justify-center mb-6">
              <img src="/service.jpeg" alt="Concierge Home Buying"  className="w-full h-full object-cover" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">World-Class Affiliates</h3>
              <p className="text-slate-600 text-sm mb-4">Access to our exclusive network of premium service providers, from interior designers to property managers.</p>
              <ul className="text-slate-700 text-sm mb-4 space-y-1 list-disc list-inside">
                <li>Vetted interior designers</li>
                <li>Trusted property managers</li>
                <li>Premium home service providers</li>
                <li>Legal and financial advisors</li>
                <li>Luxury lifestyle concierge</li>
              </ul>
              <a href="#" className="text-yellow-500 font-medium text-sm mt-auto hover:underline">Learn More &gt;</a>
            </div>
            {/* Card 3 */}
            <div className="bg-slate-50 rounded-lg shadow-sm p-6 flex flex-col h-full">
              <div className="bg-slate-200 h-32 rounded-md flex items-center justify-center mb-6">
                    <img src="/service.jpeg" alt="Concierge Home Buying"  className="w-full h-full object-cover" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Tailored Landing Solutions</h3>
              <p className="text-slate-600 text-sm mb-4">Personalized relocation services designed to make your transition to coastal living seamless and stress-free.</p>
              <ul className="text-slate-700 text-sm mb-4 space-y-1 list-disc list-inside">
                <li>Personalized property search</li>
                <li>Area orientation tours</li>
                <li>School and community information</li>
                <li>Temporary housing assistance</li>
                <li>Local service provider connections</li>
              </ul>
              <a href="#" className="text-yellow-500 font-medium text-sm mt-auto hover:underline">Learn More &gt;</a>
            </div>
            {/* Card 4 */}
            <div className="bg-slate-50 rounded-lg shadow-sm p-6 flex flex-col h-full">
              <div className="bg-slate-200 h-32 rounded-md flex items-center justify-center mb-6">
              <img src="/service.jpeg" alt="Concierge Home Buying"  className="w-full h-full object-cover" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Investment Management</h3>
              <p className="text-slate-600 text-sm mb-4">Expert guidance on property investments with comprehensive support for maximizing your real estate portfolio.</p>
              <ul className="text-slate-700 text-sm mb-4 space-y-1 list-disc list-inside">
                <li>Market analysis and trends</li>
                <li>ROI projections</li>
                <li>Portfolio diversification strategies</li>
                <li>Property management solutions</li>
                <li>Tax and legal considerations</li>
              </ul>
              <a href="#" className="text-yellow-500 font-medium text-sm mt-auto hover:underline">Learn More &gt;</a>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {/* <section className="py-10 md:py-16 bg-slate-50">
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
      </section> */}

      {/* Popular California Cities Section */}
      <section className="py-16 bg-[#F6EEE7]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D3A4A] mb-2">Explore Popular California Cities</h2>
            <p className="text-base md:text-lg text-[#6B7280] max-w-2xl mx-auto">
              Discover homes in California's most sought-after coastal and metropolitan areas.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
            {popularCities.map((city) => (
              <div key={city.name} className="relative rounded-2xl shadow-lg overflow-hidden bg-white group h-96 flex flex-col justify-end">
                {/* City image */}
                <div className="absolute inset-0">
                  {city.image ? (
                    <Image src={city.image} alt={city.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <span className="text-5xl text-gray-400">
                        <Image src="/city-san-diego.jpg" alt="San Diego" fill className="object-cover" />
                      </span>
                    </div>
                  )}
                  {/* Gradient overlay at bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
                </div>
                {/* City info */}
                <div className="relative z-10 p-6 flex flex-col justify-end h-1/2 mt-auto">
                  <h3 className="text-2xl font-bold text-white mb-1">{city.name}</h3>
                  <p className="text-white text-sm mb-3 line-clamp-2">{city.description}</p>
                  <a href={city.link} className="text-[#E2C275] font-semibold text-base hover:underline flex items-center gap-1">
                    View Properties <span aria-hidden>→</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
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
      {/* <section className="py-10 md:py-16 bg-slate-900 text-white">
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
      </section> */}


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
    avatar: "/34.jpg",
    text: "The team went above and beyond to help me sell my property at a great price. Their market knowledge is exceptional.",
  },
  {
    name: "Emily Rodriguez",
    avatar: "/27.jpg",
    text: "I was impressed by their attention to detail and personalized service. They truly understood what I was looking for.",
  },
]

const popularCities = [
  {
    name: 'San Diego',
    image: '/san-diego-bay-sunset.png',
    description: "San Diego, renowned for its idyllic climate, 70 miles of pristine beaches, and a dazzling array of world-class attractions.",
    link: '/discover/san-diego',
  },
  {
    name: 'Los Angeles',
    image: '/los.jpg', // Add image path if available
    description: "Discover this iconic California city, home to Hollywood, beautiful beaches, and vibrant neighborhoods.",
    link: '/discover/los-angeles',
  },
  {
    name: 'San Francisco',
    image: '/san-fan.jpg', // Add image path if available
    description: "Discover this iconic California city, famous for the Golden Gate Bridge, tech innovation, and unique culture.",
    link: '/discover/san-francisco',
  },
  // {
  //   name: 'Malibu',
  //   image: '/san-diego-bay-sunset.png',
  //   description: "San Diego, renowned for its idyllic climate, 70 miles of pristine beaches, and a dazzling array of world-class attractions.",
  //   link: '/buy/malibu',
  // },
  // {
  //   name: 'Anta Barbara',
  //   image: '/san-diego-bay-sunset.png', // Add image path if available
  //   description: "Discover this iconic California city, home to Hollywood, beautiful beaches, and vibrant neighborhoods.",
  //   link: '/discover/anta-barbara',
  // },
  // {
  //   name: 'Orange',
  //   image: '/san-diego-bay-sunset.png', // Add image path if available
  //   description: "Discover this iconic California city, famous for the Golden Gate Bridge, tech innovation, and unique culture.",
  //   link: '/buy/orange',
  // },
  // Add more cities as needed
];

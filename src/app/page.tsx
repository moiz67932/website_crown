"use client"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import SearchBar from "@/components/home/search-bar"
import useListProperties from "@/hooks/queries/useGetListProperties";
import Loading from "@/components/shared/loading"
import { Property } from "@/interfaces"
import { PropertyCard } from "@/components/property-card"
import CustomerReview from "@/components/customer-review"



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
      {/* Enhanced Hero Section */}
      <section className="relative h-screen min-h-[700px] flex items-center justify-center text-center text-white overflow-hidden theme-transition">
        {/* Background image with parallax effect */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/california-coastal-sunset.png"
            alt="Luxury California Coastal Property"
            fill
            className="object-cover object-center scale-105 transition-transform duration-[20s] ease-out"
            priority
          />
        </div>
        {/* Modern gradient overlay - different for dark mode */}
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/70 via-neutral-800/50 to-primary-900/60 dark:from-slate-900/80 dark:via-slate-800/60 dark:to-orange-900/70 z-10 theme-transition" />
        
        {/* Floating elements for visual interest */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gold-400/20 rounded-full blur-3xl animate-float z-5"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-accent-400/20 rounded-full blur-3xl animate-float animation-delay-2000 z-5"></div>
        
        {/* Enhanced centered content */}
        <div className="relative z-20 w-full flex flex-col items-center px-4">
          <div className="mx-auto w-full max-w-4xl">
            {/* Main heading with improved typography */}
            <div className="mb-8 animate-fade-in-up">
              <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-center text-white leading-tight mb-4">
                Find Your
                <span className="block text-gradient-luxury bg-clip-text text-transparent drop-shadow-2xl">
                  California Dream
                </span>
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl text-white/90 text-center mb-12 max-w-3xl mx-auto font-light leading-relaxed text-balance">
                Discover exceptional coastal properties with unparalleled luxury. 
                <span className="block mt-2 text-gold-300 font-medium">Your journey to extraordinary living starts here.</span>
              </p>
            </div>
            
            {/* Enhanced search bar container */}
            <div className="w-full max-w-4xl mb-8 animate-fade-in-up animation-delay-2000">
              <div className="glass-card rounded-3xl p-6 md:p-8 shadow-strong">
                <SearchBar />
              </div>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 text-white/80 animate-fade-in-up animation-delay-4000">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-accent-400 rounded-full animate-pulse-soft"></div>
                <span className="text-sm md:text-base font-medium">1000+ Properties</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gold-400 rounded-full animate-pulse-soft animation-delay-2000"></div>
                <span className="text-sm md:text-base font-medium">Expert Guidance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary-400 rounded-full animate-pulse-soft animation-delay-4000"></div>
                <span className="text-sm md:text-base font-medium">Luxury Focus</span>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Enhanced Featured Properties Section */}
      <section className="py-20 md:py-24 bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-orange-900/20 relative overflow-hidden theme-transition">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 dark:opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-primary-400 dark:bg-orange-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-accent-400 dark:bg-cyan-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-8 h-[2px] bg-gradient-primary rounded-full"></div>
              <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Featured Properties</span>
              <div className="w-8 h-[2px] bg-gradient-primary rounded-full"></div>
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-neutral-100 mb-6 text-balance theme-transition">
              Exceptional Homes
              <span className="block text-gradient-luxury bg-clip-text text-transparent">Curated For You</span>
            </h2>
            <p className="text-neutral-600 dark:text-neutral-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed text-balance theme-transition">
              Discover handpicked properties that match your lifestyle and aspirations. Each home represents the pinnacle of coastal California living.
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
          <div className="flex justify-center mt-12">
            <Link href="/properties">
              <button className="group px-8 py-4 bg-gradient-primary hover:bg-gradient-to-r hover:from-primary-500 hover:to-primary-600 text-white rounded-2xl font-semibold transition-all duration-300 shadow-medium hover:shadow-strong hover:scale-105 hover:shadow-primary-400/25 flex items-center gap-3">
                <span>Explore All Properties</span>
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </Link>
          </div>
        </div>
      </section>


      {/* Enhanced Premium Services Section */}
      <section className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-primary-900 py-20 md:py-28 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-gold-400 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-accent-400 rounded-full blur-3xl animate-float animation-delay-4000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-400 rounded-full blur-3xl opacity-30"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-8 h-[2px] bg-gradient-luxury rounded-full"></div>
              <span className="text-gold-400 font-semibold text-sm uppercase tracking-wider">Premium Services</span>
              <div className="w-8 h-[2px] bg-gradient-luxury rounded-full"></div>
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 text-balance">
              Concierge-Level
              <span className="block text-gradient-luxury bg-clip-text text-transparent">Real Estate Services</span>
            </h2>
            <p className="text-neutral-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed text-balance">
              Experience unparalleled service with our exclusive concierge offerings, meticulously designed for discerning clients seeking extraordinary coastal properties.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Enhanced Card 1 */}
            <div className="group glass-card rounded-2xl p-8 flex flex-col h-full hover-lift border border-white/20 bg-white/10 backdrop-blur-xl">
              <div className="relative overflow-hidden rounded-xl mb-6 h-40">
                <img src="/service/Concierge-Home-Buying-1.png" alt="Concierge Home Buying" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-bold text-white">Concierge Home Buying</h3>
              </div>
              <p className="text-neutral-300 mb-6 leading-relaxed flex-grow">White-glove service throughout your entire home buying journey, from property selection to closing.</p>
              <ul className="text-neutral-400 text-sm mb-6 space-y-2">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gold-400 rounded-full"></div>Personalized property selection</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gold-400 rounded-full"></div>Private viewings</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gold-400 rounded-full"></div>Negotiation expertise</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gold-400 rounded-full"></div>Transaction management</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gold-400 rounded-full"></div>Post-purchase support</li>
              </ul>
              <Link href="/services/concierge-home-buying" className="inline-flex items-center gap-2 text-gold-400 font-semibold hover:text-gold-300 transition-colors group/link">
                <span>Learn More</span>
                <svg className="w-4 h-4 transition-transform group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
            {/* Enhanced Card 2 */}
            <div className="group glass-card rounded-2xl p-8 flex flex-col h-full hover-lift border border-white/20 bg-white/10 backdrop-blur-xl">
              <div className="relative overflow-hidden rounded-xl mb-6 h-40">
                <img src="/service/World-Class-Affiliates-1.png" alt="World-Class Affiliates" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-accent-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-accent flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-bold text-white">World-Class Affiliates</h3>
              </div>
              <p className="text-neutral-300 mb-6 leading-relaxed flex-grow">Access to our exclusive network of premium service providers, from interior designers to property managers.</p>
              <ul className="text-neutral-400 text-sm mb-6 space-y-2">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-accent-400 rounded-full"></div>Vetted interior designers</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-accent-400 rounded-full"></div>Trusted property managers</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-accent-400 rounded-full"></div>Premium home service providers</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-accent-400 rounded-full"></div>Legal and financial advisors</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-accent-400 rounded-full"></div>Luxury lifestyle concierge</li>
              </ul>
              <Link href="/services/affiliates" className="inline-flex items-center gap-2 text-accent-400 font-semibold hover:text-accent-300 transition-colors group/link">
                <span>Learn More</span>
                <svg className="w-4 h-4 transition-transform group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
            {/* Enhanced Card 3 */}
            <div className="group glass-card rounded-2xl p-8 flex flex-col h-full hover-lift border border-white/20 bg-white/10 backdrop-blur-xl">
              <div className="relative overflow-hidden rounded-xl mb-6 h-40">
                <img src="/service/Tailored-Landing-Solutions-1.png" alt="Tailored Landing Solutions" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-luxury flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-bold text-white">Tailored Relocation</h3>
              </div>
              <p className="text-neutral-300 mb-6 leading-relaxed flex-grow">Personalized relocation services designed to make your transition to coastal living seamless and stress-free.</p>
              <ul className="text-neutral-400 text-sm mb-6 space-y-2">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gold-400 rounded-full"></div>Personalized property search</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gold-400 rounded-full"></div>Area orientation tours</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gold-400 rounded-full"></div>School and community info</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gold-400 rounded-full"></div>Temporary housing assistance</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gold-400 rounded-full"></div>Service provider connections</li>
              </ul>
              <Link href="/services/relocation" className="inline-flex items-center gap-2 text-gold-400 font-semibold hover:text-gold-300 transition-colors group/link">
                <span>Learn More</span>
                <svg className="w-4 h-4 transition-transform group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
            {/* Enhanced Card 4 */}
            <div className="group glass-card rounded-2xl p-8 flex flex-col h-full hover-lift border border-white/20 bg-white/10 backdrop-blur-xl">
              <div className="relative overflow-hidden rounded-xl mb-6 h-40">
                <img src="/service/Investment-Management-1.png" alt="Investment Management" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-accent-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-accent flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-bold text-white">Investment Management</h3>
              </div>
              <p className="text-neutral-300 mb-6 leading-relaxed flex-grow">Expert guidance on property investments with comprehensive support for maximizing your real estate portfolio.</p>
              <ul className="text-neutral-400 text-sm mb-6 space-y-2">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-accent-400 rounded-full"></div>Market analysis and trends</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-accent-400 rounded-full"></div>ROI projections</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-accent-400 rounded-full"></div>Portfolio diversification</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-accent-400 rounded-full"></div>Property management solutions</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-accent-400 rounded-full"></div>Tax and legal considerations</li>
              </ul>
              <Link href="/services/investment" className="inline-flex items-center gap-2 text-accent-400 font-semibold hover:text-accent-300 transition-colors group/link">
                <span>Learn More</span>
                <svg className="w-4 h-4 transition-transform group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
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

          <CustomerReview />
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

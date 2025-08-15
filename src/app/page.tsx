"use client"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import React, { useState, useEffect } from "react"

import SearchBar from "@/components/home/search-bar"
import { useTrestlePropertiesIntegrated } from "@/hooks/useTrestlePropertiesIntegrated";
import Loading from "@/components/shared/loading"
import { Property } from "@/interfaces"
import { PropertyCard } from "@/components/property-card"
import CustomerReview from "@/components/customer-review"



// Function to shuffle array randomly
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function HomePage() {
  // Fetch properties from Trestle API
  const { properties: allProperties, loading } = useTrestlePropertiesIntegrated({}, 18);
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);

  // Update featured properties when Trestle data changes
  useEffect(() => {
    if (allProperties.length > 0) {
      // Shuffle properties and select 6 random ones for featured display
      const randomProperties = shuffleArray([...allProperties]).slice(0, 6);
      setFeaturedProperties(randomProperties);
      
      console.log(`🎲 Randomly selected ${randomProperties.length} featured properties from Trestle API`);
    }
  }, [allProperties]);

  // Function to shuffle and get new random properties
  const shuffleProperties = () => {
    if (allProperties.length > 0) {
      const newRandomProperties = shuffleArray([...allProperties]).slice(0, 6);
      setFeaturedProperties(newRandomProperties);
      
      console.log(`🎲 Shuffled to new random properties from Trestle API!`);
    }
  };

  if (loading) {
    return <Loading />;
  }

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
            sizes="100vw"
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
              {featuredProperties.map((property, index) => (
                <div
                  key={property.listing_key || property.id || `featured-${index}`}
                  className="min-w-[320px] max-w-xs flex-shrink-0"
                >
                  <PropertyCard property={property} />
                </div>
              ))}
            </div>
            {/* Optional: Add left/right scroll buttons if desired */}
            
            {/* Enhanced Scroll Buttons for Featured Properties */}
            <button
              type="button"
              aria-label="Scroll right"
              className="absolute right-2 top-1/2 -translate-y-1/2 glass-card bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 rounded-full shadow-medium hover:shadow-strong p-3 z-20 transition-all duration-300 hover:scale-110 text-neutral-700 dark:text-neutral-300"
              onClick={() => {
                const container = document.querySelector('.hide-scrollbar');
                if (container) {
                  (container as HTMLElement).scrollBy({ left: 350, behavior: 'smooth' });
                }
              }}
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Scroll left"
              className="absolute left-2 top-1/2 -translate-y-1/2 glass-card bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 rounded-full shadow-medium hover:shadow-strong p-3 z-20 transition-all duration-300 hover:scale-110 text-neutral-700 dark:text-neutral-300"
              onClick={() => {
                const container = document.querySelector('.hide-scrollbar');
                if (container) {
                  (container as HTMLElement).scrollBy({ left: -350, behavior: 'smooth' });
                }
              }}
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
           
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-12">
            <button 
              onClick={shuffleProperties}
              className="group px-6 py-3 bg-sky-500 hover:bg-sky-600 dark:bg-accent-600 dark:hover:bg-accent-700 text-white dark:text-white rounded-2xl font-semibold transition-all duration-300 shadow-medium hover:shadow-strong hover:scale-105 hover:shadow-sky-400/25 dark:hover:shadow-accent-400/25 flex items-center gap-3 border border-sky-600 dark:border-accent-500"
            >
              <svg className="w-5 h-5 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Show Different Properties</span>
            </button>
            <Link href="/properties">
              <button className="group px-8 py-4 bg-orange-500 hover:bg-orange-600 dark:bg-gradient-primary dark:hover:bg-gradient-to-r dark:hover:from-primary-500 dark:hover:to-primary-600 text-white rounded-2xl font-semibold transition-all duration-300 shadow-medium hover:shadow-strong hover:scale-105 hover:shadow-orange-400/25 dark:hover:shadow-primary-400/25 flex items-center gap-3">
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
      <section className="bg-gradient-to-br from-neutral-50 via-white to-accent-50/30 dark:from-neutral-900 dark:via-neutral-800 dark:to-primary-900 py-20 md:py-28 relative overflow-hidden theme-transition">
        {/* Background elements */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-gold-400 dark:bg-gold-400 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-accent-400 dark:bg-accent-400 rounded-full blur-3xl animate-float animation-delay-4000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-400 dark:bg-primary-400 rounded-full blur-3xl opacity-30"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-8 h-[2px] bg-gradient-luxury rounded-full"></div>
              <span className="text-primary-600 dark:text-gold-400 font-semibold text-sm uppercase tracking-wider theme-transition">Premium Services</span>
              <div className="w-8 h-[2px] bg-gradient-luxury rounded-full"></div>
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-white mb-6 text-balance theme-transition">
              Concierge-Level
              <span className="block text-gradient-luxury bg-clip-text text-transparent">Real Estate Services</span>
            </h2>
            <p className="text-neutral-600 dark:text-neutral-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed text-balance theme-transition">
              Experience unparalleled service with our exclusive concierge offerings, meticulously designed for discerning clients seeking extraordinary coastal properties.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Enhanced Card 1 */}
            <div className="group glass-card rounded-2xl p-8 flex flex-col h-full hover-lift border border-neutral-200/50 dark:border-white/20 bg-white/80 dark:bg-white/10 backdrop-blur-xl theme-transition">
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
                <h3 className="font-display text-xl font-bold text-neutral-900 dark:text-white theme-transition">Concierge Home Buying</h3>
              </div>
              <p className="text-neutral-600 dark:text-neutral-300 mb-6 leading-relaxed flex-grow theme-transition">White-glove service throughout your entire home buying journey, from property selection to closing.</p>
              <ul className="text-neutral-500 dark:text-neutral-400 text-sm mb-6 space-y-2 theme-transition">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gold-400 rounded-full"></div>Personalized property selection</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gold-400 rounded-full"></div>Private viewings</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gold-400 rounded-full"></div>Negotiation expertise</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gold-400 rounded-full"></div>Transaction management</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gold-400 rounded-full"></div>Post-purchase support</li>
              </ul>
              <Link href="/services/concierge-home-buying" className="inline-flex items-center gap-2 text-primary-600 dark:text-gold-400 font-semibold hover:text-primary-700 dark:hover:text-gold-300 transition-colors group/link theme-transition">
                <span>Learn More</span>
                <svg className="w-4 h-4 transition-transform group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
            {/* Enhanced Card 2 */}
            <div className="group glass-card rounded-2xl p-8 flex flex-col h-full hover-lift border border-neutral-200/50 dark:border-white/20 bg-white/80 dark:bg-white/10 backdrop-blur-xl theme-transition">
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
                <h3 className="font-display text-xl font-bold text-neutral-900 dark:text-white theme-transition">World-Class Affiliates</h3>
              </div>
              <p className="text-neutral-600 dark:text-neutral-300 mb-6 leading-relaxed flex-grow theme-transition">Access to our exclusive network of premium service providers, from interior designers to property managers.</p>
              <ul className="text-neutral-500 dark:text-neutral-400 text-sm mb-6 space-y-2 theme-transition">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-accent-400 rounded-full"></div>Vetted interior designers</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-accent-400 rounded-full"></div>Trusted property managers</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-accent-400 rounded-full"></div>Premium home service providers</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-accent-400 rounded-full"></div>Legal and financial advisors</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-accent-400 rounded-full"></div>Luxury lifestyle concierge</li>
              </ul>
              <Link href="/services/affiliates" className="inline-flex items-center gap-2 text-accent-600 dark:text-accent-400 font-semibold hover:text-accent-700 dark:hover:text-accent-300 transition-colors group/link theme-transition">
                <span>Learn More</span>
                <svg className="w-4 h-4 transition-transform group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
            {/* Enhanced Card 3 */}
            <div className="group glass-card rounded-2xl p-8 flex flex-col h-full hover-lift border border-neutral-200/50 dark:border-white/20 bg-white/80 dark:bg-white/10 backdrop-blur-xl theme-transition">
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
                <h3 className="font-display text-xl font-bold text-neutral-900 dark:text-white theme-transition">Tailored Relocation</h3>
              </div>
              <p className="text-neutral-600 dark:text-neutral-300 mb-6 leading-relaxed flex-grow theme-transition">Personalized relocation services designed to make your transition to coastal living seamless and stress-free.</p>
              <ul className="text-neutral-500 dark:text-neutral-400 text-sm mb-6 space-y-2 theme-transition">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gold-400 rounded-full"></div>Personalized property search</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gold-400 rounded-full"></div>Area orientation tours</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gold-400 rounded-full"></div>School and community info</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gold-400 rounded-full"></div>Temporary housing assistance</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gold-400 rounded-full"></div>Service provider connections</li>
              </ul>
              <Link href="/services/relocation" className="inline-flex items-center gap-2 text-primary-600 dark:text-gold-400 font-semibold hover:text-primary-700 dark:hover:text-gold-300 transition-colors group/link theme-transition">
                <span>Learn More</span>
                <svg className="w-4 h-4 transition-transform group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
            {/* Enhanced Card 4 */}
            <div className="group glass-card rounded-2xl p-8 flex flex-col h-full hover-lift border border-neutral-200/50 dark:border-white/20 bg-white/80 dark:bg-white/10 backdrop-blur-xl theme-transition">
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
                <h3 className="font-display text-xl font-bold text-neutral-900 dark:text-white theme-transition">Investment Management</h3>
              </div>
              <p className="text-neutral-600 dark:text-neutral-300 mb-6 leading-relaxed flex-grow theme-transition">Expert guidance on property investments with comprehensive support for maximizing your real estate portfolio.</p>
              <ul className="text-neutral-500 dark:text-neutral-400 text-sm mb-6 space-y-2 theme-transition">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-accent-400 rounded-full"></div>Market analysis and trends</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-accent-400 rounded-full"></div>ROI projections</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-accent-400 rounded-full"></div>Portfolio diversification</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-accent-400 rounded-full"></div>Property management solutions</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-accent-400 rounded-full"></div>Tax and legal considerations</li>
              </ul>
              <Link href="/services/investment" className="inline-flex items-center gap-2 text-accent-600 dark:text-accent-400 font-semibold hover:text-accent-700 dark:hover:text-accent-300 transition-colors group/link theme-transition">
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
      {/* Browse by Category Section - COMMENTED OUT
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
      */}

      {/* Enhanced Popular California Cities Section */}
      <section className="py-20 md:py-24 bg-gradient-to-br from-neutral-100 via-neutral-50 to-primary-50/30 dark:from-slate-800 dark:via-slate-900 dark:to-orange-900/20 relative overflow-hidden theme-transition">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 dark:opacity-10">
          <div className="absolute top-20 right-20 w-80 h-80 bg-primary-400 dark:bg-orange-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-accent-400 dark:bg-cyan-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-8 h-[2px] bg-gradient-primary rounded-full"></div>
              <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm uppercase tracking-wider">Discover Cities</span>
              <div className="w-8 h-[2px] bg-gradient-primary rounded-full"></div>
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-neutral-100 mb-6 text-balance theme-transition">
              Explore Popular
              <span className="block text-gradient-luxury bg-clip-text text-transparent">California Cities</span>
            </h2>
            <p className="text-neutral-600 dark:text-neutral-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed text-balance theme-transition">
              Discover homes in California's most sought-after coastal and metropolitan areas, where luxury meets lifestyle.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
            {popularCities.map((city, index) => (
              <div 
                key={city.name} 
                className="group glass-card rounded-3xl shadow-strong overflow-hidden h-96 flex flex-col justify-end hover-lift transition-all duration-500 animate-fade-in-up"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                {/* City image */}
                <div className="absolute inset-0">
                  {city.image ? (
                    <Image 
                      src={city.image} 
                      alt={city.name} 
                      fill 
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                      <span className="text-5xl text-neutral-400 dark:text-neutral-500">
                        <Image src="/city-san-diego.jpg" alt="San Diego" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                      </span>
                    </div>
                  )}
                  {/* Enhanced gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-transparent to-accent-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                
                {/* City info with enhanced styling */}
                <div className="relative z-10 p-8 flex flex-col justify-end h-1/2 mt-auto">
                  <h3 className="text-2xl lg:text-3xl font-display font-bold text-white mb-3 group-hover:text-gold-300 transition-colors duration-300">
                    {city.name}
                  </h3>
                  <p className="text-white/90 text-sm md:text-base mb-4 line-clamp-2 leading-relaxed">
                    {city.description}
                  </p>
                  <a 
                    href={city.link} 
                    className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 font-semibold text-base transition-all duration-300 group/link"
                  >
                    <span>View Properties</span>
                    <svg className="w-4 h-4 transition-transform group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Enhanced Testimonials Section */}
      <section className="py-20 md:py-24 bg-white dark:bg-slate-900 theme-transition">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-8 h-[2px] bg-gradient-primary rounded-full"></div>
              <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm uppercase tracking-wider">Client Reviews</span>
              <div className="w-8 h-[2px] bg-gradient-primary rounded-full"></div>
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-neutral-100 mb-6 text-balance theme-transition">
              What Our
              <span className="block text-gradient-luxury bg-clip-text text-transparent">Clients Say</span>
            </h2>
            <p className="text-neutral-600 dark:text-neutral-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed text-balance theme-transition">
              Hear from our satisfied clients about their exceptional experience with our luxury real estate services.
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

// import dynamic from 'next/dynamic'
// import { Suspense } from 'react'
// import { LandingData } from '@/types/landing'
// import Hero from './sections/Hero'
// import Intro from './sections/Intro'
// import StatsSection from './sections/Stats'
// // Replacing legacy FeaturedGrid with rich PropertyCard implementation
// import PropertyCard from '../property-card-client'
// import NeighborhoodsSection from './sections/Neighborhoods'
// import SchoolsSection from './sections/Schools'
// import FAQSection from './sections/FAQ'
// import RelatedLinksSection from './sections/RelatedLinks'
// import AIDescription from './sections/AIDescription'
// import AmenitiesSection from './sections/Amenities'
// import TransportationSection from './sections/Transportation'
// import WeatherSection from './sections/Weather'
// import DemographicsSection from './sections/Demographics'
// import EconomicsSection from './sections/Economics'
// import CrimeSection from './sections/Crime'
// import BusinessDirectorySection from './sections/BusinessDirectory'
// import RelatedCitiesSection from './sections/RelatedCities'
// // SEO additions
// import CitySchema from '@/components/seo/CitySchema'
// import RelatedVariants from './sections/RelatedVariants'
// import Link from 'next/link'
// import { CA_CITIES, cityToTitle } from '@/lib/seo/cities'
// // FAQ collapse UI uses FAQSection; we pass structured items

// // Deferred / client-only sections (no ssr:false inside server component; Next will handle client boundary)
// const MapSection = dynamic<{ city: string }>(() => import('./sections/Map'), {
//   loading: () => (
//     <div className="rounded-xl border bg-muted/40 h-64 w-full animate-pulse" />
//   )
// })

// const TrendsSection = dynamic(() => import('./sections/Trends'), {
//   loading: () => (
//     <div className="rounded-xl border bg-muted/40 h-64 w-full animate-pulse" />
//   )
// })

// type SimpleFAQ = { question: string; answer: string }
// interface Props { data: LandingData; faqItems?: SimpleFAQ[]; faqJsonLd?: any }

// export default function LandingTemplate({ data, faqItems, faqJsonLd }: Props) {
//   const { city, kind } = data
//   const featured = data.featured || []
//   const citySlug = city.toLowerCase().replace(/\s+/g, '-')
//   return (
//     <div className="flex flex-col pb-20 pt-20">
//       {/* JSON-LD for city landing (only render when we have a city) */}
//       {city && (
//         <CitySchema
//           city={city}
//           canonical={`/california/${citySlug}/${kind}`}
//           featured={(featured || []).map(f => ({ id: f.listingKey, url: (f as any).url || undefined }))}
//           variant={kind}
//         />
//       )}
//       {/* Hero + Intro inside constrained container */}
//       <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
//   {/* Omit image prop so Hero triggers dynamic Supabase/Unsplash fetch */}
//   <Hero city={city} kind={kind} />
//         <Intro html={data.introHtml} />
//         <AIDescription html={data.aiDescriptionHtml} />
//         <StatsSection stats={data.stats} />
//         {/* Featured Listings using full PropertyCard for richer UX */}
//         <section className="pt-4">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-2xl font-bold text-brand-midnightCove">Featured Listings</h2>
//           </div>
//           {!featured.length && (
//             <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
//               {Array.from({ length: 8 }).map((_, i) => (
//                 <div key={i} className="rounded-2xl border border-neutral-200/60 dark:border-slate-700 bg-muted/40 h-64 animate-pulse shadow-sm" />
//               ))}
//             </div>
//           )}
//           {!!featured.length && (
//             <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
//               {featured.map(f => {
//                 // Adapt LandingPropertyCard -> Property (minimal shape) for PropertyCard
//                 const adapted: any = {
//                   _id: f.listingKey,
//                   id: f.listingKey,
//                   listing_key: f.listingKey,
//                   property_type: f.status || 'Residential',
//                   list_price: f.price || 0,
//                   address: f.address || f.title || `${f.city}${f.state ? ', ' + f.state : ''}`,
//                   city: f.city,
//                   county: f.state || '',
//                   bedrooms: f.beds || 0,
//                   bathrooms: f.baths || 0,
//                   lot_size_sqft: f.sqft || 0,
//                   listing_photos: f.img ? [f.img] : [],
//                   images: f.img ? [f.img] : [],
//                   main_photo_url: f.img || null,
//                   status: f.status || 'Active'
//                 }
//                 return <PropertyCard key={f.listingKey} property={adapted} showCompareButton={false} />
//               })}
//             </div>
//           )}
//         </section>
//       </div>

//       {/* Map full-width but centered content inside container if needed */}
//       <div className="w-full mt-4">
//         <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
//           <Suspense fallback={<div className="h-64 rounded-xl border bg-muted animate-pulse" />}> 
//             <MapSection city={city} />
//           </Suspense>
//         </div>
//       </div>

//       {/* Remaining sections all constrained */}
//       <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12 mt-12">
//         {/* <NeighborhoodsSection neighborhoods={data.neighborhoods} city={city} />
//         <SchoolsSection schools={data.schools} />
//         <Suspense fallback={<div className="h-64 rounded-xl border bg-muted animate-pulse" />}> 
//           <TrendsSection trends={data.trends} />
//         </Suspense>
//         <AmenitiesSection amenities={data.amenities} />
//         <TransportationSection data={data.transportation} />
//         <WeatherSection data={data.weather} />
//         <DemographicsSection data={data.demographics} />
//         <EconomicsSection data={data.economics} />
//         <CrimeSection data={data.crime} />
//         <BusinessDirectorySection businesses={data.businessDirectory} /> */}
//         {/* Always render collapsible FAQ UI with structured items */}
//         <FAQSection
//           items={(faqItems && faqItems.length
//             ? faqItems.map(f => ({ q: f.question, a: f.answer }))
//             : data.faq)}
//         />
//         {/* Inject JSON-LD for SEO if provided */}
//         {faqJsonLd && (
//           <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
//         )}
//         <RelatedLinksSection links={data.related} />
//   <RelatedCitiesSection cities={data.relatedCities} />
//   <RelatedVariants citySlug={citySlug} currentSlug={kind} />
//         {/* Simple related cities block (only CA launch) */}
//         <section className="mt-8">
//           <h3 className="text-lg font-semibold mb-4">Related California Cities</h3>
//           <div className="flex flex-wrap gap-2">
//             {CA_CITIES.slice(0, 12).map(c => (
//               <Link
//                 key={c}
//                 href={`/california/${c}/homes-for-sale`}
//                 className="rounded-full border px-3 py-1 text-xs font-medium hover:bg-accent transition-colors"
//               >
//                 {cityToTitle(c)}
//               </Link>
//             ))}
//           </div>
//         </section>
//       </div>
//     </div>
//   )
// }



// src/app/(landing)/landing-page.tsx
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { LandingData } from '@/types/landing'
import Hero from './sections/Hero'
import Intro from './sections/Intro'
import StatsSection from './sections/Stats'
import PropertyCard from '../property-card-client'
import NeighborhoodsSection from './sections/Neighborhoods'
import SchoolsSection from './sections/Schools'
import FAQSection from './sections/FAQ'
import RelatedLinksSection from './sections/RelatedLinks'
import AIDescription from './sections/AIDescription'
import AmenitiesSection from './sections/Amenities'
import TransportationSection from './sections/Transportation'
import WeatherSection from './sections/Weather'
import DemographicsSection from './sections/Demographics'
import EconomicsSection from './sections/Economics'
import CrimeSection from './sections/Crime'
import BusinessDirectorySection from './sections/BusinessDirectory'
import CitySchema from '@/components/seo/CitySchema'
import RelatedVariants from './sections/RelatedVariants'
import Link from 'next/link'
import { CA_CITIES, cityToTitle } from '@/lib/seo/cities'

const MapSection = dynamic<{ city: string }>(() => import('./sections/Map'), {
  loading: () => <div className="rounded-xl border bg-muted/40 h-64 w-full animate-pulse" />
})

const TrendsSection = dynamic(() => import('./sections/Trends'), {
  loading: () => <div className="rounded-xl border bg-muted/40 h-64 w-full animate-pulse" />
})

type SimpleFAQ = { question: string; answer: string }
interface Props { data: LandingData; faqItems?: SimpleFAQ[]; faqJsonLd?: any }

export default function LandingTemplate({ data, faqItems, faqJsonLd }: Props) {
  const { city, kind } = data
  const featured = data.featured || []
  const citySlug = city.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col pb-24 pt-14">
      {city && (
        <CitySchema
          city={city}
          canonical={`/california/${citySlug}/${kind}`}
          featured={(featured || []).map(f => ({ id: f.listingKey, url: (f as any).url || undefined }))}
          variant={kind}
        />
      )}

      {/* Main constrained container */}
      <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12">
        <Hero city={city} kind={kind} />

        {/* Short intro stays compact */}
        <Intro html={data.introHtml} />

        {/* Bigger, nicer text + inline images */}
        <AIDescription city={city} kind={kind} html={data.aiDescriptionHtml} />

        <StatsSection stats={data.stats} />

        {/* Featured */}
        <section className="pt-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-brand-midnightCove">Featured Listings</h2>
          </div>
          {!featured.length && (
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-neutral-200/60 dark:border-slate-700 bg-muted/40 h-64 animate-pulse shadow-sm" />
              ))}
            </div>
          )}
          {!!featured.length && (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {featured.map(f => {
                const adapted: any = {
                  _id: f.listingKey,
                  id: f.listingKey,
                  listing_key: f.listingKey,
                  property_type: f.status || 'Residential',
                  list_price: f.price || 0,
                  address: f.address || f.title || `${f.city}${f.state ? ', ' + f.state : ''}`,
                  city: f.city,
                  county: f.state || '',
                  bedrooms: f.beds || 0,
                  bathrooms: f.baths || 0,
                  lot_size_sqft: f.sqft || 0,
                  listing_photos: f.img ? [f.img] : [],
                  images: f.img ? [f.img] : [],
                  main_photo_url: f.img || null,
                  status: f.status || 'Active'
                }
                return <PropertyCard key={f.listingKey} property={adapted} showCompareButton={false} />
              })}
            </div>
          )}
        </section>
      </div>

      {/* Map */}
      <div className="w-full mt-6">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<div className="h-64 rounded-xl border bg-muted animate-pulse" />}>
            <MapSection city={city} />
          </Suspense>
        </div>
      </div>

      {/* Bottom stack */}
      <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12 mt-12">
        <FAQSection
          items={(faqItems && faqItems.length
            ? faqItems.map(f => ({ q: f.question, a: f.answer }))
            : data.faq)}
        />
        {faqJsonLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
        )}
        <RelatedLinksSection links={data.related} />
        {/* <RelatedCitiesSection cities={data.relatedCities} /> */}
        <RelatedVariants citySlug={citySlug} currentSlug={kind} />

        <section className="mt-4">
          <h3 className="text-lg font-semibold mb-4">Related California Cities</h3>
          <div className="flex flex-wrap gap-2">
            {CA_CITIES.slice(0, 12).map(c => (
              <Link
                key={c}
                href={`/california/${c}/homes-for-sale`}
                className="rounded-full border px-3 py-1 text-xs font-medium hover:bg-accent transition-colors"
              >
                {cityToTitle(c)}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

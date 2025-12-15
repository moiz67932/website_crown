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

// Helper component to render a section with heading and body
function ContentSection({ section, className }: { section?: { heading?: string; body?: string; cards?: any[]; cta?: any }; className?: string }) {
  if (!section || (!section.heading && !section.body)) return null
  
  // Convert body text with newlines and bullets to proper HTML
  const renderBody = (body: string) => {
    const parts = body.split('\n\n').filter(p => p.trim())
    return parts.map((part, i) => {
      // Check if it's a bullet list
      if (part.trim().startsWith('- ')) {
        const items = part.split('\n').filter(line => line.trim().startsWith('- '))
        return (
          <ul key={i} className="list-disc pl-5 space-y-2 my-4">
            {items.map((item, j) => (
              <li key={j} className="text-gray-700 dark:text-gray-300">{item.replace(/^-\s*/, '')}</li>
            ))}
          </ul>
        )
      }
      return <p key={i} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">{part.trim()}</p>
    })
  }

  return (
    <section className={className}>
      {section.heading && (
        <h2 className="text-2xl sm:text-3xl font-bold text-brand-midnightCove mb-4">{section.heading}</h2>
      )}
      {section.body && (
        <div className="prose prose-lg dark:prose-invert max-w-none">
          {renderBody(section.body)}
        </div>
      )}
    </section>
  )
}

// Helper component to render neighborhood cards
function NeighborhoodCards({ section }: { section?: { heading?: string; body?: string; cards?: any[] } }) {
  if (!section?.cards?.length) return null
  
  return (
    <section>
      {section.heading && (
        <h2 className="text-2xl sm:text-3xl font-bold text-brand-midnightCove mb-4">{section.heading}</h2>
      )}
      {section.body && (
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">{section.body}</p>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {section.cards.map((card, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow">
            {card.name && <h3 className="text-lg font-semibold text-brand-midnightCove mb-2">{card.name}</h3>}
            {card.blurb && <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{card.blurb}</p>}
            {card.best_for?.length > 0 && (
              <p className="text-sm text-gray-500 mb-3">
                <strong>Best for:</strong> {card.best_for.join(', ')}
              </p>
            )}
            {card.internal_link_href && card.internal_link_text && (
              <Link href={card.internal_link_href} className="text-sm text-brand-midnightCove hover:underline font-medium">
                {card.internal_link_text} →
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

// Helper component to render buyer strategy with CTA
function BuyerStrategySection({ section }: { section?: { heading?: string; body?: string; cta?: any } }) {
  if (!section) return null
  
  // Convert body text with bullets
  const renderBody = (body: string) => {
    const parts = body.split('\n\n').filter(p => p.trim())
    return parts.map((part, i) => {
      if (part.trim().startsWith('- ')) {
        const items = part.split('\n').filter(line => line.trim().startsWith('- '))
        return (
          <ul key={i} className="list-disc pl-5 space-y-2 my-4">
            {items.map((item, j) => (
              <li key={j} className="text-gray-700 dark:text-gray-300">{item.replace(/^-\s*/, '')}</li>
            ))}
          </ul>
        )
      }
      return <p key={i} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">{part.trim()}</p>
    })
  }

  return (
    <section>
      {section.heading && (
        <h2 className="text-2xl sm:text-3xl font-bold text-brand-midnightCove mb-4">{section.heading}</h2>
      )}
      {section.body && (
        <div className="prose prose-lg dark:prose-invert max-w-none mb-6">
          {renderBody(section.body)}
        </div>
      )}
      {section.cta && (
        <div className="bg-brand-midnightCove/5 rounded-xl p-6 border border-brand-midnightCove/20">
          {section.cta.title && <h3 className="text-xl font-semibold text-brand-midnightCove mb-2">{section.cta.title}</h3>}
          {section.cta.body && <p className="text-gray-700 dark:text-gray-300 mb-4">{section.cta.body}</p>}
          {section.cta.button_href && section.cta.button_text && (
            <Link 
              href={section.cta.button_href} 
              className="inline-flex items-center px-6 py-3 bg-brand-midnightCove text-white rounded-lg font-medium hover:bg-brand-midnightCove/90 transition-colors"
            >
              {section.cta.button_text}
            </Link>
          )}
        </div>
      )}
    </section>
  )
}

export default function LandingTemplate({ data, faqItems, faqJsonLd }: Props) {
  const { city, kind, dbContent } = data
  // Filter out any Land properties (safety check - should already be filtered from DB)
  const featured = (data.featured || []).filter(
    (f: any) => !f.propertyType?.toLowerCase().includes('land') && 
                !f.property_type?.toLowerCase().includes('land') &&
                !f.status?.toLowerCase().includes('land')
  )
  const citySlug = city.toLowerCase().replace(/\s+/g, '-')

  console.log('🎨 [LandingTemplate] Rendering with data:', {
    city,
    kind,
    featuredCount: featured.length,
    hasStats: !!data.stats,
    stats: data.stats,
    hasDbContent: !!dbContent,
    dbContentKeys: dbContent ? Object.keys(dbContent) : [],
    dbSectionKeys: dbContent?.sections ? Object.keys(dbContent.sections) : [],
    hasAiDescriptionHtml: !!data.aiDescriptionHtml,
    aiHtmlLength: data.aiDescriptionHtml?.length || 0,
    firstFeatured: featured[0] || null
  })

  // Extract content from DB
  const introContent = dbContent?.intro
  const trustContent = dbContent?.trust
  const sections = dbContent?.sections

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

        {/* Intro from DB content - show quick bullets if available */}
        {introContent && (
          <section className="prose dark:prose-invert max-w-none">
            {introContent.subheadline && (
              <p className="text-xl text-muted-foreground italic mb-4">{introContent.subheadline}</p>
            )}
            {introContent.quick_bullets && introContent.quick_bullets.length > 0 && (
              <ul className="grid gap-3 sm:grid-cols-2 list-disc pl-5">
                {introContent.quick_bullets.map((bullet, i) => (
                  <li key={i} className="text-gray-700 dark:text-gray-300">{bullet}</li>
                ))}
              </ul>
            )}
            {introContent.last_updated_line && (
              <p className="text-xs text-muted-foreground mt-4">{introContent.last_updated_line}</p>
            )}
          </section>
        )}

        {/* Fallback intro if no DB content */}
        {!introContent && <Intro html={data.introHtml} />}

        {/* === RENDER ALL DB SECTIONS DIRECTLY === */}
        
        {/* Hero Overview Section */}
        <ContentSection section={sections?.hero_overview} />
        
        {/* About the Area Section */}
        <ContentSection section={sections?.about_area} />
        
        {/* Market Snapshot Section */}
        <ContentSection section={sections?.market_snapshot} />

        <StatsSection stats={data.stats} />

        {/* Property Types Section */}
        <ContentSection section={sections?.property_types} />

        {/* Neighborhoods Section with Cards */}
        <NeighborhoodCards section={sections?.neighborhoods} />

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
                return <PropertyCard key={f.listingKey} property={adapted} />
              })}
            </div>
          )}
        </section>

        {/* Trust / Agent Box from DB content */}
        {trustContent && (
          <section className="bg-muted/30 rounded-xl p-6 border">
            {trustContent.agent_box && (
              <div className="mb-4">
                {trustContent.agent_box.headline && (
                  <h3 className="text-lg font-semibold mb-2">{trustContent.agent_box.headline}</h3>
                )}
                {trustContent.agent_box.body && (
                  <p className="text-muted-foreground">{trustContent.agent_box.body}</p>
                )}
                {trustContent.agent_box.disclaimer && (
                  <p className="text-xs text-muted-foreground mt-2 italic">{trustContent.agent_box.disclaimer}</p>
                )}
              </div>
            )}
            {trustContent.about_brand && (
              <p className="text-sm text-muted-foreground">{trustContent.about_brand}</p>
            )}
          </section>
        )}

        {/* Buyer Strategy Section with CTA */}
        <BuyerStrategySection section={sections?.buyer_strategy} />

        {/* Schools/Education Section */}
        <ContentSection section={sections?.schools_education} />

        {/* Lifestyle/Amenities Section */}
        <ContentSection section={sections?.lifestyle_amenities} />

        {/* Working with Agent Section */}
        <ContentSection section={sections?.working_with_agent} />
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
          <div className="flex flex-wrap gap-3">
            {CA_CITIES.slice(0, 12).map(c => (
              <Link
                key={c}
                href={`/california/${c}/homes-for-sale`}
                className="rounded-full border px-5 py-3 min-h-[44px] flex items-center text-sm font-medium hover:bg-accent transition-colors active:scale-95"
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

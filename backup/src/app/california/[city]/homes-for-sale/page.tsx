import type { Metadata } from 'next'
import LandingTemplate from '@/components/landing/LandingTemplate'
import { getLandingData } from '@/lib/landing/query'
import { CA_CITIES, cityToTitle, slugToCity } from '@/lib/seo/cities'

// Pre-render only CA cities for launch
export async function generateStaticParams() {
  return CA_CITIES.map(city => ({ city }))
}

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const citySlug = String(params.city).toLowerCase()
  const cityName = cityToTitle(citySlug)
  const baseTitle = `${cityName}, CA Homes For Sale`
  const canonical = `/california/${citySlug}/homes-for-sale`

  return {
    title: baseTitle,
    description: `Explore ${baseTitle}: active listings, photos, prices, and local insights updated daily.`,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title: baseTitle,
      description: `See ${baseTitle} with real-time market data.`,
      url: canonical,
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: baseTitle,
      description: `See ${baseTitle} with real-time market data.`
    }
  }
}

export default async function Page({ params }: any) {
  const cityName = slugToCity(String(params.city || ''))
  // Reuse existing landing data fetcher; 'homes-for-sale' kind aligns with previous route assumption.
  const data = await getLandingData(cityName, 'homes-for-sale')
  return <LandingTemplate data={data} />
}

import { Metadata } from 'next'
import LandingTemplate from '../../../components/landing/LandingTemplate'
import { getLandingData } from '@/lib/landing/query'
import { LandingKind } from '@/types/landing'

// In newer Next.js versions, params in async components must be awaited.
interface PageParams { params: Promise<{ city: string }> }

const kind: LandingKind = 'homes-for-sale'

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { city } = await params
  // Lightweight metadata build without triggering AI / DB heavy calls twice.
  const baseTitle = city.replace(/[-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) + ' Homes For Sale'
  return {
    title: baseTitle,
    description: `Explore ${baseTitle} listings, real-time stats, and local housing insights.`,
    alternates: { canonical: `/${city}/${kind}` },
    openGraph: {
      title: baseTitle,
      description: `Explore ${baseTitle} listings, real-time stats, and local housing insights.`,
      url: `/${city}/${kind}`,
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: baseTitle,
      description: `Explore ${baseTitle} listings, real-time stats, and local housing insights.`
    }
  }
}

export default async function Page({ params }: PageParams) {
  const { city } = await params
  const data = await getLandingData(city, kind)
  return <LandingTemplate data={data} />
}

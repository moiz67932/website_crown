'use client'
import dynamic from 'next/dynamic'

const GA4 = dynamic(() => import('@/components/analytics/GA4'), { ssr: false })
const Heatmap = dynamic(() => import('@/components/analytics/Heatmap'), { ssr: false })
const Consent = dynamic(() => import('@/components/analytics/Consent'), { ssr: false })
const WebVitals = dynamic(() => import('@/components/analytics/WebVitals'), { ssr: false })

export default function AnalyticsMount() {
  return (
    <>
      <Consent>
        <GA4 />
        <Heatmap />
      </Consent>
      <WebVitals />
    </>
  )
}

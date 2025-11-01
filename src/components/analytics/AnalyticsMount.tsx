'use client'
import dynamic from 'next/dynamic'

const GA4 = dynamic(() => import('../analytics/GA4'), { ssr: false })
const Heatmap = dynamic(() => import('../analytics/Heatmap'), { ssr: false })
const Consent = dynamic(() => import('../analytics/Consent'), { ssr: false })
const WebVitals = dynamic(() => import('../analytics/WebVitals'), { ssr: false })

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

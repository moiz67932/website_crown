'use client'
import * as React from 'react'
import { onCLS, onLCP, onINP, onTTFB, onFCP } from 'web-vitals'

export default function WebVitals() {
  React.useEffect(() => {
    function send(metric: any) {
      try {
        navigator.sendBeacon?.('/api/analytics/vitals', JSON.stringify(metric))
      } catch {}
    }
    onCLS(send); onLCP(send); onINP(send); onTTFB(send); onFCP(send)
  }, [])
  return null
}
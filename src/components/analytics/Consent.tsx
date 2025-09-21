'use client'
import * as React from 'react'

const KEY = 'cc_cookie_consent'
export default function Consent({ children }: { children?: React.ReactNode }) {
  const [consent, setConsent] = React.useState<string | null>(null)

  React.useEffect(() => {
    try { setConsent(localStorage.getItem(KEY)) } catch {}
  }, [])

  if (consent === 'granted') return <>{children}</>
  return (
    <div className="fixed bottom-0 inset-x-0 z-[200] bg-white border-t">
      <div className="max-w-5xl mx-auto p-3 flex items-center justify-between gap-3">
        <div className="text-sm text-gray-700">
          We use cookies to analyze traffic and improve your experience. See our <a className="underline" href="/privacy">Privacy Policy</a>.
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1 rounded bg-gray-100" onClick={() => { try { localStorage.setItem(KEY,'denied') } catch {}; location.reload() }}>Deny</button>
          <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={() => { try { localStorage.setItem(KEY,'granted') } catch {}; location.reload() }}>Allow</button>
        </div>
      </div>
    </div>
  )
}
"use client"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChatCore, ChatCoreHandle } from "./ChatCore"
import type { ChatOpenAndSendPayload } from "@/contexts/chat-bus"

type Snapshot = {
  id?: string
  listing_key?: string
  address?: string
  city?: string
  state?: string
  price?: number
  living_area_sqft?: number
  property_tax_annual?: number
  hoa?: number
  home_insurance_annual?: number
  image?: string
}

function usePropertyContext(): { propertyId?: string; snapshot?: Snapshot } {
  const [state, setState] = useState<{ propertyId?: string; snapshot?: Snapshot }>({})

  useEffect(() => {
    let mounted = true

    // Strategy A: window injection
    const w: any = typeof window !== "undefined" ? window : undefined
    const injected = w && w.__activeProperty
    if (injected && mounted) {
      const id = injected.listing_key || injected.id || undefined
      setState({ propertyId: id, snapshot: injected })
      return
    }

    // Strategy B: URL parse + fetch
  const path = typeof window !== "undefined" ? window.location.pathname : ""
  const m = /\/properties\/(?:[^/]+)\/([^/]+)/i.exec(path) || /\/properties\/([^/]+)/i.exec(path)
    const listingKey = m?.[1]
    if (!listingKey) return
    ;(async () => {
      try {
        const r = await fetch(`/api/property-snapshot?listing_key=${encodeURIComponent(listingKey)}`)
        if (!r.ok) return
        const s = await r.json()
        if (mounted) setState({ propertyId: listingKey, snapshot: s })
      } catch {}
    })()

    return () => { mounted = false }
  }, [])

  return state
}

export function ChatWidget() {
  const { propertyId, snapshot } = usePropertyContext()
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [speakEnabled, setSpeakEnabled] = useState(false)
  const chatRef = useRef<ChatCoreHandle | null>(null)
  const [callOn, setCallOn] = useState(false)
  const [callSeconds, setCallSeconds] = useState(0)
  // Track dynamic property context overrides sent via bus
  const [propContext, setPropContext] = useState<{ propertyId?: string; snapshot?: Snapshot }>({})

  // prepare portal container
  const container = useMemo(() => {
    if (typeof document === "undefined") return null
    const el = document.createElement("div")
    el.setAttribute("id", "cc-chat-widget-root")
    return el
  }, [])

  useEffect(() => {
    if (!container || typeof document === "undefined") return
    document.body.appendChild(container)
    setReady(true)
    return () => { try { document.body.removeChild(container) } catch {} }
  }, [container])

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Bridge: listen to global chat-bus events
  useEffect(() => {
    const onOpenOnly = () => setOpen(true)
    const onCloseOnly = () => setOpen(false)
    const onSetContext = (e: Event) => {
      const detail = (e as CustomEvent<any>).detail || {}
      const id = detail.listing_key || detail.id
      setPropContext({ propertyId: id, snapshot: detail })
    }
    const onOpenAndSend = async (e: Event) => {
      const detail = (e as CustomEvent<ChatOpenAndSendPayload>).detail
      if (!detail) return
      // Optional context override
      if (detail.propertyContext) {
        const id = detail.propertyContext.listing_key || detail.propertyContext.id
        setPropContext({ propertyId: id, snapshot: detail.propertyContext as any })
      }
      // Open widget and send via ChatCore input by programmatic value set
      setOpen(true)
      // Send message by invoking ChatCore's internal input handler
      try {
        // ChatCore exposes no direct sendMessage; simulate by dispatching a custom event it listens to
        window.dispatchEvent(new CustomEvent("cc-chatcore-send", { detail: { text: detail.message } }))
      } catch {}
    }

    window.addEventListener("cc-open-chat", onOpenOnly as any)
    window.addEventListener("cc-close-chat", onCloseOnly as any)
    window.addEventListener("cc-set-property-context", onSetContext as any)
    window.addEventListener("cc-open-chat-and-send", onOpenAndSend as any)
    return () => {
      window.removeEventListener("cc-open-chat", onOpenOnly as any)
      window.removeEventListener("cc-close-chat", onCloseOnly as any)
      window.removeEventListener("cc-set-property-context", onSetContext as any)
      window.removeEventListener("cc-open-chat-and-send", onOpenAndSend as any)
    }
  }, [])

  // Focus management: when open, focus first input found within
  useEffect(() => {
    if (!open) return
    const el = panelRef.current?.querySelector('input') as HTMLInputElement | null
    if (el) setTimeout(() => el.focus(), 50)
  }, [open])

  // Light focus trap inside panel
  useEffect(() => {
    if (!open) return
    const root = panelRef.current
    if (!root) return
    const focusables = () => Array.from(root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )).filter(el => el.offsetParent !== null)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const els = focusables()
      if (!els.length) return
      const first = els[0]
      const last = els[els.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey) {
        if (active === first || !root.contains(active)) {
          e.preventDefault(); last.focus()
        }
      } else {
        if (active === last) { e.preventDefault(); first.focus() }
      }
    }
    root.addEventListener('keydown', onKeyDown)
    return () => root.removeEventListener('keydown', onKeyDown)
  }, [open])

  const [consented, setConsented] = useState<boolean>(true)
  useEffect(() => {
    try { setConsented(localStorage.getItem('cc_cookie_consent') === 'granted') } catch {}
  }, [])

  const panel = (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {/* Bubble button */}
      <button
        aria-label={open ? "Close chat" : "Open chat"}
        onClick={() => setOpen((v) => !v)}
        className={`pointer-events-auto fixed right-5 w-14 h-14 rounded-full shadow-xl bg-blue-600 text-white flex items-center justify-center ${consented ? 'bottom-5' : 'bottom-20'}`}
      >
        {open ? "×" : "💬"}
      </button>

      {/* Popup panel */}
  <div ref={panelRef} className={`pointer-events-auto fixed right-5 w-[380px] max-w-[92vw] h-[70vh] max-h-[80vh] bg-white rounded-2xl shadow-2xl border overflow-hidden flex flex-col transition transform origin-bottom-right ${consented ? 'bottom-20' : 'bottom-32'} ${open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
          <div className="font-semibold">Crown Coastal AI</div>
          <div className="flex items-center gap-2">
            {callOn && (
              <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">
                ● Connected {String(Math.floor(callSeconds / 60)).padStart(2, "0")}:{String(callSeconds % 60).padStart(2, "0")}
              </span>
            )}
            <button
              type="button"
              className={`text-sm px-2 py-1 rounded ${speakEnabled ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-700"}`}
              onClick={() => setSpeakEnabled((v) => !v)}
              aria-label="Toggle voice replies"
              title="Toggle voice replies"
            >
              🔊
            </button>
            <button
              type="button"
              onClick={() => chatRef.current?.toggleCall()}
              className={`text-sm px-2 py-1 rounded ${callOn ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-700"}`}
              aria-label={callOn ? "End call" : "Start call"}
              title={callOn ? "End call" : "Start call"}
            >
              {callOn ? "End" : "🎤"}
            </button>
            <button aria-label="Close chat" onClick={() => setOpen(false)} className="text-gray-600 hover:text-gray-900">×</button>
          </div>
        </div>
        {/* Chat body */}
        <ChatCore
          ref={chatRef}
          defaultLang="en"
          propertyId={propContext.propertyId || propertyId}
          propertySnapshot={propContext.snapshot || snapshot}
          hideHeader
          speakEnabled={speakEnabled}
          onSpeakEnabledChange={setSpeakEnabled}
          onCallStateChange={({ callOn, seconds }) => { setCallOn(callOn); setCallSeconds(seconds) }}
        />
      </div>
    </div>
  )

  if (!ready || !container) return null
  return createPortal(panel, container)
}

/*
Acceptance checklist (ChatWidget):
- Floating bubble bottom-right opens/closes a popup with transition.
- ESC closes. Keeps conversation state (ChatCore session uses localStorage).
- When on property page, detects context via window.__activeProperty else URL+fetch.
- Popup mounts ChatCore and reuses all behavior.
*/

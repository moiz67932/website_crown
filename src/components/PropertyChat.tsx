"use client"
import { useMemo, useState, useEffect } from "react"
import { PropertyCards } from "./PropertyCards"
import { openChatAndSend, setPropertyContext } from "@/contexts/chat-bus"

type Msg = { from: "user" | "bot"; text: string }

export function PropertyChat({
  propertyId,
  snapshot,
  lang = "en",
}: {
  propertyId: string
  snapshot?: any
  lang?: string
}) {
  const [msg, setMsg] = useState("")
  const [log, setLog] = useState<Msg[]>([])
  const [cards, setCards] = useState<any[]>([])
  const session = useMemo(() => crypto.randomUUID(), [])

  // Keep the floating chat property context in sync on mount and when property changes
  useEffect(() => {
    try { setPropertyContext({ listing_key: propertyId, ...(snapshot || {}) }) } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId])

  async function send() {
    const text = msg.trim()
    if (!text) return
    // 1) Dispatch to floating chat: open and send; include property context
    openChatAndSend(text, { listing_key: propertyId, ...(snapshot || {}) })
    // 2) Also show a local echo in this mini box so user sees immediate feedback
    setLog((l) => [...l, { from: "user", text }])
    setMsg("")
    // 3) Optionally also call API here to keep this mini log alive with bot reply (non-blocking)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          session_id: session,
          lang,
          property_id: propertyId,
          property_snapshot: snapshot,
        }),
      })
      const r = await res.json()
      if (r?.answer) setLog((l) => [...l, { from: "bot", text: r.answer }])
      if (r?.result?.items) setCards(r.result.items)
    } catch {}
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2 max-h-72 overflow-auto pr-1">
        {log.map((m, i) => (
          <div key={i} className={m.from === "user" ? "text-right" : ""}>
            <div className={`inline-block px-3 py-2 rounded-lg ${m.from === "user" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Ask about this property, neighborhood, or mortgage..."
        />
        <button onClick={send} className="px-4 py-2 rounded-lg bg-blue-600 text-white">
          Ask
        </button>
      </div>
      {cards.length > 0 && (
        <div>
          <h4 className="font-semibold mt-4">Matching Listings</h4>
          <PropertyCards items={cards} />
        </div>
      )}
    </div>
  )
}

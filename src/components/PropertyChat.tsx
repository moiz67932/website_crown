"use client"
import { useMemo, useState } from "react"
import { PropertyCards } from "@/components/PropertyCards"

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

  async function send() {
    if (!msg.trim()) return
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: msg,
        session_id: session,
        lang,
        property_id: propertyId,
        property_snapshot: snapshot,
      }),
    })
    const r = await res.json()
    setLog((l) => [...l, { from: "user", text: msg }, { from: "bot", text: r.answer }])
    setMsg("")
    if (r.result?.items) setCards(r.result.items)
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
          className="flex-1 border rounded-lg px-3 py-2"
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

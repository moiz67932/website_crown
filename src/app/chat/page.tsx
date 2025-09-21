"use client"
import { useState } from "react"
import { PropertyCards } from "@/components/PropertyCards"

export default function ChatPage() {
  const [msg, setMsg] = useState("")
  const [log, setLog] = useState<{ from: "user" | "bot"; text: string }[]>([])
  const [cards, setCards] = useState<any[]>([])
  const [session] = useState<string>(() => crypto.randomUUID())

  async function send() {
    if (!msg.trim()) return
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, session_id: session, lang: "en" }),
    }).then((r) => r.json())
    setLog((l) => [...l, { from: "user", text: msg }, { from: "bot", text: r.answer }])
    setMsg("")
    if (r.result?.items) setCards(r.result.items)
  }

  async function rate(v: 1 | -1) {
    const note = prompt("Optional note?") || undefined
    await fetch("/api/chat/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: session, rating: v, note }),
    })
    alert("Thanks for the feedback!")
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4 mt-24 pt-72">
      <div className="space-y-2">
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
          placeholder="Ask about homes, neighborhoods, or mortgages..."
        />
        <button onClick={send} className="px-4 py-2 rounded-lg bg-blue-600 text-white">
          Send
        </button>
      </div>
      <div className="flex gap-3">
        <button className="text-sm text-gray-600" onClick={() => rate(1)}>👍 Helpful</button>
        <button className="text-sm text-gray-600" onClick={() => rate(-1)}>👎 Not helpful</button>
      </div>
      {cards.length > 0 && (
        <>
          <h3 className="font-semibold mt-6">Matching Listings</h3>
          <PropertyCards items={cards} />
        </>
      )}
    </div>
  )
}

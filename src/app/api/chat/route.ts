export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { performance } from "node:perf_hooks"
import { getOpenAI } from "@/lib/singletons"
import { maybeRetrieveContext } from "@/lib/retrieval"
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"

const enc = new TextEncoder()
const greetings = new Set([
  "hi", "hello", "hey", "hiya", "yo",
  "salam", "asalam o alaikum", "as-salamu alaykum", "aoa",
  "hey there", "hi!",
])

function serverTimingHeader(marks: Record<string, number>): string {
  return Object.entries(marks)
    .map(([k, v]) => `${k};dur=${Math.max(0, Math.round(v))}`)
    .join(", ")
}

function isTiny(text: string): boolean {
  const t = text.trim().toLowerCase()
  if (!t) return true
  if (greetings.has(t)) return true
  if (t.length <= 3) return true
  return false
}

export async function POST(req: Request) {
  const t0 = performance.now()
  const marks: Record<string, number> = {}

  let body: any
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Bad JSON in request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    })
  }

  const message = String(body?.message ?? "").trim()
  if (!message) {
    return new Response(JSON.stringify({ error: "Field message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    })
  }

  // FAST PATH: greetings / tiny inputs → no LLM, no DB, return instantly
  if (isTiny(message)) {
    const resp = { answer: "Hi! How can I help?" }
    marks.total = performance.now() - t0
    return new Response(JSON.stringify(resp), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Server-Timing": serverTimingHeader(marks),
      },
    })
  }

  // Optional: cheap heuristic to decide if we should do retrieval
  const tPre = performance.now()
  const shouldRetrieve = message.length > 40 // tune as needed
  let retrievedContext = ""
  if (shouldRetrieve) {
    try {
      retrievedContext = await maybeRetrieveContext(message)
    } catch {
      // Don't fail the request if retrieval is down; proceed without context
      retrievedContext = ""
    }
  }
  marks.pre = performance.now() - tPre

    const openai = getOpenAI()

    // Non-streaming JSON response to match existing UI consumers
    const tLlm = performance.now()
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: "You are a concise, helpful assistant." },
      { role: "user", content: message },
    ]
    if (retrievedContext) {
      messages.splice(1, 0, { role: "system", content: `Context:\n${retrievedContext}` })
    }
    let answer = ""
    try {
      const completion = await openai.chat.completions.create({
        model: process.env.CHAT_MODEL ?? "gpt-4o-mini",
        stream: false,
        temperature: 0.3,
        messages,
      })
      marks.llm = performance.now() - tLlm
      answer = completion.choices?.[0]?.message?.content ?? ""
    } catch (e: any) {
      answer = "Sorry, something went wrong."
    }

    marks.total = performance.now() - t0
    return new Response(JSON.stringify({ answer }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Server-Timing": serverTimingHeader(marks),
      },
    })
}


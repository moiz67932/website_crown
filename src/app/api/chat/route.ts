export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { performance } from "node:perf_hooks"
import { getOpenAI } from "@/lib/singletons"
import { maybeRetrieveContext } from "@/lib/retrieval"
import { detectIntent } from "@/lib/intents"
import { getAgentPrimary } from "../../../config/agents"
import type { ChatUISpec } from "@/lib/ui-spec"
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

  // Intent routing (fast)
  const tIntent = performance.now()
  const intent = detectIntent(message)
  marks.route = performance.now() - tIntent

  if (intent.type === "contact_agent") {
    const agent = getAgentPrimary()
    const propertyId = body?.propertyId || body?.property_id
    const propertySlug = body?.propertySlug || body?.property_slug
    const propertyTitle = body?.propertyTitle || body?.property_title || body?.property_snapshot?.address || body?.property_snapshot?.title

    const slugOrId = propertySlug || propertyId
    const contactForm = slugOrId ? `/properties/${encodeURIComponent(String(slugOrId))}#contact` : "/contact"
    const scheduleViewing = slugOrId ? `/properties/${encodeURIComponent(String(slugOrId))}#schedule` : "/schedule-viewing"

    const digits = (s?: string) => String(s || "").replace(/\D+/g, "")
    const defaultMsg = `Hi ${agent.name.split(" ")[0]}, I'm interested in buying a property.`

    const spec: ChatUISpec = {
      version: "1.0",
      blocks: [
        {
          type: "contact_agent",
          agent: {
            name: agent.name,
            title: agent.title,
            phone: agent.phone,
            whatsApp: agent.whatsApp,
            email: agent.email,
            photoUrl: agent.photoUrl,
          },
          context: slugOrId
            ? { propertyId: propertyId ? String(propertyId) : undefined, propertySlug: propertySlug ? String(propertySlug) : undefined, propertyTitle: propertyTitle ? String(propertyTitle) : undefined }
            : undefined,
          cta: {
            call: `tel:${agent.phone}`,
            whatsapp: agent.whatsApp ? `https://wa.me/${digits(agent.whatsApp)}?text=${encodeURIComponent(defaultMsg)}` : undefined,
            email: agent.email ? `mailto:${agent.email}?subject=${encodeURIComponent("Buying Inquiry")}` : undefined,
            contactForm,
            scheduleViewing,
          },
          note: "For buying inquiries, Reza is your primary point of contact.",
        },
      ],
    }

    marks.total = performance.now() - t0
    return new Response(JSON.stringify(spec), {
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

  // Streaming LLM for other intents
  const openai = getOpenAI()

  const SYSTEM_PROMPT = [
    "You are the Majid Real Estate website assistant.",
    "Be friendly and helpful. Answer user questions about buying, areas, listings, pricing, steps, and next actions.",
    "Prefer concise, practical answers in plain text (avoid Markdown styling).",
    "When the user explicitly asks to talk to someone, schedule a tour, or requests contact info, suggest contacting our lead agent Reza and include the available actions.",
    "Avoid giving long generic vendor lists (mortgage brokers, attorneys, title, inspectors); instead, offer to connect through Reza if needed.",
    "If unsure or out-of-scope, politely say so and suggest contacting Reza for assistance.",
  ].join(" ")

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ]
  if (retrievedContext) messages.push({ role: "system", content: `Context:\n${retrievedContext}` })
  messages.push({ role: "user", content: message })

  const tLlm = performance.now()
  const stream = await openai.chat.completions.create({
    model: process.env.CHAT_MODEL ?? "gpt-4o-mini",
    stream: true,
    temperature: 0.2,
    messages,
  })
  marks.llm = performance.now() - tLlm

  const encoder = new TextEncoder()
  const rs = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // @ts-ignore - the OpenAI SDK stream is an async iterable
        for await (const chunk of stream) {
          const delta = chunk?.choices?.[0]?.delta?.content || ""
          if (delta) controller.enqueue(encoder.encode(delta))
        }
      } catch (e) {
        controller.enqueue(encoder.encode("Sorry, something went wrong."))
      } finally {
        controller.close()
      }
    },
  })

  marks.total = performance.now() - t0
  return new Response(rs, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "Server-Timing": serverTimingHeader(marks),
    },
  })
}


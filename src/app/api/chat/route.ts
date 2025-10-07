export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { performance } from "node:perf_hooks"
import { getOpenAI } from "@/lib/singletons"
import { maybeRetrieveContext } from "@/lib/retrieval"
import { detectIntent, type DialogState } from "@/lib/intents"
import { getAgentPrimary } from "../../../config/agents"
import type { ChatUISpec } from "@/lib/ui-spec"
import { parseSearchFilters, summarizeFilters } from "@/lib/search/parse"
import { semanticSearchWithFilters } from "@/lib/search/query"
import { SYSTEM_CHATBOT } from "@/lib/system-prompts"
import { SupabaseAuthService } from "@/lib/supabase-auth"
import { ensureSessionForUser, appendMessage, getDialogState, updateDialogState } from "@/lib/chat/store"
import { getPropertyByListingKey } from "@/lib/db/properties"
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

  // Auth: determine user (Bearer token or cookie) to enable persistence
  let userId: string | null = null
  try {
    // Use SupabaseAuthService which reads bearer/cookie tokens
    // @ts-ignore - NextRequest not available in this context; emulate minimal object
    const fakeReq = { headers: req.headers, cookies: { get: () => null } } as any
    const u = await SupabaseAuthService.getCurrentUser(fakeReq)
    userId = u?.userId || null
  } catch {}

  // Load dialog state if logged in
  let sessionId: string | null = null
  let dialog: DialogState = { awaiting: "none" }
  if (userId) {
    sessionId = await ensureSessionForUser(userId)
    dialog = (await getDialogState(sessionId)) as DialogState
  }

  // Intent routing (fast)
  const tIntent = performance.now()
  const intent = detectIntent(message)
  marks.route = performance.now() - tIntent

  // Guard: Greeting fast-path only when empty conversation (no session) or no awaiting confirmation
  if (isTiny(message) && (!sessionId || dialog.awaiting === "none")) {
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

  // Handle confirmations first
  if (intent.type === "confirm" && dialog.awaiting === "contact_agent_confirm") {
    const agent = getAgentPrimary()
    const propertyId = body?.propertyId || body?.property_id
    const propertySlug = body?.propertySlug || body?.property_slug
    const propertyTitle = body?.propertyTitle || body?.property_title || body?.property_snapshot?.address || body?.property_snapshot?.title
    const slugOrId = propertySlug || propertyId
    const contactForm = slugOrId ? `/properties/${encodeURIComponent(String(slugOrId))}#contact` : "/contact"
    const scheduleViewing = slugOrId ? `/properties/${encodeURIComponent(String(slugOrId))}#schedule` : "/schedule-viewing"
    const digits = (s?: string) => String(s || "").replace(/\D+/g, "")
    const defaultMsg = `Hi ${agent.name.split(" ")[0]}, I'm interested in a property.`
    const spec: ChatUISpec = {
      version: "1.0",
      blocks: [
        {
          type: "contact_agent",
          agent: { name: agent.name, title: agent.title, phone: agent.phone, whatsApp: agent.whatsApp, email: agent.email, photoUrl: agent.photoUrl },
          context: slugOrId ? { propertyId: propertyId ? String(propertyId) : undefined, propertySlug: propertySlug ? String(propertySlug) : undefined, propertyTitle: propertyTitle ? String(propertyTitle) : undefined } : undefined,
          cta: { call: `tel:${agent.phone}`, whatsapp: agent.whatsApp ? `https://wa.me/${digits(agent.whatsApp)}?text=${encodeURIComponent(defaultMsg)}` : undefined, email: agent.email ? `mailto:${agent.email}?subject=${encodeURIComponent("Buying Inquiry")}` : undefined, contactForm, scheduleViewing },
          note: "For buying inquiries, Reza is your primary point of contact.",
        },
      ],
    }
    if (sessionId) await updateDialogState(sessionId, { awaiting: "none", lastIntent: "contact_agent" })
    marks.total = performance.now() - t0
    return new Response(JSON.stringify(spec), { headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Server-Timing": serverTimingHeader(marks) } })
  }

  // Property search branch
  if (intent.type === "property_search") {
    try {
      const filters = parseSearchFilters(message)
      const page = Math.max(1, Number(body?.page || filters.page || 1))
      const pageSize = Math.min(24, Math.max(1, Number(body?.pageSize || filters.pageSize || 6)))
      const offset = (page - 1) * pageSize
      console.log('[vector-search] chat route: property_search start', { message, filters, page, pageSize, offset })
      const cards = await semanticSearchWithFilters(message, { ...filters, page, pageSize }, pageSize)
      console.log('[vector-search] chat route: property_search results', { count: cards.length })
      let spec: ChatUISpec
      if (cards.length === 0) {
        const agent = getAgentPrimary()
        spec = {
          version: '1.0',
          blocks: [
            { type: 'notice', kind: 'info', text: 'No matches found. Try adjusting filters or contact our agent for curated options.' },
            {
              type: 'contact_agent',
              agent: { name: agent.name, title: agent.title, phone: agent.phone, whatsApp: agent.whatsApp, email: agent.email, photoUrl: agent.photoUrl },
              cta: { call: `tel:${agent.phone}`, whatsapp: agent.whatsApp ? `https://wa.me/${agent.whatsApp.replace(/\D/g, '')}` : undefined, email: agent.email ? `mailto:${agent.email}` : undefined, contactForm: '/contact', scheduleViewing: '/schedule-viewing' },
            },
          ],
        }
      } else {
        spec = {
          version: "1.0",
          blocks: [
            {
              type: "property_results",
              querySummary: summarizeFilters(filters),
              totalFound: cards.length,
              page,
              pageSize,
              items: cards,
              nextPage: false,
              rawQuery: message,
            },
          ],
        }
      }
      if (sessionId) {
        await appendMessage(sessionId, 'user', { text: message })
        await appendMessage(sessionId, 'assistant', spec)
        await updateDialogState(sessionId, { awaiting: 'none', lastSearchFilters: filters, lastIntent: 'property_search' })
      }
      marks.total = performance.now() - t0
      return new Response(JSON.stringify(spec), { headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Server-Timing": serverTimingHeader(marks) } })
    } catch (e: any) {
      console.error('[vector-search] chat route: property_search error', e?.message || e)
      const agent = getAgentPrimary()
      const spec: ChatUISpec = {
        version: '1.0',
        blocks: [
          { type: 'notice', kind: 'error', text: 'Search is unavailable right now. You can contact our agent for help.' },
          {
            type: 'contact_agent',
            agent: { name: agent.name, title: agent.title, phone: agent.phone, whatsApp: agent.whatsApp, email: agent.email, photoUrl: agent.photoUrl },
            cta: { call: `tel:${agent.phone}`, whatsapp: agent.whatsApp ? `https://wa.me/${agent.whatsApp.replace(/\D/g, '')}` : undefined, email: agent.email ? `mailto:${agent.email}` : undefined, contactForm: '/contact', scheduleViewing: '/schedule-viewing' },
          },
        ],
      }
      marks.total = performance.now() - t0
      return new Response(JSON.stringify(spec), { headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Server-Timing": serverTimingHeader(marks) } })
    }
  }

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

    if (sessionId) {
      await appendMessage(sessionId, 'user', { text: message })
      await appendMessage(sessionId, 'assistant', spec)
      await updateDialogState(sessionId, { awaiting: 'contact_agent_confirm', lastIntent: 'contact_agent' })
    }
    marks.total = performance.now() - t0
    return new Response(JSON.stringify(spec), { headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Server-Timing": serverTimingHeader(marks) } })
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

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_CHATBOT },
  ]
  // Property-aware context injection
  try {
    const pid = body?.property_id || body?.propertyId
    const psnap = body?.property_snapshot || body?.propertySnapshot
    let ctx: any = null
    if (psnap && typeof psnap === 'object') ctx = psnap
    else if (pid) {
      const row = await getPropertyByListingKey(String(pid))
      if (row) ctx = row
    }
    if (ctx) {
      const fields: string[] = []
      const push = (k: string, v: any) => {
        if (v === null || v === undefined || v === '' || (typeof v === 'number' && !isFinite(v))) return
        fields.push(`${k}: ${typeof v === 'number' ? v.toLocaleString?.() ?? String(v) : String(v)}`)
      }
      push('Listing Key', ctx.listing_key || ctx.id)
      push('Address', ctx.address || ctx.title)
      push('City', ctx.city)
      push('State', ctx.state || ctx.county)
      push('Price', ctx.list_price || ctx.price)
      push('Bedrooms', ctx.bedrooms)
      push('Bathrooms', ctx.bathrooms_total || ctx.bathrooms)
      push('Living Area (sqft)', ctx.living_area_sqft || ctx.living_area)
      push('Lot Size (sqft)', ctx.lot_size_sqft)
      push('Year Built', ctx.year_built)
      if (ctx.public_remarks) push('Description', String(ctx.public_remarks).slice(0, 600))
      const summary = `Current Property Context:\n${fields.join('\n')}`
      messages.push({ role: 'system', content: summary })
    }
  } catch {}
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


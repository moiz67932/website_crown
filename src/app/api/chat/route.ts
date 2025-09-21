import { NextRequest } from "next/server"
import { chatText } from "@/lib/openai"
import { classifyIntent } from "@/lib/router"
import { retrieve } from "@/lib/rag"
import { toolSearchProperties, mortgageBreakdown, toolScheduleViewing, toolCreateLeadDB } from "@/lib/tools"
import { logTurn, summarizeIfNeeded, ensureSession } from "@/lib/memory"
import { qdrant } from "@/lib/qdrant"

export async function POST(req: NextRequest) {
  const { message, session_id, lang, property_id, property_snapshot } = await req.json()

  // Ensure session with 24h expiry; language from request or classifier later
  await ensureSession(session_id, lang || "en")

  const { intent, entities } = await classifyIntent(message)

  let contextBlocks: string[] = []
  let resultPayload: any = null

  // Property-aware context: if a property_id is provided, try to retrieve its payload
  // Decision: use Qdrant retrieve API first; if not found, fall back to client-provided snapshot
  let activeProperty: any = null
  if (property_id) {
    try {
      const res: any = await (qdrant as any).retrieve("properties_seo_v1", {
        ids: [property_id],
        with_payload: true,
        with_vector: false as any,
      })
      activeProperty = res?.[0]?.payload || null
    } catch {
      activeProperty = null
    }
    if (!activeProperty && property_snapshot) activeProperty = property_snapshot
  }

  if (intent === "search_properties") {
    const items = await toolSearchProperties(entities)
    resultPayload = { items }
    contextBlocks = items.map((it: any, i: number) => `[${i + 1}] ${it.title} ${it.address} $${it.price}`)
  } else if (["neighborhood_info", "buying_process", "market_analysis", "general_faq"].includes(intent)) {
    // Project scope: use only the properties index as retrieval context
    const hits = await retrieve(message, undefined, 8)
    contextBlocks = hits.map((h: any, i: number) => `[${i + 1}] ${h.text}`)
  } else if (intent === "mortgage_calc") {
    const price = Number((entities as any).price ?? (entities as any).home_price ?? (entities as any).amount)
    const rate = Number((entities as any).rate ?? (entities as any).interest_rate)
    const years = Number((entities as any).years ?? (entities as any).term_years ?? 30)
    const rates: number[] = Array.isArray((entities as any).rates) ? (entities as any).rates.map((x: any) => Number(x)).filter((x: any) => x) : []
    const yearsOptions: number[] = Array.isArray((entities as any).years_options)
      ? (entities as any).years_options.map((x: any) => Number(x)).filter((x: any) => x)
      : []

    // If no price but we have an active property, default to its price for "this property" cases
    let effPrice = price
    if ((!effPrice || Number.isNaN(effPrice)) && activeProperty) {
      effPrice = Number(activeProperty.price || activeProperty.list_price)
    }

    if (!effPrice || !rate || !years) {
      const need: string[] = []
      if (!effPrice) need.push("price")
      if (!rate) need.push("rate")
      if (!years) need.push("years")
      const ask = `I can calculate that. Please provide: ${need.join(", ")}. Example: "price 500000, rate 6.5, years 30".`
      await logTurn(session_id, "user", message)
      await logTurn(session_id, "assistant", ask)
      await summarizeIfNeeded(session_id)
      return Response.json({ intent, entities, answer: ask })
    }

    const breakdown = mortgageBreakdown({
      price: effPrice,
      rate,
      years,
      down_payment: Number((entities as any).down_payment),
      property_tax_annual: Number((entities as any).property_tax_annual ?? (activeProperty?.property_tax_annual ?? undefined)),
      home_insurance_annual: Number((entities as any).home_insurance_annual),
      hoa: Number((entities as any).hoa ?? (activeProperty?.hoa ?? activeProperty?.hoa_monthly ?? undefined)),
      pmi_monthly: Number((entities as any).pmi_monthly),
    })

    let summary = `For $${effPrice.toLocaleString()} @ ${rate}% over ${years} years:
- Principal financed: $${breakdown.principal.toLocaleString()}
- Principal & interest: ~$${breakdown.pi}/mo
- Taxes: ~$${breakdown.tax}/mo • Insurance: ~$${breakdown.ins}/mo • HOA: ~$${breakdown.hoa}/mo • PMI: ~$${breakdown.pmi}/mo
- **Estimated total: ~$${breakdown.total}/mo**`

    // Optional comparisons
    const comparisons: Array<{ label: string; total: number }> = []
    if (rates.length >= 1) {
      for (const r of rates) {
        const b = mortgageBreakdown({
          price: effPrice,
          rate: r,
          years,
          down_payment: Number((entities as any).down_payment),
          property_tax_annual: Number((entities as any).property_tax_annual),
          home_insurance_annual: Number((entities as any).home_insurance_annual),
          hoa: Number((entities as any).hoa),
          pmi_monthly: Number((entities as any).pmi_monthly),
        })
        comparisons.push({ label: `${r}%`, total: b.total })
      }
    }
    if (yearsOptions.length >= 1) {
      for (const y of yearsOptions) {
        const b = mortgageBreakdown({
          price: effPrice,
          rate,
          years: y,
          down_payment: Number((entities as any).down_payment),
          property_tax_annual: Number((entities as any).property_tax_annual),
          home_insurance_annual: Number((entities as any).home_insurance_annual),
          hoa: Number((entities as any).hoa),
          pmi_monthly: Number((entities as any).pmi_monthly),
        })
        comparisons.push({ label: `${y}y`, total: b.total })
      }
    }
    if (comparisons.length) {
      const rows = comparisons.map((c) => `- ${c.label}: ~$${c.total}/mo`).join("\n")
      summary += `\n\nComparison:\n${rows}`
    }

    await logTurn(session_id, "user", message)
    await logTurn(session_id, "assistant", summary)
    await summarizeIfNeeded(session_id)
    return Response.json({ intent, entities, answer: summary, result: breakdown })
  }

  const sysAddendum = activeProperty
    ? `If a property_id is provided, that property is the primary subject ("this property"). If requested info is missing (e.g., HOA, taxes), say it's not available, offer to contact an agent, and ask for name/email/phone to follow up.`
    : ``

  const sys = `You are Crown Coastal Homes AI Assistant. Reply in the user's language (${lang || (entities as any).language || "en"}).
Use retrieved context where available. Be concise and helpful; for property searches show 3–6 top matches and offer a viewing or agent handoff.`
    + (sysAddendum ? `\n\n${sysAddendum}` : ``)

  const propCtx = activeProperty
    ? [
        `ACTIVE PROPERTY CONTEXT`,
        `Title: ${activeProperty.title || ""}`,
        `Address: ${activeProperty.address || ""}`,
        `Price: ${activeProperty.price || activeProperty.list_price || ""}`,
        `Beds/Baths/Sqft: ${activeProperty.beds || "?"}/${activeProperty.baths || "?"}/${activeProperty.sqft || "?"}`,
        `Taxes/HOA (annual/monthly): ${activeProperty.property_tax_annual || "?"}/${activeProperty.hoa || activeProperty.hoa_monthly || "?"}`,
      ].join("\n")
    : null

  const developer = [
    propCtx,
    contextBlocks.length ? `RAG Context:\n${contextBlocks.join("\n\n")}` : "No RAG context",
  ]
    .filter(Boolean)
    .join("\n\n")
  const answer = await chatText([
    { role: "system", content: sys },
    { role: "developer", content: developer },
    { role: "user", content: message },
  ])

  // Lead/schedule side effects AFTER composing answer
  if (intent === "schedule_viewing" && (entities as any).property_id && (entities as any).when && (entities as any).name && (entities as any).email) {
    resultPayload = await toolScheduleViewing({
      property_id: (entities as any).property_id,
      when: (entities as any).when,
      name: (entities as any).name,
      email: (entities as any).email,
      phone: (entities as any).phone,
    })
  }
  if (intent === "lead_capture" && (entities as any).name && (entities as any).email) {
    resultPayload = await toolCreateLeadDB({
      name: (entities as any).name,
      email: (entities as any).email,
      phone: (entities as any).phone,
      source: "chat",
      message: (entities as any).message,
      meta: { city: (entities as any).city, price_max: (entities as any).price_max },
    })
    // Also notify via existing email endpoint
    try {
      const proto = req.headers.get('x-forwarded-proto') || 'https'
      const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
      const base = `${proto}://${host}`
      await fetch(`${base}/api/send-lead-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: (entities as any).name,
          email: (entities as any).email,
          phone: (entities as any).phone,
          city: (entities as any).city,
          budgetMax: (entities as any).price_max,
          message: (entities as any).message,
          tags: (entities as any).property_id ? [`prop:${(entities as any).property_id}`] : (activeProperty ? [`prop:${activeProperty.id || activeProperty.slug || 'unknown'}`] : []),
        }),
      })
    } catch {}
  }

  await logTurn(session_id, "user", message)
  await logTurn(session_id, "assistant", answer)
  await summarizeIfNeeded(session_id)

  return Response.json({ intent, entities, answer, result: resultPayload })
}

/*
Test checklist (api/chat):
- POST /api/chat with new session_id → ensure chat_sessions upserted.
- Provide property_id matching a known property → developer block includes ACTIVE PROPERTY CONTEXT.
- Ask mortgage for this property without price → uses listing price; returns deterministic breakdown.
- Lead capture → inserts row and POSTs absolute URL to /api/send-lead-email.
*/

import type { LeadPayload, AssignedAgent } from './types'

type Routing = {
  defaultAgent?: AssignedAgent
  byCity?: Record<string, AssignedAgent>
  priceBrackets?: { max: number; agent: AssignedAgent }[]
  agents?: AssignedAgent[] // optional pool for round-robin fallback
}

let rr = 0

function getRouting(): Routing {
  const raw = process.env.AGENT_ROUTING_JSON
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return {} }
}

export function assignAgent(p: LeadPayload): AssignedAgent {
  const r = getRouting()
  const city = (p.city || '').toLowerCase().trim()
  if (city && r.byCity) {
    const direct = r.byCity[city]
    if (direct) return direct
    // loose contains
    for (const [k, v] of Object.entries(r.byCity)) {
      if (city.includes(k.toLowerCase())) return v
    }
  }
  if ((p.budgetMax ?? null) != null && r.priceBrackets?.length) {
    const sorted = [...r.priceBrackets].sort((a, b) => a.max - b.max)
    const chosen = sorted.find(b => (p.budgetMax as number) <= b.max)
    if (chosen) return chosen.agent
  }
  if (r.defaultAgent) return r.defaultAgent
  if (r.agents?.length) {
    const a = r.agents[rr % r.agents.length]
    rr++
    return a
  }
  return { name: 'Unassigned' }
}

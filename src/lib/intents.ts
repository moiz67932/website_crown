export type IntentType = "greet" | "property_search" | "contact_agent" | "schedule_viewing" | "confirm" | "other"
export type DetectedIntent = { type: IntentType; meta?: Record<string, any> }

const CONTACT_PATTERNS: RegExp[] = [
  /\b(contact|agent|realtor|broker)\b/i,
  /\b(call|phone|number|whats\s*app|whatsapp)\b/i,
  // NOTE: Do NOT trigger on generic buy/purchase mentions; it's too broad and
  // routes normal buyer questions away from the LLM. Only trigger when the user
  // explicitly asks to connect or schedule.
  /\b(speak|talk|reach|connect)\b/i,
  /\bwho(m)? to contact\b/i,
  /\bschedule (a )?(viewing|tour|visit)\b/i,
  /\bbook (a )?(tour|visit|showing|viewing)\b/i,
  /\bsee (the )?property\b/i,
]

export function detectIntent(message: string): DetectedIntent {
  const t = (message || "").trim().toLowerCase()
  if (!t) return { type: "other" }
  if (/^(hi|hello|hey|salam|aoa)$/.test(t)) return { type: "greet" }
  if (/^(yes|yep|yeah|sure|ok|okay|please do it|do it)$/.test(t)) return { type: "confirm" }

  const searchKeywords = [
    "show", "find", "list", "top", "best", "properties", "homes", "condos", "listings",
    "under", "below", "less than", "with pool", "pool", "ocean", "view", "garage", "new", "cheap"
  ]
  if (searchKeywords.some(k => t.includes(k)) || /\$?\d+([mk]|\s*million|\s*k)?/.test(t)) {
    return { type: "property_search" }
  }

  for (const re of CONTACT_PATTERNS) { if (re.test(t)) return { type: "contact_agent" } }
  if (/(schedule|book|viewing|tour|visit)/.test(t)) return { type: "schedule_viewing" }
  return { type: "other" }
}

export type DialogState = {
  awaiting?: "contact_agent_confirm" | "apply_filters_confirm" | "none"
  lastSearchFilters?: Record<string, any>
  lastIntent?: IntentType
}

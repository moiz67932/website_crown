export type DetectedIntent = { type: "contact_agent" | "other"; meta?: Record<string, any> }

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
  for (const re of CONTACT_PATTERNS) {
    if (re.test(t)) return { type: "contact_agent" }
  }
  return { type: "other" }
}

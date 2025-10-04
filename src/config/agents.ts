export type AgentConfig = {
  id: string
  name: string
  title?: string
  phone: string
  whatsApp?: string
  email?: string
  photoUrl?: string
}

const env = typeof process !== "undefined" ? process.env : ({} as Record<string, string | undefined>)

export const AGENT_REZA: AgentConfig = {
  id: "reza",
  name: env.AGENT_REZA_NAME || "Reza Khan",
  title: env.AGENT_REZA_TITLE || "Lead Buyer’s Agent",
  phone: env.AGENT_REZA_PHONE || "+92-300-0000000",
  whatsApp: env.AGENT_REZA_WHATSAPP || "+923000000000",
  email: env.AGENT_REZA_EMAIL || "reza@majidrealestate.com",
  photoUrl: env.AGENT_REZA_PHOTO_URL || "https://via.placeholder.com/160x160.png?text=Reza",
}

export function getAgentPrimary(): AgentConfig {
  return AGENT_REZA
}

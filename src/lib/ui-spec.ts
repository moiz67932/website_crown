export type ContactAgentBlock = {
  type: "contact_agent"
  agent: {
    name: string
    title?: string
    phone: string
    whatsApp?: string
    email?: string
    photoUrl?: string
  }
  context?: {
    propertyId?: string
    propertySlug?: string
    propertyTitle?: string
  }
  cta: {
    call: string
    whatsapp?: string
    email?: string
    contactForm: string
    scheduleViewing: string
  }
  note?: string
}

export type NoticeBlock = {
  type: "notice"
  kind: "success" | "info" | "warning" | "error"
  text: string
}

export type DividerBlock = { type: "divider" }

export type ChatUISpec = {
  version: "1.0"
  blocks: Array<ContactAgentBlock | NoticeBlock | DividerBlock>
}

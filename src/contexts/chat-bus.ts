"use client"

// Simple global event bus for the floating chat widget.
// Components can import these helpers to interact with the chat without tight coupling.

export type ChatOpenAndSendPayload = {
  message: string
  // Optional property context to bind the chat to a specific listing
  propertyContext?: {
    listing_key?: string
    id?: string
    [k: string]: any
  }
}

export function openChatAndSend(message: string, propertyContext?: ChatOpenAndSendPayload["propertyContext"]) {
  if (typeof window === "undefined") return
  const detail: ChatOpenAndSendPayload = { message, propertyContext }
  window.dispatchEvent(new CustomEvent("cc-open-chat-and-send", { detail }))
}

export function setPropertyContext(propertyContext: ChatOpenAndSendPayload["propertyContext"]) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent("cc-set-property-context", { detail: propertyContext }))
}

// Optional: expose a method to programmatically open/close the widget without sending a message
export function openChat() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent("cc-open-chat"))
}

export function closeChat() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent("cc-close-chat"))
}

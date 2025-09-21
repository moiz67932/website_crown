"use client"
import React from "react"
import { ChatWidget } from "./ChatWidget"

export function ChatWidgetProvider() {
  // Client-only mount; avoids SSR work.
  return <ChatWidget />
}

/*
Acceptance checklist (ChatWidgetProvider):
- Renders ChatWidget when included in layout; no SSR dependencies.
*/

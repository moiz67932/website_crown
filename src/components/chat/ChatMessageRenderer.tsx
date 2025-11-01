"use client"
import React from "react"
import type { ChatUISpec, ContactAgentBlock, NoticeBlock, DividerBlock, PropertyResultsBlock } from "../../lib/ui-spec"
import { ContactAgentCard } from "./blocks/ContactAgentCard"
import { PropertyResults } from "./blocks/PropertyResults"

function Notice({ kind, text }: { kind: NoticeBlock["kind"]; text: string }) {
  const map: Record<string, string> = {
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    info: "bg-blue-50 text-blue-800 border-blue-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    error: "bg-red-50 text-red-800 border-red-200",
  }
  return <div className={`text-sm rounded-lg border px-3 py-2 ${map[kind] || map.info}`}>{text}</div>
}

export function ChatMessageRenderer({ spec }: { spec: ChatUISpec }) {
  if (!spec || spec.version !== "1.0") {
    return <Notice kind="warning" text="Unsupported response. Please contact Reza." />
  }
  return (
    <div className="space-y-3">
      {spec.blocks.map((b, i) => {
        switch (b.type) {
          case "property_results":
            return <PropertyResults key={i} {...(b as PropertyResultsBlock)} />
          case "contact_agent":
            return <ContactAgentCard key={i} {...(b as ContactAgentBlock)} />
          case "notice":
            return <Notice key={i} kind={(b as NoticeBlock).kind} text={(b as NoticeBlock).text} />
          case "divider":
            return <hr key={i} className="my-4 border-gray-200" />
          default:
            return <Notice key={i} kind="info" text="Unsupported response. Please contact Reza." />
        }
      })}
    </div>
  )
}

"use client"
import React from "react"
import type { ContactAgentBlock } from "../../../lib/ui-spec"

function onlyDigits(s?: string) {
  return (s || "").replace(/\D+/g, "")
}

export function ContactAgentCard({ agent, context, cta, note }: ContactAgentBlock) {
  const { name, title, phone, whatsApp, email, photoUrl } = agent
  const defaultMsg = `Hi ${name?.split(" ")[0] || "there"}, I'm interested in buying a property.`
  const waHref = cta.whatsapp || (whatsApp ? `https://wa.me/${onlyDigits(whatsApp)}?text=${encodeURIComponent(defaultMsg)}` : undefined)
  const telHref = cta.call || (phone ? `tel:${phone}` : undefined)
  const mailHref = cta.email || (email ? `mailto:${email}?subject=${encodeURIComponent("Buying Inquiry")}` : undefined)

  return (
    <div className="rounded-2xl border shadow p-4 md:p-6 bg-white text-gray-900">
      <div className="flex items-center gap-4">
        {photoUrl ? (
          <img src={photoUrl} alt={name} className="w-14 h-14 rounded-full object-cover border" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-lg font-semibold">
            {name?.[0] || "R"}
          </div>
        )}
        <div>
          <div className="text-lg font-semibold">{name || "Our Lead Agent"}</div>
          {title ? <div className="text-sm text-gray-500">{title}</div> : null}
        </div>
      </div>

      <div className="mt-3 text-sm text-gray-700">
        For buying inquiries, contact our lead agent.
      </div>

      {context?.propertyTitle ? (
        <div className="mt-2 text-sm text-gray-600">Regarding: {context.propertyTitle}</div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
        {telHref && (
          <a href={telHref} className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition" aria-label={`Call ${name}`}>
            Call {name?.split(" ")[0] || "Agent"}
          </a>
        )}
        {waHref && (
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition" aria-label={`WhatsApp ${name}`}>
            WhatsApp {name?.split(" ")[0] || "Agent"}
          </a>
        )}
      </div>

      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
        {mailHref && (
          <a href={mailHref} className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-gray-50 text-gray-900 border hover:bg-gray-100" aria-label={`Email ${name}`}>
            Email
          </a>
        )}
        {cta.scheduleViewing && (
          <a href={cta.scheduleViewing} className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-gray-50 text-gray-900 border hover:bg-gray-100" aria-label="Schedule a viewing">
            Schedule Viewing
          </a>
        )}
        {cta.contactForm && (
          <a href={cta.contactForm} className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-gray-50 text-gray-900 border hover:bg-gray-100" aria-label="Open contact form">
            Contact Form
          </a>
        )}
      </div>

      {note ? <div className="mt-3 text-xs text-gray-500">{note}</div> : null}
    </div>
  )
}
